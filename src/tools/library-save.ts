/**
 * save_to_library tool - Save a generated icon to library
 */

import { z } from 'zod';
import { saveToLibrary } from '../api/client.js';

export const librarySaveSchema = {
  generationId: z.string().describe('Generation ID from generate_icon or bundleId from generate_bundle'),
  prompt: z.string().describe('The prompt used to generate the icon'),
  type: z.enum(['single', 'bundle']).optional().default('single').describe('Icon type'),
  variations: z.number().optional().default(1).describe('Number of variations'),
  style: z.enum(['solid', 'outline', 'illustration']).optional().default('solid').describe('Icon style'),
  name: z.string().optional().describe('Optional name for the library entry'),
};

export async function librarySaveTool(args: {
  generationId: string;
  prompt: string;
  type?: 'single' | 'bundle';
  variations?: number;
  style?: 'solid' | 'outline' | 'illustration';
  name?: string;
}) {
  const result = await saveToLibrary({
    generationId: args.generationId,
    prompt: args.prompt,
    type: args.type,
    variations: args.variations,
    style: args.style,
    name: args.name,
  });

  return {
    success: result.success,
    libraryId: result.libraryId,
    action: result.action,
    message: result.message,
  };
}
