/**
 * regenerate_icon tool - Regenerate a variation with custom prompt
 */

import { z } from 'zod';
import { regenerate } from '../api/client.js';

export const regenerateIconSchema = {
  sessionId: z.string().optional().describe('For single icon variations'),
  bundleId: z.string().optional().describe('For bundle icons'),
  index: z.number().describe('Which variation/icon to regenerate (0-based)'),
  prompt: z.string().optional().describe('Custom refinement prompt'),
};

export async function regenerateIcon(args: {
  sessionId?: string;
  bundleId?: string;
  index: number;
  prompt?: string;
}) {
  if (!args.sessionId && !args.bundleId) {
    throw new Error('Must provide either sessionId or bundleId');
  }

  const result = await regenerate({
    sessionId: args.sessionId,
    bundleId: args.bundleId,
    index: args.index,
    prompt: args.prompt,
  });

  return {
    success: result.success,
    index: result.index,
    preview: result.preview,
    creditsRemaining: result.credits,
  };
}
