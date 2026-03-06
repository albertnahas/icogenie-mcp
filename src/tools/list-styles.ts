/**
 * list_styles tool - List available style library presets
 */

import { z } from 'zod';
import { listStyles } from '../api/client.js';

export const listStylesSchema = {
  baseStyle: z.enum(['solid', 'outline', 'illustration']).optional().describe(
    'Filter by base style type'
  ),
};

export async function listStylesTool(args: {
  baseStyle?: 'solid' | 'outline' | 'illustration';
}) {
  const result = await listStyles({ baseStyle: args.baseStyle });

  return {
    styles: result.items.map(item => ({
      name: item.name,
      description: item.description,
      category: item.category,
      baseStyle: item.baseStyle,
      promptHint: item.promptHint,
    })),
    total: result.total,
  };
}
