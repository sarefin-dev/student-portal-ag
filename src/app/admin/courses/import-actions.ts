'use server';

import { createClient } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { ollama } from 'ai-sdk-ollama';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

const CourseSchema = z.object({
  title: z.string(),
  type: z.enum(['live_cohort', 'recorded', 'in_person', 'text_based', 'mixed']).default('recorded'),
  description: z.string().optional(),
  routine: z.object({
    name: z.string(),
    sessions: z.array(z.object({
      title: z.string(),
      scheduled_at: z.string().describe("ISO 8601 Datetime string. Extrapolate exact dates based on the syllabus. If year is missing, assume current year."),
      duration_minutes: z.number().default(60),
      meeting_url: z.string().optional()
    }))
  }).optional(),
  modules: z.array(z.object({
    title: z.string(),
    submodules: z.array(z.object({
      title: z.string(),
      lessons: z.array(z.object({
        title: z.string(),
        video_url: z.string().optional().describe("If a video URL is provided, include it"),
        text_content: z.string().optional().describe("Detailed description, text content, or instructions for the lesson")
      }))
    }))
  }))
});

export async function importCourseFromText(syllabusText: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const aiCall = async (modelConfig: any) => {
      return await generateObject({
        model: modelConfig,
        schema: CourseSchema,
        prompt: `You are an expert LMS curriculum architect. Parse the following plain-text syllabus into our strict JSON schema. Extract the course title, instructor, modules, submodules, and lessons. If there is a routine or schedule provided, calculate the exact ISO datetimes for each class and include them in the routine object.

Text to parse:
"""
${syllabusText}
"""
        `
      });
    };

    let result;
    try {
      // 1. Try Localhost First (Free)
      result = await aiCall(ollama('llama3.3'));
      console.log("Course imported successfully using Local Ollama");
    } catch (localErr) {
      console.log("Ollama failed, falling back to Gemini...", localErr);
      try {
        // 2. Try Gemini
        result = await aiCall(google('gemini-2.5-pro'));
        console.log("Course imported successfully using Gemini");
      } catch (geminiErr) {
        console.log("Gemini failed, falling back to DeepSeek...", geminiErr);
        // 3. Try Deepseek
        result = await aiCall(deepseek('deepseek-chat'));
        console.log("Course imported successfully using DeepSeek");
      }
    }

    const object = result.object;

    // Call the Database RPC to bulk insert
    const { data: courseId, error } = await supabase.rpc('import_course_tree', {
      payload: object,
      instructor_id: user.id
    });

    if (error) {
      console.error("RPC Error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/courses');
    return { success: true, courseId };

  } catch (err: any) {
    console.error("AI Parsing error:", err);
    return { success: false, error: err.message || "Failed to process text" };
  }
}
