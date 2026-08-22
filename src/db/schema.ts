import { z } from 'zod';

// ---------------------------------------------------------------------------
// Content Block Payload Schemas
// Matches the JSONB structure in the `content_blocks` table (migration 0002)
// ---------------------------------------------------------------------------

export const ContentBlockVideoPayloadSchema = z.object({
  video_id: z.string().uuid(),
});

export const ContentBlockTextPayloadSchema = z.object({
  content_markdown: z.string(),
});

export const ContentBlockFilePayloadSchema = z.object({
  storage_path: z.string(),
  file_name: z.string(),
  mime_type: z.string(),
});

export const ContentBlockAssessmentPayloadSchema = z.object({
  assessment_id: z.string().uuid(),
});

// A strict union based on block_type string
export const ContentBlockPayloadSchema = z.union([
  ContentBlockVideoPayloadSchema,
  ContentBlockTextPayloadSchema,
  ContentBlockFilePayloadSchema,
  ContentBlockAssessmentPayloadSchema,
]);

export type ContentBlockVideoPayload = z.infer<typeof ContentBlockVideoPayloadSchema>;
export type ContentBlockTextPayload = z.infer<typeof ContentBlockTextPayloadSchema>;
export type ContentBlockFilePayload = z.infer<typeof ContentBlockFilePayloadSchema>;
export type ContentBlockAssessmentPayload = z.infer<typeof ContentBlockAssessmentPayloadSchema>;
export type ContentBlockPayload = z.infer<typeof ContentBlockPayloadSchema>;
