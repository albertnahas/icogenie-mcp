/**
 * MCP Server configuration for IcoGenie
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CREDIT_CONFIG } from '@icogenie/shared';
import { generateIcon, generateIconSchema } from './tools/generate.js';
import { regenerateIcon, regenerateIconSchema } from './tools/regenerate.js';
import { checkCredits, checkCreditsSchema } from './tools/credits.js';
import { downloadIcon, downloadIconSchema } from './tools/download.js';
import { normalizeBundleTool, normalizeBundleSchema } from './tools/normalize-bundle.js';
import { generateBundleTool, generateBundleSchema } from './tools/generate-bundle.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'icogenie',
    version: '0.1.0',
  });

  // generate_icon - Generate single icon preview
  server.registerTool(
    'generate_icon',
    {
      title: 'Generate Icon',
      description:
        `Generate an AI-powered icon preview. Costs ${CREDIT_CONFIG.costs.preview} credit. Keep prompts minimal - the system normalizes them internally. Verbose descriptions create cluttered icons. Returns generationId for download. Note: previews are watermarked and low-resolution — for display/evaluation only, not production use. Use download_icon to get the final unwatermarked assets.`,
      inputSchema: generateIconSchema,
    },
    async (args) => {
      const result = await generateIcon(args as Parameters<typeof generateIcon>[0]);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  // regenerate_icon - Regenerate a variation
  server.registerTool(
    'regenerate_icon',
    {
      title: 'Regenerate Icon',
      description:
        `Regenerate a specific icon variation with an optional custom prompt. Costs ${CREDIT_CONFIG.costs.preview} credit. Use with generationId (single) or bundleId (bundle). After regeneration, save and display the new preview. Note: previews are watermarked and low-resolution — for display/evaluation only, not production use.`,
      inputSchema: regenerateIconSchema,
    },
    async (args) => {
      const result = await regenerateIcon(args as Parameters<typeof regenerateIcon>[0]);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  // check_credits - Check credit balance (free)
  server.registerTool(
    'check_credits',
    {
      title: 'Check Credits',
      description: 'Check the current credit balance and account information. Free to use.',
      inputSchema: checkCreditsSchema,
    },
    async () => {
      const result = await checkCredits();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  // download_icon - Download SVG/PNG package
  server.registerTool(
    'download_icon',
    {
      title: 'Download Icon',
      description:
        `Download the final SVG + PNG package for an icon. Costs ${CREDIT_CONFIG.costs.vectorDownload} credits (single) or ${CREDIT_CONFIG.costs.bundleDownload} credits/icon (bundle). Provide outputPath to save to file. Always save to the user's working directory with a descriptive filename.`,
      inputSchema: downloadIconSchema,
    },
    async (args) => {
      const result = await downloadIcon(args as Parameters<typeof downloadIcon>[0]);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  // normalize_bundle - Plan bundle icon list (free, rate-limited)
  server.registerTool(
    'normalize_bundle',
    {
      title: 'Normalize Bundle',
      description:
        'Plan an icon bundle by generating an AI-enhanced icon list from a description. Free but rate-limited. Review the list before generating.',
      inputSchema: normalizeBundleSchema,
    },
    async (args) => {
      const result = await normalizeBundleTool(args as Parameters<typeof normalizeBundleTool>[0]);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  // generate_bundle - Generate bundle from icon list
  server.registerTool(
    'generate_bundle',
    {
      title: 'Generate Bundle',
      description:
        `Generate a bundle of icons. Costs ${CREDIT_CONFIG.costs.bundlePreview} credit per icon. Keep descriptions minimal - verbose prompts create cluttered icons. Use normalize_bundle first or provide icons directly. Note: previews are watermarked and low-resolution — for display/evaluation only, not production use. Use download_icon to get the final unwatermarked assets.`,
      inputSchema: generateBundleSchema,
    },
    async (args) => {
      const result = await generateBundleTool(args as Parameters<typeof generateBundleTool>[0]);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  return server;
}
