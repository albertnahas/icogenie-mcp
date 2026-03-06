/**
 * generate_icon tool - Generate single icon preview
 */

import { z } from 'zod';
import { generate, listStyles, readReferenceImage, type ReferenceImage } from '../api/client.js';

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
  model: z.enum(['fast', 'precise']).default('fast').describe('Generation model: fast (Gemini raster + vectorize) or precise (Recraft V4 native vector)'),
  styleRef: z.string().optional().describe('Style library preset name (from list_styles). Resolves to style reference automatically.'),
  force: z.boolean().optional().describe('Proceed even when the AI detects style conflicts with the prompt'),
};

export async function generateIcon(args: {
  prompt: string;
  style?: 'solid' | 'outline' | 'illustration';
  model?: 'fast' | 'precise';
  variations?: 1 | 2 | 4;
  referenceImagePath?: string;
  referenceImage?: { data: string; mimeType: string };
  styleRef?: string;
  force?: boolean;
}) {
  let refImage: ReferenceImage | undefined;

  // Prefer file path over inline base64
  if (args.referenceImagePath) {
    refImage = readReferenceImage(args.referenceImagePath);
  } else if (args.referenceImage) {
    refImage = args.referenceImage as ReferenceImage;
  }

  // Resolve style reference by name
  let styleReferenceItemId: string | undefined;
  if (args.styleRef) {
    const stylesResult = await listStyles({ baseStyle: args.style || 'solid' });
    const match = stylesResult.items.find(
      s => s.name.toLowerCase() === args.styleRef!.toLowerCase()
    );
    if (match) {
      styleReferenceItemId = match.id;
    }
  }

  const result = await generate({
    prompt: args.prompt,
    style: args.style || 'solid',
    model: args.model || 'fast',
    variations: args.variations || 1,
    referenceImage: refImage,
    styleReferenceItemId,
    force: args.force,
  });

  // Clarification-only response — no generation happened
  if (result.clarifications?.length && !result.sessionId) {
    const lines = ['The prompt has clarifications to address before generating:'];
    for (const c of result.clarifications) {
      lines.push(`- ${c.message}${c.suggestion ? ` Suggestion: ${c.suggestion}` : ''}`);
    }
    const suggestedStyle = result.clarifications.find(c => c.suggestedStyle)?.suggestedStyle;
    if (suggestedStyle) {
      lines.push(`\nRecommended: re-invoke with style="${suggestedStyle}" or set force=true to generate anyway.`);
    } else {
      lines.push('\nSet force=true to generate anyway.');
    }
    return { clarifications: result.clarifications, message: lines.join('\n') };
  }

  return {
    sessionId: result.sessionId,
    preview: result.preview,
    previews: result.previews,
    creditsRemaining: result.credits,
    sessionData: result.sessionData,
    suggestions: result.suggestions,
    ...(result.clarifications?.length ? { clarifications: result.clarifications } : {}),
  };
}
