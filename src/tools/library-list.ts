/**
 * list_library tool - Browse saved icons
 */

import { z } from 'zod';
import { listLibrary } from '../api/client.js';

export const libraryListSchema = {
  status: z.enum(['all', 'saved', 'exported']).optional().default('all').describe('Filter by status'),
  type: z.enum(['all', 'single', 'bundle']).optional().default('all').describe('Filter by type'),
  limit: z.number().optional().default(20).describe('Maximum items to return'),
  offset: z.number().optional().default(0).describe('Pagination offset'),
};

export async function libraryListTool(args: {
  status?: 'all' | 'saved' | 'exported';
  type?: 'all' | 'single' | 'bundle';
  limit?: number;
  offset?: number;
}) {
  const result = await listLibrary({
    status: args.status,
    type: args.type,
    limit: args.limit,
    offset: args.offset,
  });

  return {
    items: result.items.map((item) => ({
      id: item.id,
      name: item.name,
      prompt: item.prompt,
      status: item.status,
      type: item.type,
      style: item.style,
      createdAt: item.createdAt,
      previewUrl: item.previewUrl,
    })),
    total: result.total,
    hasMore: result.hasMore,
  };
}
