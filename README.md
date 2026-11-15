# mcp_library

> **Find, compare, validate, clone, and safely configure MCP servers.**
>
> Temukan, bandingkan, validasi, clone, dan konfigurasi server Model Context Protocol (MCP) secara aman.

`mcp_library` is a bilingual, provenance-first catalog and explainable recommendation layer for Model Context Protocol servers. It unifies approved source metadata, preserves source evidence, classifies safety/compatibility, maintains reviewed local source clones, and emits **credential-free** client configuration templates.

## Release status — v0.2.1

- ✅ Bilingual Next.js catalog: browse, search/filter preview, profile, compare, methodology, and local-library views.
- ✅ Official MCP Registry adapter with cursor-ready metadata normalization.
- ✅ Glama MCP API traversal with key-authenticated access: 61,417 source records fetched across 615 pages in the last completed run (28 July 2026, while the API was still public).
- ⚠️ Glama closed unauthenticated API access on 2026-08-26. `providers:sync-glama` now requires `GLAMA_API_KEY`, centralized in the Git-ignored root `library.api.key` or the process environment (see `.env.example` and `library.api.key.example`).
- ✅ Local library snapshot contained **61,522 unique candidates** at the last completed run: 61,417 Glama, 101 Official Registry, and 4 curated provider records.
- ✅ Curated free-ready packs for Web & Research, Thinking & Memory, and Developer workflows.
- ✅ Local source clones tracked for GitHub MCP Server, Playwright MCP, and Context7.
- ✅ Safe client-template exporter for Claude Desktop, Cursor, and VS Code.
- ✅ MCPMarket public sitemap importer for provider-approved/browser-exported `tools-N.xml` files.
- ⏳ MCPMarket API catalog sync remains blocked pending a documented list/search/pagination contract and valid organization authentication.
- ⏳ PostgreSQL persistence, server-side full-text search, curator authentication, detailed MCPMarket enrichment, and remote GitHub publication.

> **Data boundary:** Full catalog data lives only in Git-ignored `local-library/`. It is not committed with project source. The web UI sends a capped, curated discovery window to the browser rather than serializing 60k+ records.

## Current source coverage

| Source | Mode | Latest validated result | Credential required |
|---|---|---:|---|
| [Official MCP Registry](https://registry.modelcontextprotocol.io/) | Public REST metadata sync | 101 local records | No |
| [Glama](https://glama.ai/mcp/servers) | Documented REST API (`Authorization: Bearer`); key required since 2026-08-26 | 61,417 records / 615 pages (last completed run, 28 July 2026) | Yes — `GLAMA_API_KEY` (root `library.api.key` or environment) |
| Provider-owned repositories | Curated source + GitHub enrichment / local clone tracking | 4 catalog records, 3 clones | No for public metadata; optional `GITHUB_TOKEN` for quota |
| [MCPMarket](https://mcpmarket.com/) | Public sitemap importer | Awaiting provider-approved sitemap export/import | No for sitemap import; optional `MCPMARKET_API_KEY` for `/me` auth check |

Glama API data is governed by Glama's API Data License: visible attribution to Glama and links to each record's Glama listing are required wherever that data is displayed.

See [live results](docs/LIVE_TEST_REPORT.md) and [official documentation index](docs/PROVIDER_DOCUMENTATION_INDEX.md) for timestamps, source boundaries, and integration evidence.

## Quick start

```bash
npm ci
# Optional: copy only if you need local DB/auth/provider credentials.
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality gates

```bash
npm run audit      # fails at high severity or above
npm run lint       # web TypeScript static check
npm run typecheck  # all workspace and test type checks
npm test
npm run build
```

Latest validation: **0 audit vulnerabilities, 24 tests passed, production build passed**.

## Workspace layout

```text
apps/web                 Next.js bilingual catalog UI
apps/worker              source sync, local library, clone, and profile commands
packages/catalog-schema  canonical validated catalog contracts
packages/source-adapters Official Registry, Glama, Awesome, MCPMarket sitemap normalizers
packages/config-exporters safe placeholder-only client profile and free-pack exporters
docs                     PRD, decisions, live reports, source policy, provider docs
infra                    Docker/PostgreSQL and provider-sync cron templates
local-library/           Git-ignored source snapshots, local clones, and generated profiles
```

## Catalog and provider commands

### Centralized provider API keys — `library.api.key`

Every MCP provider credential this worker needs is centralized in one Git-ignored file at the project root:

```bash
# 1. Create the file from the committed template (once)
cp library.api.key.example library.api.key

# 2. Fill in the keys you need: GLAMA_API_KEY (required), MCPMARKET_API_KEY
#    and GITHUB_TOKEN (optional), and the optional base-URL overrides

# 3. Check what is configured — presence only, values are never printed
npm run providers:keys
```

All `providers:*` and `library:*` commands read `library.api.key` automatically at startup. The loader applies a fixed allowlist of provider variables only (`GLAMA_API_KEY`, `GLAMA_API_BASE_URL`, `MCPMARKET_API_KEY`, `MCPMARKET_API_BASE_URL`, `GITHUB_TOKEN`), variables already present in the environment always take precedence, and no value is ever logged, printed, or persisted. Keyless providers (Official MCP Registry, Awesome MCP Servers, and the MCPMarket sitemap importer) need nothing. Application secrets (`DATABASE_URL`, `AUTH_SECRET`, `EMBEDDING_API_KEY`) belong in `.env`, not in `library.api.key`.

### Official MCP Registry

```bash
# Bounded metadata sync (latest versions)
npm run providers:sync -- --limit 100

# Read-only check
npm run providers:check -- --search playwright --limit 20
```

### Glama — documented MCP API (key required)

Glama closed unauthenticated access to its documented MCP API on 2026-08-26. Create an API key at <https://glama.ai/settings/api-keys> and put it in the Git-ignored `library.api.key` at the project root (`GLAMA_API_KEY=...`; copy `library.api.key.example` to create the file), or export `GLAMA_API_KEY` from a local secret manager. The key is never passed as a CLI argument and is never logged.

```bash
# Read-only one-page check (100 records)
npm run providers:sync-glama -- --check --first 100

# Persist one bounded page
npm run providers:sync-glama -- --first 100

# Full API traversal; use persistent storage in production
npm run providers:sync-glama -- --all --first 100

# Resume from the persisted Glama cursor in bounded batches
npm run providers:sync-glama -- --resume --all --max-pages 25
```

The environment alternative remains supported for CI (the `provider-watch` workflow uses the `GLAMA_API_KEY` repository secret): `GLAMA_API_KEY=... npm run providers:sync-glama -- --check --first 100`.

The public JSON-LD directory mode (`--directory-url`) remains available without a key for pages that still embed it.

### MCPMarket — public sitemap importer

MCPMarket's documented API token flow does not currently publish a catalog list/search/pagination contract. The project does **not** bypass its Vercel Security Checkpoint or protected API.

Download the public `tools-0.xml` through `tools-12.xml` files (check the live sitemap index at <https://mcpmarket.com/sitemap.xml> for the current list; it contained 13 `tools-N.xml` files at the last check) from the official sitemap via an approved browser/export path, place them under a local ignored directory, then import discovery metadata:

```bash
# Status only; no credential read
npm run providers:mcpmarket-status

# Read-only credential validation only if a newly issued key is already in your local secret environment
npm run providers:mcpmarket-auth-check

# Import public server URL + lastmod records from approved exported sitemap files
npm run providers:import-mcpmarket-sitemaps -- \
  --dir local-library/mcpmarket-sitemaps
```

### Search the local library

```bash
# Defaults to a safe bounded table of 50 records
npm run library:list

# Search full local snapshot without rendering all records
npm run library:list -- --query playwright --limit 20
npm run library:free -- --limit 50
```

### Local source clone and update tracking

```bash
# Preview a clone; no download, install, or execution
npm run library:clone -- --server microsoft/playwright-mcp --yes --dry-run

# Clone a verified open-source provider repository
npm run library:clone -- --server microsoft/playwright-mcp --yes

# Fetch provider HEAD for existing clones without changing working source
npm run library:refresh

# Inspect provider changes, then explicitly fast-forward one clean clone
npm run library:apply -- --server microsoft/playwright-mcp --yes
```

### Free-ready client packs

```bash
npm run library:packs
npm run library:pack -- --name free-web-research
npm run library:pack -- --name free-thinking-memory
npm run library:pack -- --name free-developer

# Generate full client profiles for Claude Desktop, Cursor, and VS Code
npm run library:profiles

# Check public npm releases without changing pinned package versions
npm run library:check-packages
```

Generated files remain under `local-library/` and contain no literal credentials.

## Safety model

- No `.env`, `library.api.key`, clone, source snapshot, generated profile, or credential is committed to Git.
- A token shared in chat, a URL, a screenshot, an issue, or a commit is considered exposed and must be revoked/rotated.
- Third-party MCP entries are discovery data, **not** proof they are safe, free, current, or runnable.
- Clone acquisition never installs dependencies, runs package scripts, starts a server, checks out submodules, or runs Git hooks.
- Provider updates are checked automatically; source changes are applied only via an explicit reviewed fast-forward.
- Runtime use needs separate review of OAuth scopes, API keys, filesystem roots, browser profiles, database roles, and destructive/write permissions.

Read [SECURITY.md](SECURITY.md), [free/local-library operations](docs/FREE_MCP_LOCAL_LIBRARY.md), the [PRD](docs/PRD.md), and the [provider documentation index](docs/PROVIDER_DOCUMENTATION_INDEX.md) before production use.

## License

No license has been selected yet, so the public repository currently grants no redistribution or reuse rights beyond defaults. Select a license and document source-attribution obligations (including Glama's API Data License for displayed Glama data) before others depend on this project.
