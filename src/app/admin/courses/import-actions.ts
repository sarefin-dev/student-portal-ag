'use server';

import { createClient } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { getCloudAI, getAllConfiguredModels } from '@/lib/ai/openrouter';
import { ollama } from 'ai-sdk-ollama';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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

    const cloudAI = await getCloudAI();
    const modelsToTry = getAllConfiguredModels();
    let result: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        result = await aiCall(cloudAI(modelName));
        if (result) break;
      } catch (err: any) {
        console.warn(`Model ${modelName} failed during course import:`, err?.message || err);
        lastError = err;
      }
    }

    if (!result && process.env.OLLAMA_MODEL) {
      try {
        result = await aiCall(ollama(process.env.OLLAMA_MODEL));
      } catch (err) {
        lastError = err;
      }
    }

    if (!result) {
      throw new Error(`All configured AI models failed: ${lastError?.message || 'Upstream service unavailable'}`);
    }

    const object = result.object;

    // Call the Database RPC to bulk insert
    const { data: courseId, error } = await supabase.rpc('import_course_tree', {
      payload: object,
      p_instructor_id: user.id
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


const ModuleSchema = z.object({
  title: z.string(),
  submodules: z.array(z.object({
    title: z.string(),
    lessons: z.array(z.object({
      title: z.string(),
      contentBlocks: z.array(z.object({
        type: z.enum(['text', 'video', 'pdf', 'quiz']),
        content: z.string()
      }))
    }))
  }))
});

const SubmoduleSchema = z.object({
  title: z.string(),
  lessons: z.array(z.object({
    title: z.string(),
    contentBlocks: z.array(z.object({
      type: z.enum(['text', 'video', 'pdf', 'quiz']),
      content: z.string()
    }))
  }))
});

export async function importModuleFromText(courseId: string, syllabusText: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const aiCall = async (modelConfig: any) => {
      return await generateObject({
        model: modelConfig,
        schema: ModuleSchema,
        prompt: `You are an expert LMS curriculum architect. Parse the following text into a single Module structure (with submodules and lessons). Create detailed contentBlocks for each lesson.\n\nText to parse:\n"""\n${syllabusText}\n"""`
      });
    };

    const cloudAI = await getCloudAI();
    const modelsToTry = getAllConfiguredModels();
    let result: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        result = await aiCall(cloudAI(modelName));
        if (result) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!result && process.env.OLLAMA_MODEL) {
      try {
        result = await aiCall(ollama(process.env.OLLAMA_MODEL));
      } catch (err) {
        lastError = err;
      }
    }

    if (!result) {
      throw new Error(`All configured AI models failed: ${lastError?.message || 'Upstream service unavailable'}`);
    }

    const { error } = await supabase.rpc('import_module_tree', {
      payload: result.object,
      p_course_id: courseId
    });

    if (error) throw error;
    revalidatePath(`/admin/courses/${courseId}/builder`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to process text" };
  }
}

export async function importSubmoduleFromText(courseId: string, moduleId: string, syllabusText: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const aiCall = async (modelConfig: any) => {
      return await generateObject({
        model: modelConfig,
        schema: SubmoduleSchema,
        prompt: `You are an expert LMS curriculum architect. Parse the following text into a single Submodule structure (with lessons). Create detailed contentBlocks for each lesson.\n\nText to parse:\n"""\n${syllabusText}\n"""`
      });
    };

    const cloudAI = await getCloudAI();
    const modelsToTry = getAllConfiguredModels();
    let result: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        result = await aiCall(cloudAI(modelName));
        if (result) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!result && process.env.OLLAMA_MODEL) {
      try {
        result = await aiCall(ollama(process.env.OLLAMA_MODEL));
      } catch (err) {
        lastError = err;
      }
    }

    if (!result) {
      throw new Error(`All configured AI models failed: ${lastError?.message || 'Upstream service unavailable'}`);
    }

    const { error } = await supabase.rpc('import_submodule_tree', {
      payload: result.object,
      p_module_id: moduleId
    });

    if (error) throw error;
    revalidatePath(`/admin/courses/${courseId}/builder`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to process text" };
  }
}


