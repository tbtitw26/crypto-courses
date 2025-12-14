import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { prisma, withPrismaRetry } from "@/lib/prisma";
import type { CustomCourseRequestedEvent, AIStrategyRequestedEvent } from "./types";
import { generateCustomCourse as generateCustomCourseLLM } from "@/lib/openai/generate";
import { generateAIStrategy as generateAIStrategyLLM } from "@/lib/openai/generate";
import { generateCoursePdf } from "@/lib/pdf/pdf-generator";
import { uploadPrivateAsset, encodeSupabasePath } from "@/lib/supabase/storage";
import { GeneratedCourse } from "@/lib/pdf/types";

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
      { limit: 5 }, // Global limit: max 5 concurrent jobs
      { key: "event.data.userId", limit: 1 }, // Per-user limit: 1 job at a time
    ],
    onFailure: async ({ event, error }) => {
      // Ensure job is marked as failed even if main function throws
      const data = event.data as CustomCourseRequestedEvent;
      const { jobId } = data;
      try {
        await prisma.customCourseRequest.update({
          where: { id: jobId },
          data: {
            status: "failed",
            status_stage: "error",
            status_error: error instanceof Error ? error.message : String(error),
            status_message: `Generation failed: ${error instanceof Error ? error.message : String(error)}`,
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

      // Return only small metadata (not PDF buffer)
      return { ok: true, jobId, pdfUrl };
    } catch (error) {
      // Handle errors: mark job as failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await step.run("db:set-failed", async () => {
        await withPrismaRetry(() =>
          prisma.customCourseRequest.update({
            where: { id: jobId },
            data: {
              status: "failed",
              status_stage: "error",
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
      { limit: 5 }, // Global limit: max 5 concurrent jobs
      { key: "event.data.userId", limit: 1 }, // Per-user limit: 1 job at a time
    ],
    onFailure: async ({ event, error }) => {
      // Ensure job is marked as failed even if main function throws
      const data = event.data as AIStrategyRequestedEvent;
      const { jobId } = data;
      try {
        await prisma.aiStrategyRun.update({
          where: { id: jobId },
          data: {
            status: "failed",
            status_stage: "error",
            status_error: error instanceof Error ? error.message : String(error),
            status_message: `Generation failed: ${error instanceof Error ? error.message : String(error)}`,
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

      // Return only small metadata (not PDF buffer)
      return { ok: true, jobId, pdfUrl };
    } catch (error) {
      // Handle errors: mark job as failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await step.run("db:set-failed", async () => {
        await withPrismaRetry(() =>
          prisma.aiStrategyRun.update({
            where: { id: jobId },
            data: {
              status: "failed",
              status_stage: "error",
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

