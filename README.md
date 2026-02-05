# @icogenie/mcp

MCP (Model Context Protocol) server for IcoGenie. Enables AI agents like Claude to generate production-ready SVG icons programmatically.

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
Regenerate a specific icon variation with a custom refinement prompt.

**Cost:** 1 credit

```
regenerate_icon({
  sessionId: "abc123",       // for single icons
  bundleId: "xyz789",        // for bundles (use one or the other)
  index: 0,                  // which variation (0-based)
  prompt: "Make it more 3D"  // optional refinement
})
```

**Returns:** `{ success, index, preview, creditsRemaining }`

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

**Returns:** `{ icons, bundleType, styleRecommendation, reasoning }`

### generate_bundle
Generate a bundle of icons from an icon list.

**Cost:** 1 credit per icon

```
generate_bundle({
  icons: [
    { name: "home", description: "Home navigation icon" },
    { name: "cart", description: "Shopping cart icon" }
  ],
  style: "solid"
})
```

**Returns:** `{ bundleId, iconCount, icons: [{ name, description, preview }], pricing, creditsUsed, creditsRemaining }`

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

3. **Refine if needed:**
   ```
   regenerate_icon({ sessionId: "abc123", index: 0, prompt: "Add a dot indicator" })
   → { preview: "...", creditsRemaining: 48 }
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

2. **Review and generate:**
   ```
   generate_bundle({ icons: [...], style: "outline" })
   → { bundleId: "xyz789", icons: [...], credits: { previewUsed: 8 } }
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

Purchase credits at [www.icogenie.xyz](https://www.icogenie.xyz).

## Related

- [@icogenie/cli](https://www.npmjs.com/package/@icogenie/cli) - Command-line interface
- [IcoGenie Web](https://www.icogenie.xyz) - Web application

## License

MIT
