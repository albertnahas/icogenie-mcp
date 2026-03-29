# @icogenie/mcp

[![npm version](https://img.shields.io/npm/v/@icogenie/mcp.svg)](https://www.npmjs.com/package/@icogenie/mcp)
[![npm downloads](https://img.shields.io/npm/dm/@icogenie/mcp.svg)](https://www.npmjs.com/package/@icogenie/mcp)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.0+-blue.svg)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for IcoGenie. Enables AI agents like Claude to generate production-ready SVG icons programmatically.

## Hosted deployment

A hosted deployment is available on [Fronteir AI](https://fronteir.ai/mcp/albertnahas-icogenie-mcp).

## Installation

```bash
npm install -g @icogenie/mcp
# or use directly with npx
npx @icogenie/mcp
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "icogenie": {
      "command": "npx",
      "args": ["-y", "@icogenie/mcp"]
    }
  }
}
```

### Claude Code

The server works automatically when installed globally or via npx.

## Authentication

On first use, the MCP server will:
1. Open your browser for authentication
2. Ask you to approve access
3. Save the session token to `~/.icogenie/config.json`

Subsequent uses are automatic - the token is shared with the [IcoGenie CLI](https://www.npmjs.com/package/@icogenie/cli).

### CI/CD Environments

Set `ICOGENIE_SESSION_TOKEN` environment variable to skip browser authentication:

```bash
export ICOGENIE_SESSION_TOKEN="your-session-token"
```

## Available Tools

### generate_icon
Generate a single icon preview from a text description.

**Cost:** 1 credit

```
generate_icon({
  prompt: "home icon",
  style: "solid",       // or "outline"
  variations: 1,        // 1, 2, or 4
  referenceImagePath: "/path/to/reference.png"  // optional
})
```

**Returns:** `{ sessionId, preview, previews, creditsRemaining, sessionData, suggestions }`

### regenerate_icon
Regenerate a specific icon variation. Returns 4 candidate previews — use `confirm_regeneration` to finalize your choice (two-phase flow).

**Cost:** 1 credit

```
regenerate_icon({
  sessionId: "abc123",       // for single icons
  bundleId: "xyz789",        // for bundles (use one or the other)
  index: 0,                  // which variation (0-based)
  prompt: "Make it more 3D"  // optional refinement
})
```

**Returns:** `{ candidates, regenToken, creditsRemaining }`

### confirm_regeneration
Finalize a regeneration by selecting one of the 4 candidates.

**Cost:** Free (included in regenerate_icon)

```
confirm_regeneration({
  regenToken: "tok_abc123",
  selectedIndex: 2           // 0-3, which candidate to keep
})
```

**Returns:** `{ success, preview, creditsRemaining }`

### check_credits
Check your current credit balance.

**Cost:** Free

```
check_credits()
```

**Returns:** `{ credits, team, user }`

### download_icon
Download the final SVG + PNG package for an icon or bundle.

**Cost:** 5 credits (single) or 4 credits/icon (bundle)

```
download_icon({
  generationId: "abc123",  // or bundleId
  outputPath: "./icons.zip"  // optional, returns base64 if omitted
})
```

### normalize_bundle
Plan an icon bundle by generating an AI-enhanced icon list from a description.

**Cost:** Free (rate-limited)

```
normalize_bundle({
  description: "food delivery app",
  targetCount: 10,
  style: "solid"
})
```

**Returns:** `{ bundleId, icons, bundleType, styleRecommendation, reasoning }`

### generate_bundle
Generate a bundle of icons from an icon list.

**Cost:** 1 credit per icon

```
generate_bundle({
  icons: [
    { name: "home", description: "Home navigation icon" },
    { name: "cart", description: "Shopping cart icon" }
  ],
  style: "solid",
  bundleId: "bundle_abc123"  // optional, from normalize_bundle
})
```

**Returns:** `{ bundleId, iconCount, icons: [{ name, description, preview }], pricing, creditsUsed, creditsRemaining }`

### save_to_library
Save a generated icon to your personal library.

**Cost:** Free

```
save_to_library({
  generationId: "abc123",
  name: "notification-bell",  // optional display name
  tags: ["ui", "alerts"]      // optional tags
})
```

**Returns:** `{ success, libraryItemId }`

### list_library
List icons saved in your library.

**Cost:** Free

```
list_library({
  page: 1,       // optional, default 1
  limit: 20,     // optional, default 20
  tag: "ui"      // optional filter
})
```

**Returns:** `{ items: [{ id, name, tags, preview, createdAt }], total, page }`

### download_from_library
Download an icon from your library as SVG + PNG.

**Cost:** Free

```
download_from_library({
  libraryItemId: "lib_abc123",
  outputPath: "./bell-icon.zip"  // optional, returns base64 if omitted
})
```

**Returns:** `{ savedTo }` or `{ base64, filename }`

### claim_daily_credits
Claim 2 free credits, available once every 24 hours.

**Cost:** Free

```
claim_daily_credits()
```

**Returns:** `{ credited, creditsRemaining, nextClaimAt }`

## Example Workflow

1. **Check credits:**
   ```
   check_credits()
   → { credits: 50, team: { name: "Personal" } }
   ```

2. **Generate a single icon:**
   ```
   generate_icon({ prompt: "notification bell icon", style: "outline" })
   → { sessionId: "abc123", preview: "...", creditsRemaining: 49 }
   ```

3. **Refine if needed (two-phase):**
   ```
   regenerate_icon({ sessionId: "abc123", index: 0, prompt: "Add a dot indicator" })
   → { candidates: ["...", "...", "...", "..."], regenToken: "tok_xyz", creditsRemaining: 48 }

   confirm_regeneration({ regenToken: "tok_xyz", selectedIndex: 1 })
   → { success: true, preview: "...", creditsRemaining: 48 }
   ```

4. **Download final package:**
   ```
   download_icon({ generationId: "abc123", outputPath: "./bell-icon.zip" })
   → { savedTo: "./bell-icon.zip" }
   ```

## Bundle Workflow

1. **Plan the bundle (free):**
   ```
   normalize_bundle({ description: "e-commerce app icons", targetCount: 8 })
   → { icons: [{ name: "cart", ... }, ...], styleRecommendation: "outline" }
   ```

2. **Review and generate (pass bundleId for traceability):**
   ```
   generate_bundle({ icons: [...], style: "outline", bundleId: "bundle_abc" })
   → { bundleId: "bundle_abc", icons: [...], credits: { previewUsed: 8 } }
   ```

3. **Download bundle:**
   ```
   download_icon({ bundleId: "xyz789", outputPath: "./ecommerce-icons.zip" })
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ICOGENIE_API_URL` | API endpoint | `https://www.icogenie.xyz` |
| `ICOGENIE_SESSION_TOKEN` | Session token (for CI/CD) | - |
| `ICOGENIE_CONFIG_DIR` | Config directory | `~/.icogenie` |

## Credit Pricing

| Action | Cost |
|--------|------|
| Preview (single) | 1 credit |
| Preview (bundle) | 1 credit/icon |
| Download (single) | 5 credits |
| Download (bundle) | 4 credits/icon |
| Regenerate | 1 credit |
| Daily claim | 2 free credits/day |
| Library ops | Free |

Purchase credits at [www.icogenie.xyz](https://www.icogenie.xyz).

## When to Use MCP vs CLI vs Web

| Use Case | Best Option |
|----------|-------------|
| Generate icons inside Claude/Cursor | **MCP** |
| Automate in CI/CD pipelines | **CLI** |
| Quick one-off generation | **Web** |
| Batch generate icon bundles | **CLI** or **MCP** |
| Browse and manage icon library | **Web** |

## Related

- [@icogenie/cli](https://www.npmjs.com/package/@icogenie/cli) - Command-line interface
- [IcoGenie Web](https://www.icogenie.xyz) - Web application
- [AI Agent Docs](https://www.icogenie.xyz/ai-docs) - Machine-readable documentation
- [Developer Docs](https://www.icogenie.xyz/docs) - Integration guides

## License

MIT
