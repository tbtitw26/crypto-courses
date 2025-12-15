import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import {
  helloWorld,
  generateCustomCourse,
  generateAIStrategy,
  watchdogFailStuckJobs,
  generateCustomCourseAssets,
  generateAIStrategyAssets,
} from "../../../inngest/functions";

// Ensure Node runtime (recommended for Inngest on Vercel)
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max for Vercel Hobby

// Serve Inngest functions over HTTP at /api/inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld,
    generateCustomCourse,
    generateAIStrategy,
    watchdogFailStuckJobs,
    generateCustomCourseAssets,
    generateAIStrategyAssets,
  ],
});

