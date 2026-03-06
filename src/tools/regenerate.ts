/**
 * regenerate_icon tool - Two-phase regeneration: generate candidates
 */

import { z } from 'zod';
import { regenerateGenerate } from '../api/client.js';

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

  const result = await regenerateGenerate({
    sessionId: args.sessionId,
    bundleId: args.bundleId,
    index: args.index,
    prompt: args.prompt,
  });

  return {
    candidates: result.candidates,
    regenToken: result.regenToken,
    creditsRemaining: result.credits,
  };
}
