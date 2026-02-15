/**
 * download_icon tool - Download SVG/PNG package
 */

import { z } from 'zod';
import { writeFileSync } from 'fs';
import { download } from '../api/client.js';

export const downloadIconSchema = {
  generationId: z.string().optional().describe('ID from generate_icon result (for single icons)'),
  bundleId: z.string().optional().describe('ID from generate_bundle result (for bundles)'),
  outputPath: z.string().optional().describe('Where to save the ZIP file'),
  removeBackground: z.boolean().optional().default(false).describe('Remove background from illustrations (transparent)'),
};

export async function downloadIcon(args: {
  generationId?: string;
  bundleId?: string;
  outputPath?: string;
  removeBackground?: boolean;
}) {
  if (!args.generationId && !args.bundleId) {
    throw new Error('Must provide either generationId or bundleId');
  }

  const { response, filename } = await download({
    generationId: args.generationId,
    bundleId: args.bundleId,
    removeBg: args.removeBackground,
  });

  // Read ZIP data from response
  const arrayBuffer = await response.arrayBuffer();
  const zipBuffer = Buffer.from(arrayBuffer);

  const result: {
    success: boolean;
    filename: string;
    savedTo?: string;
    bundleData?: string;
  } = {
    success: true,
    filename,
  };

  if (args.outputPath) {
    // Save to file
    writeFileSync(args.outputPath, zipBuffer);
    result.savedTo = args.outputPath;
  } else {
    // Return base64 data for agent to handle
    result.bundleData = zipBuffer.toString('base64');
  }

  return result;
}
