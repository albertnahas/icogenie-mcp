/**
 * generate_icon tool - Generate single icon preview
 */

import { z } from 'zod';
import { generate, readReferenceImage, type ReferenceImage } from '../api/client.js';

export const generateIconSchema = {
  prompt: z.string().describe(
    'Icon concept to generate. Keep it minimal - the system normalizes and enhances prompts internally. Verbose descriptions create cluttered icons.'
  ),
  style: z.enum(['solid', 'outline', 'illustration']).default('solid').describe('Icon style: solid (filled shapes), outline (stroked lines), or illustration (colorful, detailed)'),
  variations: z
    .union([z.literal(1), z.literal(2), z.literal(4)])
    .default(1)
    .describe('Number of variations (1, 2, or 4)'),
  referenceImagePath: z
    .string()
    .optional()
    .describe('Local file path to reference image for style extraction'),
  referenceImage: z
    .object({
      data: z.string().describe('Base64-encoded image data'),
      mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
    })
    .optional()
    .describe('Base64-encoded reference image'),
};

export async function generateIcon(args: {
  prompt: string;
  style?: 'solid' | 'outline' | 'illustration';
  variations?: 1 | 2 | 4;
  referenceImagePath?: string;
  referenceImage?: { data: string; mimeType: string };
}) {
  let refImage: ReferenceImage | undefined;

  // Prefer file path over inline base64
  if (args.referenceImagePath) {
    refImage = readReferenceImage(args.referenceImagePath);
  } else if (args.referenceImage) {
    refImage = args.referenceImage as ReferenceImage;
  }

  const result = await generate({
    prompt: args.prompt,
    style: args.style || 'solid',
    variations: args.variations || 1,
    referenceImage: refImage,
  });

  return {
    sessionId: result.sessionId,
    preview: result.preview,
    previews: result.previews,
    creditsRemaining: result.credits,
    sessionData: result.sessionData,
    suggestions: result.suggestions,
  };
}
