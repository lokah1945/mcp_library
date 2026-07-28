# Official provider & marketplace documentation index

**Research refreshed:** 28 July 2026 (Asia/Jakarta)

This index records the official documentation needed to integrate, validate, configure, and update sources used by `mcp_library`. It deliberately separates **catalog discovery**, **provider deployment**, and **runtime MCP configuration**.

> A documentation link or public API endpoint is not permission to bypass authentication, rate limits, Vercel/anti-bot checks, Terms of Service, or licensing requirements.

---

## 1. Model Context Protocol and Official MCP Registry

| Need | Official documentation | Project use |
|---|---|---|
| MCP introduction and architecture | [MCP documentation](https://modelcontextprotocol.io/docs) · [Architecture](https://modelcontextprotocol.io/docs/learn/architecture) | Protocol terminology, host/client/server model, transports, capabilities. |
| MCP security | [Security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices) | Consent, tool-risk presentation, safe configuration policy. |
| Registry interactive API | [Official Registry Reference](https://registry.modelcontextprotocol.io/docs) | Primary live source for server metadata. |
| Official API reference | [official-registry-api.md](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md) | `GET /v0.1/servers`, latest version filter, `updated_since`, cursor pagination, detail/version endpoints. |
| Registry OpenAPI | [openapi.yaml](https://registry.modelcontextprotocol.io/openapi.yaml) | Schema/contract implementation and fixture validation. |
| Registry source/publishing docs | [Registry GitHub repository](https://github.com/modelcontextprotocol/registry) | Publishing, validation, server.json, and implementation reference. |

### Integration status

**Enabled.** The worker uses the documented public list endpoint with `version=latest`; it supports bounded pages, cursor sync design, search, and `updated_since` metadata.

---

## 2. Glama

| Need | Official documentation / endpoint | Project use |
|---|---|---|
| MCP directory | [Glama MCP Servers](https://glama.ai/mcp/servers) | Discovery, category signals, public listing metadata. |
| Public server detail API example | [`GET /api/mcp/v1/servers/software-mansion/argent`](https://glama.ai/api/mcp/v1/servers/software-mansion/argent) | Confirms returned server metadata: repository, SPDX licence, attributes, environment-variable schema, tools, and URL. |
| Public server list API | [`GET /api/mcp/v1/servers`](https://glama.ai/api/mcp/v1/servers) | Public paginated discovery response with `servers` and `pageInfo` cursors. |
| Registry/server.json guidance | [Official Registry Server.json Requirements](https://glama.ai/blog/2026-01-24-official-mcp-registry-serverjson-requirements) | Context only; this is Glama’s explanatory content, not a replacement for the Official Registry specification. |
| Glama MCP hosting | [Glama MCP Server Hosting](https://glama.ai/blog/2025-09-10-glama-mcp-server-hosting) | Hosting reference; private hosting URLs/tokens must not be cataloged or logged. |

### Integration status

**Enabled, public metadata only.** The current worker uses the public Glama MCP API with `first` page size plus `pageInfo.endCursor` cursor pagination. The directory JSON-LD parser remains a compatibility mode for an explicitly supplied public page. No Glama API key is required or used for the current sync.

### Key policy

`GLAMA_API_KEY` and `GLAMA_API_BASE_URL` are reserved only for a future documented authenticated integration. The default public endpoint is `https://glama.ai/api/mcp/v1`; no secret belongs in Git, logs, profiles, or chat.

---

## 3. MCPMarket

| Need | Official documentation | Project use |
|---|---|---|
| Documentation hub | [MCPMarket Docs](https://docs.mcpmarket.com/docs) | Canonical onboarding and feature navigation. |
| Platform overview | [What is MCP Market](https://docs.mcpmarket.com/docs/getting-started/what-is-mcpmarket) | Understand catalog, custom deployments, toolkits, skills, organizations, and programmatic access. |
| Browse catalog | [Browse the catalog](https://docs.mcpmarket.com/docs/mcp-servers/browsing-the-catalog) | UI-driven discovery fields: server description, tools, authentication type, configuration. |
| Connect a catalog server | [Connect an MCP server](https://docs.mcpmarket.com/docs/mcp-servers/connecting-an-mcp-server) | API key/OAuth flows and global vs user access levels. |
| Connect to AI clients | [Connect to Claude or Cursor](https://docs.mcpmarket.com/docs/getting-started/connecting-to-mcp-clients) | Use a managed deployment/toolkit endpoint in an MCP client. |
| Custom deployment | [Deploy a custom MCP server](https://docs.mcpmarket.com/docs/mcp-servers/deploying-a-custom-mcp-server) | Public GitHub, npm, PyPI, and Docker source options; deployment lifecycle and source trust boundary. |
| Toolkit composition | [What are toolkits](https://docs.mcpmarket.com/docs/toolkits/what-are-toolkits) | Least-tool composition and a single endpoint for selected tools. |
| API token creation | [Create API tokens](https://docs.mcpmarket.com/docs/api-tokens/creating-api-tokens) | Organization-scoped programmatic token lifecycle. |
| API token authentication / revocation | [Use API tokens](https://docs.mcpmarket.com/docs/api-tokens/using-api-tokens) | Bearer authentication and documented `GET https://app.mcpmarket.com/api/v1/me` example; token revocation. |
| Deployment operations | [Manage deployments](https://docs.mcpmarket.com/docs/mcp-servers/managing-deployments) | Pending/building/deploying/running lifecycle, rebuild, secret handling. |

### Integration status

**Registered with a read-only authentication check and a public-sitemap importer; API catalog sync remains disabled.** The documentation confirms bearer-token programmatic access at `https://app.mcpmarket.com/api/v1`, but the documentation retrieved so far does not publish a catalog-list/search/pagination endpoint contract required for a trustworthy crawler/adapter.

MCPMarket's public `robots.txt` publishes `https://mcpmarket.com/sitemap.xml`, which links to `tools-N.xml` server sitemap files. `mcp_library` includes `providers:import-mcpmarket-sitemaps`, a custom importer for sitemap files downloaded via an approved browser/export path. It imports public server URLs and `lastmod` metadata only; it does not bypass security controls or scrape detail pages.

The project exposes `npm run providers:mcpmarket-auth-check`, which sends one read-only `GET /me` request only when `MCPMARKET_API_KEY` is already present in the process environment; it logs neither the token nor response values.

Direct automated fetches of the public homepage receive a Vercel Security Checkpoint. `mcp_library` will not bypass that control, a login wall, or a browser challenge. Full per-server enrichment needs an official bulk API/export, or a provider-approved detail contract with pagination, fields, rate limits, and permission semantics.

---

## 4. Curated free-ready MCP providers

### GitHub MCP Server

- [Official repository and installation overview](https://github.com/github/github-mcp-server)
- [Remote GitHub MCP Server documentation](https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md)
- [Installation guides](https://github.com/github/github-mcp-server/tree/main/docs/installation-guides)
- [Release downloads](https://github.com/github/github-mcp-server/releases)

**Project use:** source clone, provider freshness check, and template configuration. Prefer documented OAuth or the remote `/readonly` toolset when read-only behavior is sufficient. Never place a personal access token in generated profiles.

### Microsoft Playwright MCP

- [Official repository / README](https://github.com/microsoft/playwright-mcp)
- [Playwright MCP README configuration and client guides](https://github.com/microsoft/playwright-mcp/blob/main/README.md)
- [Playwright documentation](https://playwright.dev/docs/intro)

**Project use:** source clone and pinned `@playwright/mcp` ready-pack template. Browser control is not a security boundary; use a dedicated browser profile and scope allowed origins/permissions where supported.

### Upstash Context7

- [Official repository](https://github.com/upstash/context7)
- [Context7 server manifest](https://github.com/upstash/context7/blob/master/server.json)
- [Context7 all-client guides](https://context7.com/docs/resources/all-clients)
- [Context7 CLI documentation](https://context7.com/docs/clients/cli)
- [Context7 documentation index](https://context7.com/docs/llms.txt)

**Project use:** source clone, remote endpoint template, and free-ready pack. The remote service can use an optional API key/header or OAuth where client support exists; generate only placeholders, never values.

### Official reference packages used by ready packs

- [Sequential Thinking package](https://www.npmjs.com/package/@modelcontextprotocol/server-sequential-thinking)
- [Memory package](https://www.npmjs.com/package/@modelcontextprotocol/server-memory)
- [MCP Servers reference repository](https://github.com/modelcontextprotocol/servers)

**Project use:** version-pinned ready-pack entries plus public npm metadata checks. The npm metadata currently declares `SEE LICENSE`; use is not a legal determination and redistribution requires licence review.

---

## 5. Source integration decision matrix

| Source | Discovery mode | Credentials now | Production requirement |
|---|---|---|---|
| Official MCP Registry | Documented REST API | None for read sync | Incremental cursor state, rate/backoff, persistent database. |
| Glama | Public JSON-LD directory sync; public API verified | None | Move to documented list API contract with cursor/filter test fixtures. |
| Awesome MCP Servers | Public GitHub repository parser | None | Respect repository licence and incremental GitHub update checks. |
| MCPMarket | Docs/API-token capability verified; catalog endpoint not yet documented | None used | Official catalog endpoint contract and a newly issued local-only token if required. |
| Provider GitHub/npm docs | Provider-owned public docs/API | Optional quota token only | Licence, source ownership, release, signature/provenance, and risk review. |

---

## Credential rules

1. Treat every key sent in chat, URL query, screenshot, issue, or commit as exposed; revoke/rotate it.
2. Store only newly issued keys in local `.env` or a deployment secret manager.
3. Commit `.env.example` placeholders only.
4. Do not use credentials to defeat bot protection, access restrictions, or client-side controls.
5. A marketplace token authorizes an organization-level account; it does not authorize mass scraping, unsafe deployment, or automatic runtime execution of third-party MCP servers.
