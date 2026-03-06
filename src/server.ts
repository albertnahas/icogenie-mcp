/**
 * MCP Server configuration for IcoGenie
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CREDIT_CONFIG } from '@icogenie/shared';
import { generateIcon, generateIconSchema } from './tools/generate.js';
import { regenerateIcon, regenerateIconSchema } from './tools/regenerate.js';
import { confirmRegeneration, confirmRegenerationSchema } from './tools/confirm-regeneration.js';
import { checkCredits, checkCreditsSchema } from './tools/credits.js';
import { downloadIcon, downloadIconSchema } from './tools/download.js';
import { normalizeBundleTool, normalizeBundleSchema } from './tools/normalize-bundle.js';
import { generateBundleTool, generateBundleSchema } from './tools/generate-bundle.js';
import { librarySaveTool, librarySaveSchema } from './tools/library-save.js';
import { libraryListTool, libraryListSchema } from './tools/library-list.js';
import { libraryDownloadTool, libraryDownloadSchema } from './tools/library-download.js';
import { dailyClaimTool, dailyClaimSchema } from './tools/daily-claim.js';
import { listStylesTool, listStylesSchema } from './tools/list-styles.js';

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

  // regenerate_icon - Regenerate a variation (two-phase: returns candidates)
  server.registerTool(
    'regenerate_icon',
    {
      title: 'Regenerate Icon',
      description:
        `Regenerate a specific icon variation. Costs ${CREDIT_CONFIG.costs.preview} credit. Returns 4 candidate previews + regenToken. Use confirm_regeneration with regenToken and selectedIndex (0-3) to finalize.`,
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

  // confirm_regeneration - Finalize regeneration
  server.registerTool(
    'confirm_regeneration',
    {
      title: 'Confirm Regeneration',
      description:
        'Finalize a regeneration by selecting one of the 4 candidates. Free — credit was charged during regenerate_icon.',
      inputSchema: confirmRegenerationSchema,
    },
    async (args) => {
      const result = await confirmRegeneration(args as Parameters<typeof confirmRegeneration>[0]);
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
        'Plan an icon bundle from a description. Free but rate-limited. Returns bundleId — pass it to generate_bundle for traceability.',
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

  // save_to_library - Save icon to library (free)
  server.registerTool(
    'save_to_library',
    {
      title: 'Save to Library',
      description:
        'Save a generated icon to your library for free re-downloads. Free. Use generationId from generate_icon or bundleId from generate_bundle.',
      inputSchema: librarySaveSchema,
    },
    async (args) => {
      const result = await librarySaveTool(args as Parameters<typeof librarySaveTool>[0]);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  // list_library - Browse saved icons (free)
  server.registerTool(
    'list_library',
    {
      title: 'List Library',
      description:
        'Browse your saved icons. Free. Use download_from_library with a library item\'s id.',
      inputSchema: libraryListSchema,
    },
    async (args) => {
      const result = await libraryListTool(args as Parameters<typeof libraryListTool>[0]);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  // download_from_library - Re-download from library
  server.registerTool(
    'download_from_library',
    {
      title: 'Download from Library',
      description:
        'Re-download from library. Free for previously exported items. Provide outputPath to save to file.',
      inputSchema: libraryDownloadSchema,
    },
    async (args) => {
      const result = await libraryDownloadTool(args as Parameters<typeof libraryDownloadTool>[0]);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  // claim_daily_credits - Claim free daily credits
  server.registerTool(
    'claim_daily_credits',
    {
      title: 'Claim Daily Credits',
      description: 'Claim 2 free daily credits. Once per day.',
      inputSchema: dailyClaimSchema,
    },
    async () => {
      const result = await dailyClaimTool();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  // list_styles - List available style presets (free)
  server.registerTool(
    'list_styles',
    {
      title: 'List Styles',
      description: 'List available style library presets. Free. Use a style name with generate_icon or generate_bundle via the styleRef parameter.',
      inputSchema: listStylesSchema,
    },
    async (args) => {
      const result = await listStylesTool(args as Parameters<typeof listStylesTool>[0]);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );

  return server;
}
