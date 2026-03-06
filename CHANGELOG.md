# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0] - 2026-02-17

### Added
- **Two-phase regeneration**: `regenerate_icon` now returns 4 candidate previews + `regenToken`. Use new `confirm_regeneration` tool to finalize selection.
- **Library tools**: `save_to_library`, `list_library`, `download_from_library` for managing saved icons.
- **Daily credits**: `claim_daily_credits` tool to claim 2 free credits once per 24 hours.
- `normalize_bundle` now returns `bundleId` for traceability — pass it to `generate_bundle`.
- `generate_bundle` accepts optional `bundleId` parameter.

### Changed
- `regenerate_icon` response shape changed from `{ success, index, preview, creditsRemaining }` to `{ candidates, regenToken, creditsRemaining }`.

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
