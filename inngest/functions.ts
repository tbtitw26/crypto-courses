import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { prisma, withPrismaRetry } from "@/lib/prisma";
import type { CustomCourseRequestedEvent, AIStrategyRequestedEvent, CustomCourseEmailDelayedEvent } from "./types";
import { generateCustomCourse as generateCustomCourseLLM } from "@/lib/openai/generate";
import { generateAIStrategy as generateAIStrategyLLM } from "@/lib/openai/generate";
import { generateImage } from "@/lib/openai/generate";
import { generateCoursePdf } from "@/lib/pdf/pdf-generator";
import { uploadPrivateAsset, uploadPublicAsset, encodeSupabasePath } from "@/lib/supabase/storage";
import { GeneratedCourse } from "@/lib/pdf/types";
import { config } from "@/lib/config";
import { sendPdfReadyEmail } from "@/lib/email";

const formatErrorMessage = (error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.slice(0, 500);
};

const courseImagesBucket =
  process.env.SUPABASE_BUCKET_COURSE_IMAGES ?? process.env.SUPABASE_BUCKET_COURSE_MEDIA ?? "course-images";

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
  }
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);

/**
 * Real Custom Course generation pipeline
 * Generates content via LLM, renders PDF, uploads to Supabase Storage
 */
export const generateCustomCourse = inngest.createFunction(
  {
    id: "generate-custom-course",
    concurrency: [
      { limit: 3 }, // Global limit: max 3 concurrent jobs
      { key: "event.data.userId", limit: 1 }, // Per-user limit: 1 job at a time
    ],
    onFailure: async ({ event, error }) => {
      // Ensure job is marked as failed even if main function throws
      const data = event.data as unknown as CustomCourseRequestedEvent;
      const { jobId } = data;
      const statusError = formatErrorMessage(error);
      try {
        await prisma.customCourseRequest.update({
          where: { id: jobId },
          data: {
            status: "failed",
            status_stage: "failed",
            status_progress: 100,
            status_error: statusError,
            status_message: `Generation failed: ${statusError}`,
          },
        });
      } catch (dbError) {
        console.error(`[Inngest onFailure] Failed to update job ${jobId}:`, dbError);
      }
    },
  },
  { event: "custom_course/requested" },
  async ({ event, step }) => {
    const data = event.data as CustomCourseRequestedEvent;
    const { jobId, userId, language } = data;

    try {
      // (A) Load job + guard
      const job = await step.run("db:load-job", async () => {
        return await withPrismaRetry(() =>
          prisma.customCourseRequest.findUnique({
            where: { id: jobId },
          })
        );
      });

      if (!job) {
        throw new NonRetriableError(`Job not found: ${jobId}`);
      }

      // If already ready, exit (idempotency guard)
      if (job.status === "ready") {
        return { ok: true, jobId, alreadyDone: true };
      }

      // (B) Mark processing + stage
      await step.run("db:set-processing", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: {
              status: "processing",
              status_stage: "generating",
              status_progress: 5,
              status_message: "Starting generation...",
              status_error: null,
            },
          })
        );
      });

      // (C) Trace: before LLM
      await step.run("trace:before-llm", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: { status_message: "Generating content via LLM..." },
          })
        );
      });

      // (D) Generate content via LLM only (no PDF, no images)
      const lang = language as 'en' | 'ar';
      const llmResult = await step.run("llm:generate", async () => {
        const result = await generateCustomCourseLLM({
          experienceYears: data.experienceYears,
          depositBudget: data.depositBudget,
          riskTolerance: data.riskTolerance,
          markets: data.markets,
          tradingStyle: data.tradingStyle,
          timeCommitment: data.timeCommitment,
          goalsFreeText: data.goalsFreeText,
          additionalNotes: data.additionalNotes,
          languages: [lang], // Single language per job
        });
        
        // Post-LLM clamp: enforce 2-3 pages limit (hard safety)
        const course = result.course;
        
        // Clamp modules: max 1
        if (course.modules && course.modules.length > 1) {
          course.modules = course.modules.slice(0, 1);
        }
        
        // Clamp lessons: max 2 per module
        if (course.modules && course.modules[0]) {
          if (course.modules[0].lessons && course.modules[0].lessons.length > 2) {
            course.modules[0].lessons = course.modules[0].lessons.slice(0, 2);
          }
          
          // Clamp content_blocks: max 1 per lesson
          course.modules[0].lessons?.forEach((lesson: any) => {
            if (lesson.content_blocks && lesson.content_blocks.length > 1) {
              lesson.content_blocks = lesson.content_blocks.slice(0, 1);
            }
          });
          
          // Clamp checklist: max 3 items
          if (course.modules[0].checklist?.items && course.modules[0].checklist.items.length > 3) {
            course.modules[0].checklist.items = course.modules[0].checklist.items.slice(0, 3);
          }
          
          // Clamp exercise steps: max 3
          if (course.modules[0].exercise?.steps && course.modules[0].exercise.steps.length > 3) {
            course.modules[0].exercise.steps = course.modules[0].exercise.steps.slice(0, 3);
          }
          
          // Clamp risk_box: max 2 points
          if (course.modules[0].risk_box?.points && course.modules[0].risk_box.points.length > 2) {
            course.modules[0].risk_box.points = course.modules[0].risk_box.points.slice(0, 2);
          }
          
          // Clamp module_summary: max 2 takeaways
          if (course.modules[0].module_summary?.key_takeaways && course.modules[0].module_summary.key_takeaways.length > 2) {
            course.modules[0].module_summary.key_takeaways = course.modules[0].module_summary.key_takeaways.slice(0, 2);
          }
        }
        
        // Clamp diagrams: 0 (disabled in Step 4.1)
        if (course.diagrams) {
          course.diagrams = [];
        }
        
        // Clamp glossary: max 4 terms
        if (course.glossary && course.glossary.length > 4) {
          course.glossary = course.glossary.slice(0, 4);
        }
        
        // Clamp quiz: max 3 questions
        if (course.quiz?.questions && course.quiz.questions.length > 3) {
          course.quiz.questions = course.quiz.questions.slice(0, 3);
        }
        
        // Clamp one_page_summary: max 3 sections
        if (course.one_page_summary?.sections && course.one_page_summary.sections.length > 3) {
          course.one_page_summary.sections = course.one_page_summary.sections.slice(0, 3);
          // Clamp bullets per section: max 4
          course.one_page_summary.sections.forEach((section: any) => {
            if (section.bullets && section.bullets.length > 4) {
              section.bullets = section.bullets.slice(0, 4);
            }
          });
        }
        
        // Clamp preface arrays
        if (course.preface) {
          if (course.preface.who_this_is_for && course.preface.who_this_is_for.length > 3) {
            course.preface.who_this_is_for = course.preface.who_this_is_for.slice(0, 3);
          }
          if (course.preface.what_you_will_learn && course.preface.what_you_will_learn.length > 4) {
            course.preface.what_you_will_learn = course.preface.what_you_will_learn.slice(0, 4);
          }
          if (course.preface.what_this_course_will_not_do && course.preface.what_this_course_will_not_do.length > 3) {
            course.preface.what_this_course_will_not_do = course.preface.what_this_course_will_not_do.slice(0, 3);
          }
          if (course.preface.prerequisites && course.preface.prerequisites.length > 2) {
            course.preface.prerequisites = course.preface.prerequisites.slice(0, 2);
          }
        }
        
        // Return only small metadata, not full course object
        return {
          courseId: course.meta.course_id,
          tokens: result.tokens,
          model: result.model,
          // Store clamped course in DB, not in Inngest state
          course,
        };
      });

      // (E) Trace: after LLM
      await step.run("trace:after-llm", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: {
              ai_response_structured: llmResult.course as any,
              status_stage: "rendering",
              status_progress: 40,
              status_message: "Content generated, rendering PDF...",
            },
          })
        );
      });

      // (F) Trace: before PDF
      await step.run("trace:before-pdf", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: { status_message: "Rendering PDF..." },
          })
        );
      });

      // (G) Render PDF and upload to Supabase in one step (don't return buffer)
      // Use course-pdf bucket (private) for PDFs
      const bucket = process.env.SUPABASE_BUCKET_COURSE_PDF ?? process.env.SUPABASE_PDF_BUCKET ?? 'course-pdf';

      const pdfUrl = await step.run("pdf:render-and-upload", async () => {
        // Generate PDF without images (placeholder for cover, empty diagrams)
        const coverImagePlaceholder = ""; // No cover image in Step 4.1
        const diagramPaths: Record<string, { publicPath: string; localPath?: string }> = {}; // No diagrams in Step 4.1

        const pdfResult = await generateCoursePdf(
          llmResult.course,
          coverImagePlaceholder,
          diagramPaths,
          llmResult.courseId,
          lang === 'ar' ? 'AR' : 'EN',
          'custom'
        );

        // Upload PDF to Supabase Storage (private bucket)
        // Path format: custom/${courseId}-${lang}-${jobId}.pdf
        const courseId = llmResult.courseId;
        const filename = `${courseId}-${lang}-${jobId}.pdf`;
        const key = `custom/${filename}`;

        await uploadPrivateAsset(bucket, key, pdfResult.buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

        // Return only supabase:// path (not buffer)
        return encodeSupabasePath(bucket, key);
      });

      // (H) Trace: after PDF
      await step.run("trace:after-pdf", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: {
              status_stage: "uploading",
              status_progress: 85,
              status_message: "PDF uploaded, finalizing...",
            },
          })
        );
      });

      // (I) Mark ready (store path)
      await step.run("db:set-ready", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: {
              status: "ready",
              status_stage: "done",
              status_progress: 100,
              status_message: "Generation completed successfully",
              pdf_url: pdfUrl, // Format: supabase://course-pdf/custom/filename.pdf
              status_error: null,
            },
          })
        );
      });

      // (J) Trigger assets generation (cover/diagrams) as a separate pipeline (if enabled)
      if (config.features.enableCourseImages) {
        await step.run("event:assets-request", async () => {
          await inngest.send({
            id: `custom_course/assets.requested:${jobId}:${language}`,
            name: "custom_course/assets.requested",
            data: {
              jobId,
              userId,
              language,
              type: "custom",
            },
          });
        });
      }

      // (K) Schedule delayed email notification (48-96 hours after PDF generation)
      await step.run("email:schedule-delayed-notification", async () => {
        const user = await withPrismaRetry(() =>
          prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, first_name: true, last_name: true },
          })
        );

        if (user?.email) {
          const userName = `${user.first_name} ${user.last_name || ''}`.trim() || 'User';
          const title = data.goalsFreeText.substring(0, 50) + (data.goalsFreeText.length > 50 ? '...' : '');
          
          // Calculate random delay between 48-96 hours (in milliseconds)
          // 48 hours = 48 * 60 * 60 * 1000 = 172,800,000 ms
          // 96 hours = 96 * 60 * 60 * 1000 = 345,600,000 ms
          const minDelayMs = 48 * 60 * 60 * 1000; // 48 hours
          const maxDelayMs = 96 * 60 * 60 * 1000; // 96 hours
          const randomDelayMs = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
          
          // Calculate scheduled time (timestamp in milliseconds)
          const scheduledTimestamp = Date.now() + randomDelayMs;
          const scheduledTime = new Date(scheduledTimestamp);
          
          console.log(`[Inngest] Scheduling email for custom course ${jobId} at ${scheduledTime.toISOString()} (${Math.round(randomDelayMs / (60 * 60 * 1000))} hours delay)`);
          
          // Send delayed event (ts is timestamp in milliseconds)
          await inngest.send({
            id: `custom_course/email.delayed:${jobId}:${language}`,
            name: "custom_course/email.delayed",
            data: {
              jobId,
              userId,
              language,
              userEmail: user.email,
              userName,
              title,
            } as CustomCourseEmailDelayedEvent,
            ts: scheduledTimestamp, // Schedule event for future time (timestamp in milliseconds)
          });
          
          // Update email status in DB (mark as scheduled, not sent yet)
          await withPrismaRetry(() =>
            prisma.customCourseRequest.update({
              where: { id: jobId },
              data: {
                email_status: 'scheduled',
                email_sent_at: null,
                email_error: null,
                email_message_id: null,
              },
            })
          );
        }
      });

      // Return only small metadata (not PDF buffer)
      return { ok: true, jobId, pdfUrl };
    } catch (error) {
      // Handle errors: mark job as failed
      const errorMessage = formatErrorMessage(error);

      await step.run("db:set-failed", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: {
              status: "failed",
              status_stage: "failed",
              status_progress: 100,
              status_error: errorMessage,
              status_message: `Generation failed: ${errorMessage}`,
            },
          })
        );
      });

      // Re-throw to let Inngest handle retries (unless NonRetriableError)
      throw error;
    }
  }
);

/**
 * Real AI Strategy generation pipeline
 * Generates content via LLM, renders PDF, uploads to Supabase Storage
 */
export const generateAIStrategy = inngest.createFunction(
  {
    id: "generate-ai-strategy",
    concurrency: [
      { limit: 3 }, // Global limit: max 3 concurrent jobs
      { key: "event.data.userId", limit: 1 }, // Per-user limit: 1 job at a time
    ],
    onFailure: async ({ event, error }) => {
      // Ensure job is marked as failed even if main function throws
      const data = event.data as unknown as AIStrategyRequestedEvent;
      const { jobId } = data;
      const statusError = formatErrorMessage(error);
      try {
        await prisma.aiStrategyRun.update({
          where: { id: jobId },
          data: {
            status: "failed",
            status_stage: "failed",
            status_progress: 100,
            status_error: statusError,
            status_message: `Generation failed: ${statusError}`,
          },
        });
      } catch (dbError) {
        console.error(`[Inngest onFailure] Failed to update job ${jobId}:`, dbError);
      }
    },
  },
  { event: "ai_strategy/requested" },
  async ({ event, step }) => {
    const data = event.data as AIStrategyRequestedEvent;
    const { jobId, userId, language } = data;

    try {
      // (A) Load job + guard
      const job = await step.run("db:load-job", async () => {
        return await withPrismaRetry(() =>
          prisma.aiStrategyRun.findUnique({
            where: { id: jobId },
          })
        );
      });

      if (!job) {
        throw new NonRetriableError(`Job not found: ${jobId}`);
      }

      // If already ready, exit (idempotency guard)
      if (job.status === "ready") {
        return { ok: true, jobId, alreadyDone: true };
      }

      // (B) Mark processing + stage
      await step.run("db:set-processing", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: {
              status: "processing",
              status_stage: "generating",
              status_progress: 5,
              status_message: "Starting generation...",
              status_error: null,
            },
          })
        );
      });

      // (C) Trace: before LLM
      await step.run("trace:before-llm", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: { status_message: "Generating content via LLM..." },
          })
        );
      });

      // (D) Generate content via LLM only (no PDF, no images)
      const lang = language as 'en' | 'ar';
      const llmResult = await step.run("llm:generate", async () => {
        const result = await generateAIStrategyLLM({
          experienceYears: data.experienceYears,
          depositBudget: data.depositBudget,
          riskTolerance: data.riskTolerance,
          markets: data.markets,
          tradingStyle: data.tradingStyle,
          timeCommitment: data.timeCommitment,
          mainObjective: data.mainObjective,
          market: data.market,
          timeframe: data.timeframe,
          riskPerTrade: data.riskPerTrade,
          maxTrades: data.maxTrades,
          instruments: data.instruments,
          focus: data.focus,
          detailLevel: data.detailLevel,
          language: lang, // Single language per job
        });
        
        // Post-LLM clamp: enforce 2-3 pages limit (hard safety)
        const course = result.course;
        
        // Clamp modules: max 2
        if (course.modules && course.modules.length > 2) {
          course.modules = course.modules.slice(0, 2);
        }
        
        // Clamp lessons: max 2 per module
        course.modules?.forEach((module: any) => {
          if (module.lessons && module.lessons.length > 2) {
            module.lessons = module.lessons.slice(0, 2);
          }
          
          // Clamp content_blocks: max 1 per lesson
          module.lessons?.forEach((lesson: any) => {
            if (lesson.content_blocks && lesson.content_blocks.length > 1) {
              lesson.content_blocks = lesson.content_blocks.slice(0, 1);
            }
          });
          
          // Clamp checklist: max 3 items
          if (module.checklist?.items && module.checklist.items.length > 3) {
            module.checklist.items = module.checklist.items.slice(0, 3);
          }
          
          // Clamp exercise steps: max 2
          if (module.exercise?.steps && module.exercise.steps.length > 2) {
            module.exercise.steps = module.exercise.steps.slice(0, 2);
          }
          
          // Clamp risk_box: max 2 points
          if (module.risk_box?.points && module.risk_box.points.length > 2) {
            module.risk_box.points = module.risk_box.points.slice(0, 2);
          }
          
          // Clamp module_summary: max 2 takeaways
          if (module.module_summary?.key_takeaways && module.module_summary.key_takeaways.length > 2) {
            module.module_summary.key_takeaways = module.module_summary.key_takeaways.slice(0, 2);
          }
        });
        
        // Clamp diagrams: 0 (disabled in Step 4.1)
        if (course.diagrams) {
          course.diagrams = [];
        }
        
        // Clamp glossary: max 3 terms
        if (course.glossary && course.glossary.length > 3) {
          course.glossary = course.glossary.slice(0, 3);
        }
        
        // Clamp quiz: max 2 questions
        if (course.quiz?.questions && course.quiz.questions.length > 2) {
          course.quiz.questions = course.quiz.questions.slice(0, 2);
        }
        
        // Clamp one_page_summary: max 3 sections
        if (course.one_page_summary?.sections && course.one_page_summary.sections.length > 3) {
          course.one_page_summary.sections = course.one_page_summary.sections.slice(0, 3);
          // Clamp bullets per section: max 4
          course.one_page_summary.sections.forEach((section: any) => {
            if (section.bullets && section.bullets.length > 4) {
              section.bullets = section.bullets.slice(0, 4);
            }
          });
        }
        
        // Clamp preface arrays
        if (course.preface) {
          if (course.preface.who_this_is_for && course.preface.who_this_is_for.length > 3) {
            course.preface.who_this_is_for = course.preface.who_this_is_for.slice(0, 3);
          }
          if (course.preface.what_you_will_learn && course.preface.what_you_will_learn.length > 4) {
            course.preface.what_you_will_learn = course.preface.what_you_will_learn.slice(0, 4);
          }
          if (course.preface.what_this_course_will_not_do && course.preface.what_this_course_will_not_do.length > 3) {
            course.preface.what_this_course_will_not_do = course.preface.what_this_course_will_not_do.slice(0, 3);
          }
          if (course.preface.prerequisites && course.preface.prerequisites.length > 2) {
            course.preface.prerequisites = course.preface.prerequisites.slice(0, 2);
          }
        }
        
        // Return only small metadata, not full course object
        return {
          courseId: course.meta.course_id,
          tokens: result.tokens,
          model: result.model,
          // Store clamped course in DB, not in Inngest state
          course,
        };
      });

      // (E) Trace: after LLM
      await step.run("trace:after-llm", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: {
              ai_response_structured: llmResult.course as any,
              rendered_text: JSON.stringify(llmResult.course),
              prompt_tokens: llmResult.tokens.prompt,
              completion_tokens: llmResult.tokens.completion,
              total_tokens: llmResult.tokens.total,
              ai_model: llmResult.model,
              status_stage: "rendering",
              status_progress: 40,
              status_message: "Content generated, rendering PDF...",
            },
          })
        );
      });

      // (F) Trace: before PDF
      await step.run("trace:before-pdf", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: { status_message: "Rendering PDF..." },
          })
        );
      });

      // (G) Render PDF and upload to Supabase in one step (don't return buffer)
      // Use course-pdf bucket (private) for PDFs
      const bucket = process.env.SUPABASE_BUCKET_COURSE_PDF ?? process.env.SUPABASE_PDF_BUCKET ?? 'course-pdf';

      const pdfUrl = await step.run("pdf:render-and-upload", async () => {
        // Generate PDF without images (placeholder for cover, empty diagrams)
        const coverImagePlaceholder = ""; // No cover image in Step 4.1
        const diagramPaths: Record<string, { publicPath: string; localPath?: string }> = {}; // No diagrams in Step 4.1

        const pdfResult = await generateCoursePdf(
          llmResult.course,
          coverImagePlaceholder,
          diagramPaths,
          llmResult.courseId,
          lang === 'ar' ? 'AR' : 'EN',
          'ai-strategy'
        );

        // Upload PDF to Supabase Storage (private bucket)
        // Path format: ai-strategy/${courseId}-${lang}-${jobId}.pdf
        const courseId = llmResult.courseId;
        const filename = `${courseId}-${lang}-${jobId}.pdf`;
        const key = `ai-strategy/${filename}`;

        await uploadPrivateAsset(bucket, key, pdfResult.buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

        // Return only supabase:// path (not buffer)
        return encodeSupabasePath(bucket, key);
      });

      // (H) Trace: after PDF
      await step.run("trace:after-pdf", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: {
              status_stage: "uploading",
              status_progress: 85,
              status_message: "PDF uploaded, finalizing...",
            },
          })
        );
      });

      // (I) Mark ready (store path)
      await step.run("db:set-ready", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: {
              status: "ready",
              status_stage: "done",
              status_progress: 100,
              status_message: "Generation completed successfully",
              pdf_url: pdfUrl, // Format: supabase://course-pdf/ai-strategy/filename.pdf
              status_error: null,
            },
          })
        );
      });

      // (J) Trigger assets generation (cover/diagrams) as a separate pipeline (if enabled)
      if (config.features.enableCourseImages) {
        await step.run("event:assets-request", async () => {
          await inngest.send({
            id: `ai_strategy/assets.requested:${jobId}:${language}`,
            name: "ai_strategy/assets.requested",
            data: {
              jobId,
              userId,
              language,
              type: "ai",
            },
          });
        });
      }

      // (K) Send email notification with download link
      await step.run("email:send-notification", async () => {
        const user = await withPrismaRetry(() =>
          prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, first_name: true, last_name: true },
          })
        );

        if (user?.email) {
          const userName = `${user.first_name} ${user.last_name || ''}`.trim() || 'User';
          const title = data.mainObjective.substring(0, 50) + (data.mainObjective.length > 50 ? '...' : '');
          
          const emailResult = await sendPdfReadyEmail({
            userEmail: user.email,
            userName,
            jobId,
            type: 'ai-strategy',
            title,
            locale: language === 'ar' ? 'ar' : 'en',
          });

          // Update email status in DB
          await withPrismaRetry(() =>
            prisma.aiStrategyRun.update({
              where: { id: jobId },
              data: {
                email_status: emailResult.error ? 'failed' : 'sent',
                email_sent_at: emailResult.error ? null : new Date(),
                email_error: emailResult.error || null,
                email_message_id: emailResult.messageId || null,
              },
            })
          );
        }
      });

      // Return only small metadata (not PDF buffer)
      return { ok: true, jobId, pdfUrl };
    } catch (error) {
      // Handle errors: mark job as failed
      const errorMessage = formatErrorMessage(error);

      await step.run("db:set-failed", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: {
              status: "failed",
              status_stage: "failed",
              status_progress: 100,
              status_error: errorMessage,
              status_message: `Generation failed: ${errorMessage}`,
            },
          })
        );
      });

      // Re-throw to let Inngest handle retries (unless NonRetriableError)
      throw error;
    }
  }
);

/**
 * Watchdog to fail stuck jobs (processing too long)
 * Cron: every 5 minutes
 */
export const watchdogFailStuckJobs = inngest.createFunction(
  { id: "watchdog-fail-stuck-jobs" },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    const timeoutMinutes = Number(process.env.JOB_TIMEOUT_MINUTES ?? "20");
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const timeoutMessage = "Timeout: job exceeded processing window";

    const custom = await step.run("watchdog:custom-courses", async () => {
      const stuck = await withPrismaRetry(() =>
        prisma.customCourseRequest.findMany({
          where: {
            status: "processing",
            updated_at: { lt: cutoff },
          },
          select: { id: true },
        })
      );

      if (stuck.length > 0) {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.updateMany({
            where: { id: { in: stuck.map((s) => s.id) } },
            data: {
              status: "failed",
              status_stage: "timeout",
              status_progress: 100,
              status_message: timeoutMessage,
              status_error: timeoutMessage,
            },
          })
        );
      }

      return { count: stuck.length };
    });

    const ai = await step.run("watchdog:ai-strategy", async () => {
      const stuck = await withPrismaRetry(() =>
        prisma.aiStrategyRun.findMany({
          where: {
            status: "processing",
            updated_at: { lt: cutoff },
          },
          select: { id: true },
        })
      );

      if (stuck.length > 0) {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.updateMany({
            where: { id: { in: stuck.map((s) => s.id) } },
            data: {
              status: "failed",
              status_stage: "timeout",
              status_progress: 100,
              status_message: timeoutMessage,
              status_error: timeoutMessage,
            },
          })
        );
      }

      return { count: stuck.length };
    });

    return {
      timeoutMinutes,
      customFailed: custom.count,
      aiFailed: ai.count,
    };
  }
);

/**
 * Send delayed email notification for custom course PDF ready
 * This function is triggered 48-96 hours after PDF generation
 */
export const sendCustomCourseDelayedEmail = inngest.createFunction(
  {
    id: "send-custom-course-delayed-email",
    concurrency: [{ limit: 10 }], // Allow multiple emails to be sent concurrently
  },
  { event: "custom_course/email.delayed" },
  async ({ event, step }) => {
    const data = event.data as CustomCourseEmailDelayedEvent;
    const { jobId, userId, language, userEmail, userName, title } = data;

    await step.run("email:send-delayed-notification", async () => {
      // Verify job still exists and is ready
      const job = await withPrismaRetry(() =>
        prisma.customCourseRequest.findUnique({
          where: { id: jobId },
          select: {
            id: true,
            status: true,
            user_id: true,
            pdf_url: true,
          },
        })
      );

      if (!job) {
        console.error(`[Inngest] Job ${jobId} not found, skipping email`);
        return { skipped: true, reason: "job_not_found" };
      }

      if (job.user_id !== userId) {
        console.error(`[Inngest] User ${userId} does not own job ${jobId}, skipping email`);
        return { skipped: true, reason: "unauthorized" };
      }

      if (job.status !== "ready") {
        console.error(`[Inngest] Job ${jobId} status is ${job.status}, not ready, skipping email`);
        return { skipped: true, reason: "job_not_ready", status: job.status };
      }

      // Send email
      const emailResult = await sendPdfReadyEmail({
        userEmail,
        userName,
        jobId,
        type: "custom",
        title,
        locale: language === "ar" ? "ar" : "en",
      });

      // Update email status in DB
      await withPrismaRetry(() =>
        prisma.customCourseRequest.update({
          where: { id: jobId },
          data: {
            email_status: emailResult.error ? "failed" : "sent",
            email_sent_at: emailResult.error ? null : new Date(),
            email_error: emailResult.error || null,
            email_message_id: emailResult.messageId || null,
          },
        })
      );

      console.log(`[Inngest] Delayed email ${emailResult.error ? "failed" : "sent"} for custom course ${jobId}`);

      return {
        success: !emailResult.error,
        error: emailResult.error,
        messageId: emailResult.messageId,
      };
    });

    return { ok: true, jobId };
  }
);

/**
 * Generate assets (cover/diagrams) for custom course after job is ready
 */
export const generateCustomCourseAssets = inngest.createFunction(
  {
    id: "generate-custom-course-assets",
    concurrency: [{ limit: 2 }],
    onFailure: async ({ event, error }) => {
      const data = event.data as unknown as { jobId: number };
      const statusError = formatErrorMessage(error);
      if (!data?.jobId) return;
      try {
        await prisma.customCourseRequest.update({
          where: { id: data.jobId },
          data: {
            assets_status: "failed" as any,
            assets_error: statusError as any,
          },
        });
      } catch (dbError) {
        console.error("[assets onFailure custom course] failed to update job", dbError);
      }
    },
  },
  { event: "custom_course/assets.requested" },
  async ({ event, step }) => {
    const data = event.data as { jobId: number; userId: number; language: string };
    const { jobId, userId, language } = data;
    const lang = (language || "en") as "en" | "ar";

    const timeoutSafe = formatErrorMessage;

    try {
      // Load job
      const job = await step.run("db:load-job", async () => {
        return (await withPrismaRetry(() =>
          prisma.customCourseRequest.findUnique({
            where: { id: jobId },
            select: {
              id: true,
              user_id: true,
              language: true,
              markets: true,
              goals_free_text: true,
              ai_response_structured: true,
              cover_path: true,
              diagram_paths: true,
            },
          })
        )) as any;
      });

      if (!job) {
        throw new NonRetriableError(`Job not found: ${jobId}`);
      }
      if (job.user_id !== userId) {
        throw new NonRetriableError(`Job ${jobId} does not belong to user ${userId}`);
      }

      // Mark assets processing
      await step.run("db:set-assets-processing", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: {
              assets_status: "processing" as any,
              assets_error: null,
            },
          })
        );
      });

      // Generate cover
      const coverPath = await step.run("images:cover-upload", async () => {
        const markets = Array.isArray(job.markets) ? job.markets.join(", ") : "";
        const prompt = `Professional cover image for a custom trading course. Markets: ${markets}. Goal: ${job.goals_free_text || "trading education"}. Style: clean, modern, education-only.`;
        const { url } = await generateImage({
          prompt,
          size: "1024x1536",
          quality: "medium",
          n: 1,
        });
        const buffer = await downloadBuffer(url);
        const key = `covers/custom/${userId}/${jobId}-${lang}.webp`;
        await uploadPublicAsset(courseImagesBucket, key, buffer, {
          contentType: "image/webp",
          upsert: true,
        });
        return encodeSupabasePath(courseImagesBucket, key);
      });

      // Diagrams (optional) - keep empty for now to stay within limits
      const diagramPaths: string[] = [];

      // Mark assets ready
      await step.run("db:set-assets-ready", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: {
              assets_status: "ready" as any,
              assets_error: null,
              cover_path: coverPath as any,
              diagram_paths: diagramPaths as any,
            },
          })
        );
      });

      return { ok: true, jobId, coverPath, diagramPaths };
    } catch (error) {
      const errMsg = timeoutSafe(error);
      await step.run("db:set-assets-failed", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: {
              assets_status: "failed" as any,
              assets_error: errMsg as any,
            },
          })
        );
      });
      throw error;
    }
  }
);

/**
 * Generate assets (cover/diagrams) for AI strategy after job is ready
 */
export const generateAIStrategyAssets = inngest.createFunction(
  {
    id: "generate-ai-strategy-assets",
    concurrency: [{ limit: 2 }],
    onFailure: async ({ event, error }) => {
      const data = event.data as unknown as { jobId: number };
      const statusError = formatErrorMessage(error);
      if (!data?.jobId) return;
      try {
        await prisma.aiStrategyRun.update({
          where: { id: data.jobId },
          data: {
            assets_status: "failed" as any,
            assets_error: statusError as any,
          },
        });
      } catch (dbError) {
        console.error("[assets onFailure ai strategy] failed to update job", dbError);
      }
    },
  },
  { event: "ai_strategy/assets.requested" },
  async ({ event, step }) => {
    const data = event.data as { jobId: number; userId: number; language: string };
    const { jobId, userId, language } = data;
    const lang = (language || "en") as "en" | "ar";

    try {
      // Load job
      const job = await step.run("db:load-job", async () => {
        return (await withPrismaRetry(() =>
          prisma.aiStrategyRun.findUnique({
            where: { id: jobId },
            select: {
              id: true,
              user_id: true,
              language: true,
              main_objective: true,
              markets: true,
              cover_path: true,
              diagram_paths: true,
            },
          })
        )) as any;
      });

      if (!job) {
        throw new NonRetriableError(`AI strategy job not found: ${jobId}`);
      }
      if (job.user_id !== userId) {
        throw new NonRetriableError(`Job ${jobId} does not belong to user ${userId}`);
      }

      // Mark assets processing
      await step.run("db:set-assets-processing", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: {
              assets_status: "processing" as any,
              assets_error: null,
            },
          })
        );
      });

      // Generate cover
      const coverPath = await step.run("images:cover-upload", async () => {
        const markets = Array.isArray(job.markets) ? job.markets.join(", ") : "";
        const prompt = `Professional cover image for an AI trading strategy. Markets: ${markets}. Objective: ${job.main_objective || "strategy"}. Style: clean, modern, education-only.`;
        const { url } = await generateImage({
          prompt,
          size: "1024x1536",
          quality: "medium",
          n: 1,
        });
        const buffer = await downloadBuffer(url);
        const key = `covers/ai-strategy/${userId}/${jobId}-${lang}.webp`;
        await uploadPublicAsset(courseImagesBucket, key, buffer, {
          contentType: "image/webp",
          upsert: true,
        });
        return encodeSupabasePath(courseImagesBucket, key);
      });

      // Diagrams (optional) - keep empty for now
      const diagramPaths: string[] = [];

      // Mark assets ready
      await step.run("db:set-assets-ready", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: {
              assets_status: "ready" as any,
              assets_error: null,
              cover_path: coverPath as any,
              diagram_paths: diagramPaths as any,
            },
          })
        );
      });

      return { ok: true, jobId, coverPath, diagramPaths };
    } catch (error) {
      const errMsg = formatErrorMessage(error);
      await step.run("db:set-assets-failed", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: {
              assets_status: "failed" as any,
              assets_error: errMsg as any,
            },
          })
        );
      });
      throw error;
    }
  }
);

