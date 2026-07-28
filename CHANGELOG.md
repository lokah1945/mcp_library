# Changelog

All notable project changes are documented here.

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
