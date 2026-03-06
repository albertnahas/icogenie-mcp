/**
 * generate_bundle tool - Generate bundle from icon list
 */

import { z } from 'zod';
import { generateBundle, listStyles, readReferenceImage, type ReferenceImage } from '../api/client.js';

export const generateBundleSchema = {
  icons: z
    .array(
      z.object({
        name: z.string().regex(/^[a-z0-9-]+$/).describe('Icon name in kebab-case'),
        description: z.string().describe('Icon concept. Keep minimal - verbose descriptions create cluttered icons.'),
      })
    )
    .optional()
    .describe('Icon list from normalize_bundle or custom'),
  description: z.string().optional().describe('Bundle theme. The system normalizes this into an icon list.'),
  targetCount: z.number().optional().describe('Target icon count when using description'),
  style: z.enum(['solid', 'outline', 'illustration']).default('solid').describe('Icon style: solid (filled shapes), outline (stroked lines), or illustration (colorful, detailed)'),
  referenceImagePath: z.string().optional().describe('Local file path to reference image'),
  bundleId: z.string().optional().describe('Bundle ID from normalize_bundle for traceability'),
  referenceImage: z
    .object({
      data: z.string(),
      mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
    })
    .optional()
    .describe('Base64-encoded reference image'),
  model: z.enum(['fast', 'precise']).default('fast').describe('Generation model: fast (Gemini raster + vectorize) or precise (Recraft V4 native vector)'),
  styleRef: z.string().optional().describe('Style library preset name (from list_styles). Resolves to style reference automatically.'),
  force: z.boolean().optional().describe('Proceed even when the AI detects style conflicts'),
};

export async function generateBundleTool(args: {
  icons?: Array<{ name: string; description: string }>;
  description?: string;
  targetCount?: number;
  style?: 'solid' | 'outline' | 'illustration';
  model?: 'fast' | 'precise';
  bundleId?: string;
  referenceImagePath?: string;
  referenceImage?: { data: string; mimeType: string };
  styleRef?: string;
  force?: boolean;
}) {
  if (!args.icons) {
    throw new Error('Must provide icons array (use normalize_bundle first to get icon list)');
  }

  let refImage: ReferenceImage | undefined;
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

  const result = await generateBundle({
    bundleId: args.bundleId,
    icons: args.icons,
    style: args.style || 'solid',
    model: args.model || 'fast',
    referenceImage: refImage,
    styleReferenceItemId,
    force: args.force,
  });

  // Clarification-only response — no generation happened
  if (result.clarifications?.length && !result.previews) {
    const lines = ['The bundle has clarifications to address before generating:'];
    for (const c of result.clarifications) {
      lines.push(`- ${c.message}${c.suggestion ? ` Suggestion: ${c.suggestion}` : ''}`);
    }
    lines.push('\nSet force=true to generate anyway.');
    return { clarifications: result.clarifications, message: lines.join('\n') };
  }

  return {
    bundleId: result.bundleId,
    iconCount: result.previews.length,
    icons: result.previews.map((icon) => ({
      name: icon.name,
      description: icon.description,
      preview: icon.preview,
    })),
    pricing: result.pricing,
    creditsUsed: result.creditsUsed,
    creditsRemaining: result.credits,
    ...(result.clarifications?.length ? { clarifications: result.clarifications } : {}),
  };
}
