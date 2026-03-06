/**
 * normalize_bundle tool - Plan bundle with AI-enhanced icon list
 */

import { z } from 'zod';
import { normalizeBundle } from '../api/client.js';

export const normalizeBundleSchema = {
  description: z.string().describe('Bundle theme. The system generates an optimized icon list from this.'),
  targetCount: z.number().optional().describe('Target number of icons (2-20)'),
  style: z.enum(['solid', 'outline', 'illustration']).optional().describe('Preferred icon style'),
};

export async function normalizeBundleTool(args: {
  description: string;
  targetCount?: number;
  style?: 'solid' | 'outline' | 'illustration';
}) {
  const result = await normalizeBundle({
    description: args.description,
    targetCount: args.targetCount,
    style: args.style,
  });

  return {
    bundleId: result.bundleId,
    icons: result.icons,
    bundleType: result.bundleType,
    suggestedCount: result.suggestedCount,
    styleRecommendation: result.styleRecommendation,
    reasoning: result.reasoning,
  };
}
