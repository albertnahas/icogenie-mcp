# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-01-28

### Added
- Initial release
- `generate_icon` tool - Generate single icon preview (1 credit)
- `regenerate_icon` tool - Regenerate variation with custom prompt (1 credit)
- `check_credits` tool - Check credit balance (free)
- `download_icon` tool - Download SVG/PNG package (5 credits single, 4/icon bundle)
- `normalize_bundle` tool - Plan bundle icon list (free, rate-limited)
- `generate_bundle` tool - Generate bundle from icon list (1 credit/icon)
- Browser-based OAuth authentication (shared with @icogenie/cli)
- Reference image support for style extraction
- CI/CD support via `ICOGENIE_SESSION_TOKEN` environment variable
- Stdio transport for Claude Desktop and Cursor integration
