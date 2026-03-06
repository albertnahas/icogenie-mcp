/**
 * confirm_regeneration tool - Finalize a regeneration by selecting a candidate
 */

import { z } from 'zod';
import { regenerateConfirm } from '../api/client.js';

export const confirmRegenerationSchema = {
  regenToken: z.string().describe('Token from regenerate_icon result'),
  selectedIndex: z.number().min(0).max(3).describe('Which candidate to finalize (0-3)'),
};

export async function confirmRegeneration(args: {
  regenToken: string;
  selectedIndex: number;
}) {
  const result = await regenerateConfirm({
    regenToken: args.regenToken,
    selectedIndex: args.selectedIndex,
  });

  return {
    success: result.success,
    index: result.index,
    preview: result.preview,
  };
}
