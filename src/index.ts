/**
 * IcoGenie MCP Server
 *
 * Enable AI agents to generate icons programmatically.
 * Uses stdio transport for local spawned processes.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

/** Sandbox server for Smithery capability scanning */
export function createSandboxServer() {
  return createServer();
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
