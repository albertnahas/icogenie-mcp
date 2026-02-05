/**
 * generate_bundle tool - Generate bundle from icon list
 */

import { z } from 'zod';
import { generateBundle, readReferenceImage, type ReferenceImage } from '../api/client.js';

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
  referenceImage: z
    .object({
      data: z.string(),
      mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
    })
    .optional()
    .describe('Base64-encoded reference image'),
};

export async function generateBundleTool(args: {
  icons?: Array<{ name: string; description: string }>;
  description?: string;
  targetCount?: number;
  style?: 'solid' | 'outline' | 'illustration';
  referenceImagePath?: string;
  referenceImage?: { data: string; mimeType: string };
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

  const result = await generateBundle({
    icons: args.icons,
    style: args.style || 'solid',
    referenceImage: refImage,
  });

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
  };
}
