# Free MCP discovery and local provider library

## Purpose

This extension turns `mcp_library` from a directory prototype into a **local provider library**:

1. discover public MCP metadata from the Official MCP Registry;
2. retain provider/repository provenance;
3. classify what “free” means instead of treating every public listing as free;
4. clone approved source repositories locally without executing them; and
5. continuously **check** providers for changes while requiring an explicit action to apply code updates.

## What “free” means

The label is deliberately precise:

| Status | Meaning | Default clone policy |
|---|---|---|
| `verified-open-source` | A public provider repository has a recognized open-source SPDX licence and is not archived/disabled at the time of enrichment. | Eligible after `--yes`. |
| `source-available-unverified` | A public source repository exists but the licence is absent, unclear, or has not been verified. | Blocked; needs licence review plus explicit override. |
| `free-tier` | A hosted provider advertises a free tier. This does **not** mean unlimited/free underlying service usage. | Not cloned unless a reviewed source repository exists. |
| `unknown` | Insufficient evidence. | Not cloneable. |

A public GitHub repository is not automatically an open-source licence. Likewise, a free MCP client connection does not imply the connected vendor API/service is free.

## Current curated, verified open-source starter set

This small starter set is based on provider-owned public repositories and public GitHub metadata observed on 28 July 2026. It is not a permanent trust guarantee; use the sync and review flow before using a server.

| Candidate | Provider repository | Observed licence | Why it is useful |
|---|---|---|---|
| GitHub MCP Server | `github/github-mcp-server` | MIT | Repository, issue, PR, and code workflows. |
| Playwright MCP | `microsoft/playwright-mcp` | Apache-2.0 | Browser inspection and E2E automation. |
| Context7 | `upstash/context7` | MIT | Current library/documentation context. |
| MCP Servers reference collection | `modelcontextprotocol/servers` | `NOASSERTION` at repository level | Source is visible but it is intentionally **not** eligible for automatic cloning until a specific component/licence is reviewed. |

These candidates are catalog metadata, not permission to run them with broad access. GitHub write scopes, browser control, database connections, filesystem roots, and remote API access remain separate risk decisions.

## Source discovery

### Official MCP Registry — primary incremental source

The Official MCP Registry has a documented public API at `https://registry.modelcontextprotocol.io`. Its list endpoint supports cursor pagination plus `version=latest`, `updated_since`, `search`, and deleted-record inclusion. `mcp_library` uses it for incremental metadata discovery:

```bash
# One bounded page (default: 25, max: 100) and persist local metadata
npm run providers:sync -- --limit 25

# Read-only provider check; no state, clone, or execution
npm run providers:check -- --search playwright --limit 10

# Follow all pages deliberately; can be large
npm run providers:sync -- --all

# Enrich one bounded page with public GitHub licence / archive metadata
npm run providers:sync -- --search github --limit 20 --enrich-github
```

### Glama public MCP API — enabled with cursor pagination

`mcp_library` now ingests the public Glama MCP API at `https://glama.ai/api/mcp/v1/servers`. The default fetches one bounded page of 100 records; `--all` follows the public `pageInfo.endCursor` until the source reports no next page:

```bash
# Preview one 100-record API page without persisting
npm run providers:sync-glama -- --check --first 100

# Persist one bounded API page
npm run providers:sync-glama -- --first 100

# Traverse all available public Glama API pages
npm run providers:sync-glama -- --all --first 100

# Resume from the saved Glama API cursor with a bounded number of pages
npm run providers:sync-glama -- --resume --all --max-pages 25
```

The previous public directory JSON-LD parser remains available for a specific page when explicitly requested with `--directory-url`. The default API path does not use an API key, undocumented endpoint, authenticated session, or browser-bypass technique. Glama licence labels are metadata only; a listing is not clone-eligible until its exact repository and licence are independently verified.

### MCPMarket — registered, not scraped

MCPMarket is registered as a future source type. The official token documentation identifies bearer authentication and the `https://app.mcpmarket.com/api/v1` base, but the adapter remains intentionally disabled until a **catalog list/search/pagination endpoint contract** is available:

```bash
npm run providers:mcpmarket-status

# Read-only token validation; MCPMARKET_API_KEY must already be supplied by a local secret environment
npm run providers:mcpmarket-auth-check
```

The public MCPMarket homepage may be readable in a normal browser, but automated worker requests receive a Vercel Security Checkpoint. The project will not bypass that checkpoint, login protection, or other access controls.

MCPMarket's public `robots.txt` exposes a sitemap index at `https://mcpmarket.com/sitemap.xml`, including `tools-N.xml` server sitemap files. The project now includes a **custom sitemap importer** for files downloaded through an approved browser/export path:

```bash
# Place tools-0.xml through tools-7.xml in a local ignored directory, then import URL + lastmod metadata.
npm run providers:import-mcpmarket-sitemaps -- --dir local-library/mcpmarket-sitemaps
```

This discovers all public MCPMarket server URLs and `lastmod` metadata without guessing APIs or scraping authenticated pages. Full per-server detail enrichment still needs an official bulk API/export, or a provider-approved and rate-limited detail-data contract. An API key alone is not a valid catalog integration contract. The retrieved official documentation is indexed in `docs/PROVIDER_DOCUMENTATION_INDEX.md`; any key shared in chat must be rotated before local secret-manager use.

### Other discovery sources

- [Official MCP Registry API documentation](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md)
- [Official Registry OpenAPI document](https://registry.modelcontextprotocol.io/openapi.yaml)
- [Glama directory](https://glama.ai/mcp/servers?attributes=category%3Adeveloper-tools) for broad discovery and category signals
- [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) for curated GitHub discovery

Glama, Awesome lists, articles, and marketplaces are discovery inputs—not automatic proof of licence, ownership, security, or free usage. MCPMarket is authentication-gated and is not bulk-scraped by this project.

## Local library workflow

The default state root is `./local-library/`, which is deliberately ignored by Git. Override it with an absolute `MCP_LIBRARY_HOME` only when your deployment has persistent storage.

```bash
# Inspect curated and synced candidates
npm run library:list
npm run library:free

# Re-check a GitHub candidate's public licence/archival metadata
npm run library:enrich -- --server microsoft/playwright-mcp

# Preview the exact local destination. No network, clone, install, or execution.
npm run library:clone -- --server microsoft/playwright-mcp --yes --dry-run

# Clone one verified provider repository.
# This runs git clone only; it does not run install, build, hooks, or an MCP server.
npm run library:clone -- --server microsoft/playwright-mcp --yes

# Fetch provider HEAD for every clone and report pending changes.
# It never changes checked-out code.
npm run library:refresh

# After reviewing the provider diff, fast-forward exactly one clean clone.
npm run library:apply -- --server microsoft/playwright-mcp --yes
```

To inspect a provider change before applying it:

```bash
git -C local-library/clones/<directory> log --oneline HEAD..FETCH_HEAD
git -C local-library/clones/<directory> diff --stat HEAD..FETCH_HEAD
```

## Free-ready packs

The library provides small, reviewed starting packs rather than an unsafe “install every free server” switch:

| Pack | Included MCPs | Readiness / guardrail |
|---|---|---|
| `free-web-research` | Context7, Playwright | No secret in the template; Playwright browser control must be reviewed. |
| `free-thinking-memory` | Sequential Thinking, Memory | Public official npm packages are pinned; their package metadata says `SEE LICENSE`, so review terms before redistribution. Memory can persist context. |
| `free-developer` | GitHub, Playwright, Context7 | GitHub uses client-supported OAuth; tool scopes and browser sessions need review. |

```bash
npm run library:packs
npm run library:pack -- --name free-web-research
npm run library:pack -- --name free-thinking-memory
npm run library:pack -- --name free-developer
```

Each command writes client-specific configuration templates for Claude Desktop, Cursor, and VS Code under `local-library/packs/<pack-name>/`. No template installs a package or starts a server. “Free” here means the template has no embedded paid credential; hosted provider terms/rate limits and package licences still need review. Local npm-based MCPs use current reviewed pins; check for an upstream release without changing the pins:

```bash
npm run library:check-packages
```

To update a package pin, first inspect the provider release, package provenance/attestation, licence, changelog, and permissions. Then update the curated definition, test it, and regenerate the pack. This preserves the distinction between **provider update awareness** and **silent runtime changes**.

## Client configuration profiles

The library can generate **credential-free templates** for Claude Desktop, Cursor, and VS Code:

```bash
npm run library:profiles
```

Files are written only below the ignored local library root:

```text
local-library/profiles/claude-desktop/claude-desktop.mcp.json
local-library/profiles/cursor/cursor.mcp.json
local-library/profiles/vscode/mcp.json
```

The initial profiles contain provider-documented entries for GitHub remote MCP, Playwright MCP, and Context7 MCP. They intentionally do **not** point at source clones: a clone is for source review, while client configuration should follow the provider's supported package or hosted endpoint. The files contain no API keys or PAT values. Review the provider documentation and use an OAuth/secret flow supported by your MCP client before copying any entry into an active client configuration.

```bash
# Optional: generate a restricted subset
npm run library:profiles -- --servers playwright,context7
```


## Provider update policy

“Always update” is split into two safety levels:

1. **Always check metadata and provider HEAD** — suitable for scheduled jobs. The worker uses Official Registry `updated_since` where possible and `git fetch` for existing clones.
2. **Explicitly apply source-code changes** — never automatic by default. A changed repository can introduce new dependencies, tools, permissions, or malicious code. `library:apply -- --server … --yes` requires a clean fast-forward and user confirmation.

No command performs `npm install`, `pip install`, Docker build, package scripts, Git hooks, or MCP execution. Cloning is only source acquisition.

### Example local scheduler

Adjust `/absolute/path/to/mcp_library` and the log path to your environment:

```cron
# Registry metadata every 6 hours; bounded page size
0 */6 * * * cd /absolute/path/to/mcp_library && /usr/bin/npm run providers:sync -- --limit 100 >> /var/log/mcp-library-provider-sync.log 2>&1

# Check local clone heads every 6 hours, offset from metadata sync
15 */6 * * * cd /absolute/path/to/mcp_library && /usr/bin/npm run library:refresh >> /var/log/mcp-library-provider-sync.log 2>&1
```

For production, run the worker with a persistent database/volume and an authenticated, least-privilege GitHub token only if public API quota is insufficient. Do not use credentials exposed in chat, URLs, or Git history.

## Clone restrictions

The implementation blocks by default:

- non-HTTPS repository URLs;
- URLs containing credentials;
- local `file://`, SSH, and arbitrary host URLs;
- unrecognized Git hosts (initial allowlist: GitHub, GitLab, Codeberg);
- remote-only entries with no source repository;
- archived/deprecated candidate clones;
- `source-available-unverified` entries unless the reviewer explicitly adds `--allow-source-available` together with `--yes`.

The clone command uses a shallow, no-tags, no-submodules Git clone with `core.hooksPath=/dev/null` and `GIT_TERMINAL_PROMPT=0`.

## Research notes

- The [MCP specification](https://modelcontextprotocol.io/specification/2025-11-25) treats tools and their descriptions as powerful/untrusted paths and calls for user consent and control.
- The Official Registry API specifically supports `updated_since`, `version=latest`, search, deleted records, and cursor pagination—features designed for downstream synchronization.
- The public GitHub metadata for [GitHub MCP Server](https://api.github.com/repos/github/github-mcp-server), [Playwright MCP](https://api.github.com/repos/microsoft/playwright-mcp), and [Context7](https://api.github.com/repos/upstash/context7) reports MIT, Apache-2.0, and MIT licences respectively at the observed time.
- Profile endpoints/commands are drawn from the current provider README files for [GitHub MCP Server](https://github.com/github/github-mcp-server), [Playwright MCP](https://github.com/microsoft/playwright-mcp), and [Context7](https://github.com/upstash/context7).
- Browser automation and source-control MCPs may still be high risk even when their source code is free/open source; licence status never replaces a permission review.
