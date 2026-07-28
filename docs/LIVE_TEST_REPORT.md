# Live Test Report — MCP discovery and readiness

**Executed:** 28 July 2026 (Asia/Jakarta)

## Scope

This was a live **metadata discovery** test against the public Official MCP Registry. It did **not** install packages, launch arbitrary MCP servers, perform tool calls, or add credentials.

Command used:

```bash
npm run providers:sync -- --limit 100
```

The worker called the Official MCP Registry list endpoint using `version=latest` and persisted only the normalized catalog snapshot under the Git-ignored `local-library/` path.

## Result

| Metric | Result |
|---|---:|
| Requested live page size | 100 |
| Records returned by this live registry page | **98** |
| Registry pages fetched | 1 |
| Unique MCP candidates now in the local catalog before Glama sync | **105** |
| Official Registry candidates in local catalog | 101 |
| Curated provider-repository candidates | 4 |
| Verified open-source / clone-eligible candidates | 3 |
| Source-available but licence-unverified candidates | 88 |
| Unknown or remote-only candidates | 14 |
| Active candidates | 104 |
| Archived candidates | 1 |

The catalog contained **105 unique canonical names**; duplicate detection found no duplicate canonical names after this sync.

## Verified local source clones

The following provider repositories remain checked out and current after provider-head refresh:

| MCP source | License status | Local state |
|---|---|---|
| `github/github-mcp-server` | MIT | Current |
| `microsoft/playwright-mcp` | Apache-2.0 | Current |
| `upstash/context7` | MIT | Current |

## Free-ready package check

The locally generated free-ready packs reference these pinned public npm packages. The live registry check reported all as current:

| MCP package | Pinned | Latest at test time | Result |
|---|---:|---:|---|
| `@playwright/mcp` | `0.0.78` | `0.0.78` | Current |
| `@modelcontextprotocol/server-sequential-thinking` | `2026.7.4` | `2026.7.4` | Current |
| `@modelcontextprotocol/server-memory` | `2026.7.4` | `2026.7.4` | Current |

## Important interpretation

A successfully discovered registry entry is **not** automatically a successfully runnable or safe MCP server. Entries may require OAuth, API keys, an account, a local runtime, provider policy acceptance, a reviewed licence, or additional permission approval.

The current project distinguishes:

- **Discovery:** registry metadata was fetched successfully.
- **Clone eligibility:** only verified open-source provider repositories are cloned by default.
- **Ready pack:** a credential-free configuration template was generated; this is not an automatic install or execution.
- **Runtime health:** intentionally not tested for arbitrary third-party entries in this run.

## Scaling the catalog

The bounded live test used one page for safety and predictable runtime. A full registry traversal is available through:

```bash
npm run providers:sync -- --all
```

Before running a full traversal in production, use persistent database storage, rate limits/backoff, resumable cursors, source policy controls, and a curator review queue.

## Additional live source — Glama public directory

A second live test ran:

```bash
npm run providers:sync-glama
```

| Metric | Result |
|---|---:|
| Public Glama entries parsed from the selected directory page | **20** |
| API key used | 0 |
| Total unique candidates after Official Registry + Glama sync | **125** |
| Source split | 101 Official Registry, 20 Glama, 4 curated provider records |

The Glama adapter parses publicly embedded JSON-LD only. It does not use an undocumented API, a credential, an authenticated session, or an anti-bot bypass.

## MCPMarket read-only authentication test

The project added a credential-safe check against the officially documented bearer-token identity endpoint:

```bash
npm run providers:mcpmarket-auth-check
```

A one-time in-memory test was executed with the temporary user-authorized credential. The result was:

| Test | Result |
|---|---|
| `GET https://app.mcpmarket.com/api/v1/me` with Bearer authentication | **HTTP 401 Unauthorized** |
| Secret written to `.env`, source, Git, local library, logs, or output | **No** |
| MCPMarket catalog sync | **Not enabled** |

The result means this credential cannot authenticate against the documented endpoint at test time. It may be revoked, expired, malformed, scoped differently, or intended for another API surface. The credential value is intentionally omitted from this report and should be revoked/rotated.

MCPMarket catalog synchronization is still intentionally blocked because the official public documentation gathered so far does not define a catalog list/search/pagination endpoint contract. The project will not guess endpoints or bypass the Vercel Security Checkpoint on automated homepage access.


## Full Glama API traversal remediation

The original 20-entry Glama directory import was a bounded page and was **not** representative of the full source. The adapter was upgraded to use Glama’s public cursor-paginated MCP API and a complete live run was executed:

```bash
npm run providers:sync-glama -- --all --first 100 --max-pages 700
```

| Metric | Result |
|---|---:|
| Glama API pages fetched | 615 |
| Glama records fetched | **61,417** |
| Glama `hasNextPage` after run | `false` |
| Total unique local catalog candidates | **61,522** |
| Local snapshot size | ~50.9 MB |

The Glama website directory showed 61,447 at a nearby observation time; the API traversal returned 61,417. This 30-record difference is treated as a live-source timing/indexing difference, not silently invented or filled. The worker now retains the returned API cursor and supports bounded resume.

MCPMarket remains separate: its documented API authentication check returned HTTP 401 with the temporary supplied credential, and its documented catalog list/search/pagination API contract has not yet been found. It is not counted as a successful full source.
