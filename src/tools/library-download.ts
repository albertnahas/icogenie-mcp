/**
 * download_from_library tool - Re-download from library
 */

import { z } from 'zod';
import { writeFileSync } from 'fs';
import { downloadFromLibrary } from '../api/client.js';

export const libraryDownloadSchema = {
  libraryId: z.string().describe('Library item ID from list_library'),
  outputPath: z.string().optional().describe('Where to save the ZIP file'),
};

export async function libraryDownloadTool(args: {
  libraryId: string;
  outputPath?: string;
}) {
  const { response, filename } = await downloadFromLibrary(args.libraryId);

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
    writeFileSync(args.outputPath, zipBuffer);
    result.savedTo = args.outputPath;
  } else {
    result.bundleData = zipBuffer.toString('base64');
  }

  return result;
}
