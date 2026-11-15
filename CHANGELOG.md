# Changelog

All notable project changes are documented here.

## 0.2.1 — 15 November 2026

### Security

- Restored a clean `npm run audit` gate: 0 vulnerabilities. Upgraded `next` (critical RCE advisories), `zod` 3 → 4.6.7 (high-severity memory-exhaustion advisory; zod validates external catalog data), `vitest` 3 → 4.1.12 (critical tinypool / @vitest/mocker advisories), the `sharp` override to 0.35.5, and transitive fixes (`nanoid`, `source-map-js`, `vite`).

### Added

- Key-authenticated Glama sync: `providers:sync-glama` now sends `Authorization: Bearer` using `GLAMA_API_KEY` from the process environment. Glama closed unauthenticated API access on 2026-08-26; the 401 path now explains the key requirement, the settings URL, and the API Data License attribution duty. The key is never logged or passed as a CLI argument.
- `providers:import-mcpmarket-sitemaps --check` and the profile/pack/check-package commands are now documented in `worker:help`, including the `--servers` selection flag.

### Fixed

- CLI flag parsing: values containing `=` (for example `--query=a=b` or `--dir=/path=x`) were truncated by the previous `split("=", 2)` implementation; parsing now splits only on the first `=` and lives in the testable `apps/worker/src/lib/cli-args.ts` module (5 new tests).
- `providers:import-mcpmarket-sitemaps` now reports a friendly error when `--dir` points to a missing directory instead of a raw ENOENT.
- `positiveNumber` fallbacks are now clamped to the configured maximum, so the documented `--max-pages` cap always applies.

### Changed

- README source-coverage table and Glama commands now state the API-key requirement and the API Data License attribution obligation; the MCPMarket import instructions now reference the live sitemap index (13 `tools-N.xml` files at the last check, `tools-0.xml`–`tools-12.xml`) instead of the outdated `tools-0.xml`–`tools-7.xml`.
- `provider-watch` workflow runs the Glama check only when the `GLAMA_API_KEY` repository secret is configured, and prints an explanatory skip message otherwise.
- Version bumped to 0.2.1 across the workspace.

## 0.2.0 — 28 July 2026

### Added

- Full public Glama MCP API adapter with `first` page size, `pageInfo.endCursor`, bounded paging, full traversal, and resume-capable CLI flags.
- Latest full Glama live sync: 61,417 records over 615 pages, resulting in 61,522 unique catalog candidates with the other enabled sources.
- Full-catalog UI payload guard: the web interface reports the complete count but sends a curated, capped discovery window to the browser.
- Bounded and queryable `library:list` / `library:free` commands for 60k+ catalogs.
- MCPMarket public sitemap parser/importer for provider-approved `tools-N.xml` exports.
- MCPMarket safe read-only `/me` authentication check that never logs token values or response values.
- Official documentation index for MCP, Official Registry, Glama, MCPMarket, GitHub MCP, Playwright MCP, Context7, and ready-pack dependencies.
- Glama public API, MCPMarket sitemap, and expanded source adapter test coverage.

### Changed

- README converted from scaffold-oriented status to current operational catalog status and source coverage.
- Glama ingestion moved from a 20-entry directory JSON-LD preview to the public cursor-paginated MCP API by default; directory parsing remains compatibility mode.
- Local library browser response is capped to avoid sending all catalog records client-side.
- MCPMarket status now separates public sitemap discovery from unavailable API catalog sync.

### Security

- Preserved no-secret policy. Credentials are never written to `.env.example`, source, Git, catalog data, generated profiles, or logs.
- MCPMarket temporary bearer check returned HTTP 401 and did not enable catalog sync.
- Automated MCPMarket requests that encounter a Vercel Security Checkpoint are not bypassed.
