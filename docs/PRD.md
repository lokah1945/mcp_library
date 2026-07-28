# PRD — mcp_library

**Status:** Approved for implementation — public-ready local scaffold created; no remote repository, live crawler, or credentials have been created

**Prepared:** 28 July 2026 (Asia/Jakarta)

## 1. Product summary

`mcp_library` is a trusted discovery and decision layer for **Model Context Protocol (MCP) servers**. It unifies entries from approved directories, curated lists, official registries, provider repositories, and editorial recommendations into one normalized catalog.

It is not merely a link collection. The product should help a developer or AI-agent builder answer:

1. *Which MCP server fits my task, stack, client, operating system, and security constraints?*
2. *Is it official, maintained, compatible, and safe enough to evaluate?*
3. *How do I configure it without exposing secrets?*
4. *What are the closest alternatives, complements, and duplicate listings?*

### Product promise

> Find, compare, validate, and safely configure the right MCP server through explainable, source-backed recommendations.

### Important terminology

In this project, **MCP always means Model Context Protocol**. The system catalogs MCP *servers*, their tools, resources, prompts, transports, packages, authentication needs, and compatibility. Agent orchestration frameworks may be kept only as editorial references; they are not automatically treated as MCP servers.

---

## 2. Problem statement

MCP servers are distributed across directories, GitHub repositories, articles, registries, and marketplaces. Listings are often duplicated, stale, inconsistent in category names, vague about authentication, and incomplete on client/transport support.

A raw aggregate is not enough:

- The same server can be listed under different titles and source URLs.
- Source categories are not a shared taxonomy.
- “Popular” is not equivalent to official, actively maintained, compatible, or secure.
- Setup instructions commonly include credentials and sometimes unsafe default permissions.
- MCP servers can expose powerful data access and code execution paths; users need clear consent, scope, and risk information before installing them.

---

## 3. Vision, goals, and non-goals

### Vision

Become a reliable MCP knowledge base and recommendation engine where every recommendation has visible evidence, constraints, provenance, and configuration guidance.

### Goals

1. **Unify metadata** from the approved sources into a canonical, deduplicated server catalog.
2. **Classify consistently** with a multi-label taxonomy, not one source-specific category.
3. **Map intelligently** from natural-language intent and technical constraints to suitable servers.
4. **Preserve provenance**: users can see each source, sync time, and confidence level.
5. **Make setup safer** through credential-aware, client-specific configuration templates.
6. **Keep the catalog fresh** using incremental sync, health signals, and curator review.
7. **Start focused but scale**: prioritize developer tools while preserving a schema capable of covering every MCP domain.

### Non-goals for the MVP

- Hosting or executing arbitrary third-party MCP servers.
- Automatically invoking MCP tools on behalf of users.
- Storing users’ provider tokens or OAuth refresh tokens.
- Claiming every MCP server on the internet is known or safe.
- Republishing full third-party documentation or bypassing site login/paywalls.
- Replacing an MCP client, package manager, or official registry.

---

## 4. Users and jobs-to-be-done

| Persona | Primary job |
|---|---|
| Developer / AI builder | Find a compatible MCP server for a concrete task and get a safe setup template. |
| Team lead / platform engineer | Evaluate supported server options, licenses, maintenance, auth scope, and operational risk. |
| MCP provider | Make an MCP server discoverable and submit corrections or ownership verification. |
| Curator / administrator | Review proposed entries, resolve duplicates, control taxonomy, and monitor source sync quality. |

### Core user stories

1. As a developer, I can search “read-only GitHub PR review for Cursor on macOS” and receive ranked, explainable compatible results.
2. As a user, I can filter by domain, transport, local/cloud, auth method, license, programming language, client, OS, verification, and maintenance state.
3. As a user, I can compare up to three servers by capabilities, setup, credential needs, maintenance, license, and risk flags.
4. As a user, I can copy a client configuration template containing environment-variable placeholders, never my secret values.
5. As a curator, I can trace each displayed field back to a source record and decide whether an entry is published, pending review, deprecated, or rejected.
6. As a provider, I can submit an update or claim an official listing through an auditable review flow.

---

## 5. Source strategy and source of truth

### Approved seed sources

| Source | Intended role | Ingestion approach | Trust / limitation |
|---|---|---|---|
| Official MCP Registry | High-priority registry source and identifier reference | Official API/feed when available; otherwise documented public interfaces only | High for registry metadata; not a safety guarantee. |
| Glama MCP directory — developer tools filter | Broad discovery, categories, quality/maintenance indicators, links | Use documented API/export or permissioned collection; incremental sync | Broad and fast-moving; category mapping required. |
| `punkpeye/awesome-mcp-servers` | Curated GitHub discovery source | Read public repository data/README and linked repositories | Useful editorial curation; the list itself notes that its web directory syncs with Glama. |
| MCPMarket | Discovery and deployment-marketplace reference | Official API/partner feed/manual curation only | The site requires authentication; no login-wall bypass or unapproved bulk scraping. |
| Medium “10 Best Free MCP Servers…” | Editorial seed / manually curated lead list | Store article URL and extracted public claims only | Not a canonical source; article is member-gated. |
| DEV article supplied by user | Editorial lead only | Manual review of linked projects | It uses “MCP” to mean *Mission Control Platform* and includes orchestration frameworks; do not ingest entries as MCP servers without protocol validation. |
| Provider-owned GitHub repository, package registry, and official docs | Enrichment and verification | Resolve only after discovery and retain canonical links | Highest authority for a provider’s own package, release, setup, and license claims. |

### Source precedence per field

1. Provider’s verified official registry/repository/docs
2. Official MCP Registry
3. Provider package registry metadata and signed releases
4. Curated directory (Glama / Awesome list)
5. Marketplace listing (with declared publisher verification)
6. Editorial article
7. Community submission pending review

A lower-precedence source must never silently overwrite a verified higher-precedence field.

### Collection principles

- Prefer published APIs, feeds, repositories, exports, or partnership agreements over HTML scraping.
- Respect robots.txt, rate limits, Terms of Service, copyright, and source attribution.
- Store concise metadata, normalized facts, hashes, and source URLs—not wholesale copies of third-party content.
- Every imported record retains `source`, `source_url`, `source_record_id` when known, `first_seen_at`, `last_seen_at`, `synced_at`, raw-data hash, and import status.
- Sync jobs are idempotent, throttled, observable, and retryable.
- “All MCP servers” means **all discoverable, policy-compliant records from enabled sources**, not an unverifiable claim of complete global coverage.

---

## 6. Canonical taxonomy

The application will use multi-label categories so one MCP server can belong to several domains.

### Domain categories

Initial taxonomy will map incoming labels to:

- Developer Tools
- Coding Agents
- Code Execution & Sandboxing
- Version Control
- Browser Automation
- Command Line & OS Automation
- Cloud & DevOps
- Databases & Data Platforms
- Search, Web, and Data Extraction
- Files & Documents
- Knowledge, Memory, and Research
- Security, Identity, and Cryptography
- Observability & Monitoring
- Testing & QA
- Collaboration, Communication, and Productivity
- Design & Product
- AI / Model Providers
- Business domains (finance, commerce, legal, health, etc.)
- Other / Needs review

### Cross-cutting facets

Each server can additionally have:

- **Interface:** tools, resources, prompts; tool count when trustworthy
- **Transport:** stdio, Streamable HTTP, SSE/legacy HTTP, unknown
- **Execution:** local, remote/cloud, hybrid
- **Compatibility:** MCP client(s), OS, runtime, package manager
- **Implementation:** TypeScript/JavaScript, Python, Go, Rust, Java, C#, etc.
- **Authentication:** none, API key, OAuth, PAT, service account, local credential, unknown
- **Permissions:** read-only, write, destructive, filesystem, shell/code execution, network egress, sensitive-data access
- **Distribution:** npm, PyPI, container, binary, Git repository, hosted URL
- **Governance:** official/claimed/community, license, release cadence, archival/deprecation state
- **Maturity:** experimental, beta, stable, unknown

Mappings must be versioned. An administrator can see and override the source-label → canonical-label mapping.

---

## 7. Intelligent mapping and recommendations

### 7.1 Query-to-recommendation flow

1. **Interpret intent**: task, named integration, desired capability, constraints, and excluded technologies.
2. **Apply hard filters**: compatibility, OS, transport, local/cloud preference, auth tolerance, license, and required risk level.
3. **Retrieve candidates** via keyword/full-text search, normalized tags, and optional vector similarity.
4. **Rank candidates** using explainable signals.
5. **Return rationale and caveats**: why it matched, required credentials, constraints, source confidence, and safer alternatives.
6. **Collect feedback** only with user consent to improve ranking over time.

### 7.2 Initial transparent ranking model

The first release uses deterministic scoring rather than a black-box-only recommendation:

| Signal | Example effect |
|---|---|
| Intent and capability match | Rewards matching task/capability labels and validated tools. |
| Compatibility match | Hard filter or large penalty for incompatible client, OS, or transport. |
| Provenance and verification | Rewards official/claimed records and corroboration by multiple sources. |
| Maintenance health | Considers recent release/commit, archived state, and stale-record flags. |
| Security / permission fit | Prefers least-privileged, read-only options when requested. |
| Setup fit | Rewards the user’s allowed auth method, runtime, and deployment model. |
| Community signals | Secondary only; stars/downloads never override explicit compatibility or risk. |

Every result should show a concise “Why this is recommended” explanation. LLM-generated classification or summaries must be labeled with confidence and never treated as verified facts without evidence.

### 7.3 Relationship graph

The catalog will model relationships such as:

- `duplicate_of` / `same_project_as`
- `official_successor_of` / `deprecated_by`
- `alternative_to`
- `complements` (for example, database + observability)
- `works_with_client`
- `requires_runtime`, `requires_credential_type`, `requires_service`
- `implements_capability`

Relationships need evidence, confidence, provenance, and curator approval when they affect publication.

---

## 8. Functional requirements

### P0 — foundations

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-01 | Canonical data model | Stores servers, versions, sources, categories, capabilities, auth requirements, distributions, compatibility, relationship edges, review state, and sync history. |
| FR-02 | Source adapters | Each adapter can fetch/parse/normalize, reports counts/errors, is idempotent, and retains provenance. |
| FR-03 | Deduplication | Candidate duplicates are scored using official registry IDs, GitHub owner/repo, package names, canonical URLs, and aliases; uncertain matches go to review. |
| FR-04 | Taxonomy management | Curators can map source labels to canonical multi-label categories with mapping version/history. |
| FR-05 | Secure configuration schema | Supports placeholders and credential metadata but never stores secret values in catalog records. |

### P1 — public catalog MVP

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-06 | Browse/search/filter | Public users can discover servers with pagination, full-text search, facets, sort, and shareable URLs. |
| FR-07 | Detail page | Shows summary, categories, capabilities, installation/configuration, source links, license, verification, freshness, requirements, and risk panel. |
| FR-08 | Compare | Users compare 2–3 candidates side-by-side. |
| FR-09 | Client config export | Generates non-secret templates for initial supported clients; values use `${ENV_VAR}` placeholders and include required variables. |
| FR-10 | Curator queue | Curators can review source changes, duplicates, taxonomy assignments, submissions, and deprecations. |

### P2 — smart discovery

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-11 | Natural-language finder | Accepts an intent and constraints, returns ranked matches with explanations and citations to catalog facts. |
| FR-12 | Alternative / complement map | Detail pages show explicit, evidence-backed related servers. |
| FR-13 | Saved collections | Signed-in users can save an evaluated stack/list without saving provider secrets. |
| FR-14 | Feedback loop | Users can mark recommendations useful/not useful with optional reason; ranking metrics are auditable. |

### P3 — ecosystem interface

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-15 | Public read API | Versioned, rate-limited, documented catalog API with attribution and licensing rules. |
| FR-16 | Submission/claim workflow | Providers can submit/claim listings; all changes are reviewed and traceable. |
| FR-17 | Change monitoring | Subscribers can see deprecation, compatibility, security, or release changes for followed records. |

---

## 9. Data model (MVP)

### Core entities

```text
Server
  id, canonical_slug, name, short_description, long_description
  official_status, lifecycle_status, maturity, publisher_id
  homepage_url, repository_url, documentation_url, canonical_registry_id
  license_spdx, created_at, updated_at, first_seen_at, last_verified_at

ServerVersion / Distribution
  server_id, version, runtime, package_manager, package_name
  install_command_template, transport, endpoint_template, released_at

SourceRecord
  source_name, source_url, external_id, raw_hash, observed_payload_metadata
  first_seen_at, last_seen_at, last_synced_at, import_status, source_confidence

ServerSource (provenance)
  server_id, source_record_id, field_name, value, precedence, evidence_url

Category / ServerCategory
  taxonomy_version, category_slug, source_label, assignment_method, confidence

Capability / ServerCapability
  kind (tool/resource/prompt), label, description, safety_annotation, confidence

Requirement
  type (client, os, runtime, credential, dependency, service)
  value, required, setup_notes

CredentialRequirement
  credential_kind, env_var_name, secret_required, scopes, setup_url

SecurityProfile
  permission_tags, risk_level, review_status, disclosure_url, notes

Compatibility
  client_name, client_version_range, transport, os, confidence, evidence_url

Relationship
  from_server_id, relation_type, to_server_id, confidence, evidence_url, review_status

SyncRun / ReviewDecision / ChangeEvent
  operational and audit records
```

### Data quality states

- **Verified**: provider/official authoritative evidence reviewed.
- **Corroborated**: more than one credible source agrees.
- **Imported**: automatically ingested but not manually verified.
- **Needs review**: incomplete, conflicting, or possible duplicate.
- **Deprecated / archived**: preserved for discoverability but clearly flagged.
- **Rejected**: retained only in restricted audit data with a reason.

---

## 10. Security, privacy, and credential policy

MCP can enable arbitrary data access and code execution, so safety is a product requirement—not a badge or afterthought.

### Mandatory controls

1. **No secrets in source code, database records, logs, exported configuration, screenshots, or documentation.**
2. `.env` is local-only, ignored by Git, and never committed. Only `.env.example` with empty placeholders is committed.
3. API keys/tokens are entered by the user in their own environment or secret manager, not through the public catalog.
4. Every configuration export uses placeholders such as `${GITHUB_TOKEN}`, with scope guidance and least-privilege recommendations.
5. Detail pages show data-access and action-risk flags: filesystem, shell/code execution, write/destructive action, network egress, remote credentials, and sensitive data.
6. Auto-install, auto-run, and auto-authorize are out of scope for MVP. The user reviews commands and permissions before execution.
7. All rendered third-party Markdown/HTML is sanitized; outbound links are clearly labeled.
8. Admin authentication, RBAC, audit trails, rate limits, input validation, CSRF protection, secure headers, and dependency scanning are required before production.
9. The system must distinguish unverified claims from source-backed facts and support takedown/correction requests.

### Credential environment plan (later scaffold)

An example-only file will be committed as `.env.example`:

```dotenv
# Required after a database-backed build is scaffolded
DATABASE_URL=

# Optional: improves GitHub public API rate limits for source enrichment.
# Use a newly issued, minimum-scope token in local/secret-manager storage only.
GITHUB_TOKEN=

# Optional: enable managed semantic embeddings only after provider selection.
EMBEDDING_PROVIDER=local
EMBEDDING_API_KEY=

# Required only for an authenticated admin area in deployed environments
AUTH_SECRET=
AUTH_URL=
```

No actual `.env` file or real credential is required for this PRD phase. In particular, any token that was shared in a message must be treated as exposed, revoked/replaced by its owner, and must not be placed in this project.

---

## 11. Technical architecture (recommended)

### Recommended implementation

A modular TypeScript monorepo, initially optimized for a reliable catalog rather than premature microservices.

```text
mcp_library/
  apps/
    web/                 # Next.js UI + read/admin API routes
    worker/              # scheduled source sync / normalization / enrichment jobs
  packages/
    catalog-schema/      # Zod schemas, canonical types, taxonomy contracts
    source-adapters/     # one adapter per approved source
    recommender/         # deterministic rules, explanations, relationship logic
    config-exporters/    # non-secret templates by MCP client
  docs/                  # PRD, ADRs, data dictionary, source policies
  infra/                 # Docker/CI/deployment definitions (later)
```

### Stack choices

- **UI/API:** Next.js + TypeScript, server-rendered catalog pages.
- **Database:** PostgreSQL; use native full-text search first, plus `pgvector` only when semantic retrieval is activated.
- **Data access & validation:** Drizzle ORM (or Prisma if the team prefers it) plus Zod.
- **Jobs:** a worker process using PostgreSQL-backed jobs (for example `pg-boss`) to avoid adding Redis during MVP.
- **Search:** PostgreSQL full-text/facets initially; dedicated search engine only after measured need.
- **Auth:** no end-user login in initial catalog browse; authenticated RBAC for curators in P1; provider claims and saved lists in P2.
- **Observability:** structured logs, sync-run dashboard, error tracking, metrics, and alerting around freshness/import failures.
- **Quality gates:** unit tests for normalizers/dedupe/ranking; contract fixtures for every source adapter; E2E tests for browse, filters, and no-secret config export.

### Why this is the default

The workload is primarily relational catalog data plus periodic ingestion. PostgreSQL enables provenance, filters, audit data, queues, and baseline search without prematurely operating several infrastructure services. The worker is isolated so source polling cannot degrade the public UI.

---

## 12. API and page outline

### Public pages (P1)

- `/` — search-led home and category exploration
- `/servers` — faceted directory
- `/servers/[slug]` — profile, evidence, setup, compatibility, risk, alternatives
- `/compare?servers=a,b,c` — comparison
- `/categories/[slug]` — canonical category view
- `/methodology` — source, scoring, taxonomy, and security methodology

### Curator pages (P1)

- `/admin/syncs` — sync health and adapter errors
- `/admin/review` — duplicates, changes, taxonomy, and submissions
- `/admin/taxonomy` — mapping governance

### Public read API (P3)

```text
GET /api/v1/servers
GET /api/v1/servers/{slug}
GET /api/v1/categories
GET /api/v1/search?q=&filters=
GET /api/v1/servers/{slug}/related
```

The API must return provenance, verification status, freshness, pagination, and rate-limit headers. It will not return any actual credentials.

---

## 13. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | First catalog page and search results should target a sub-2.5-second LCP on typical broadband; filtering should feel immediate with debounced requests. |
| Reliability | Failed source imports must not erase last-known-good published records; each run is auditable and retryable. |
| Freshness | Store displayed sync/verification timestamps; high-priority sources refreshed on an agreed cadence with backoff and quotas. |
| Accessibility | Keyboard-operable, semantic markup, contrast-compliant, responsive UI; target WCAG 2.2 AA. |
| Internationalization | Data schema supports localized display text. MVP product UI may launch English-first; Indonesian UI can be enabled once copy ownership is agreed. |
| Explainability | Every recommendation, score indicator, relationship, and verification label must have a human-readable basis. |
| Legal / attribution | Preserve source/provider attribution and links; honor licenses and removal requests. |
| Safety | No configuration export contains a literal secret. All risky capabilities are visible before installation. |

---

## 14. Metrics and success criteria

### Catalog quality

- Source coverage, by enabled source and taxonomy domain.
- Percentage of published records with canonical repository or registry link.
- Percentage with known transport, license, auth requirement, and verification state.
- Duplicate candidate rate and curator resolution time.
- Sync success rate, freshness SLA, and source parsing failure rate.

### Product usefulness

- Search-to-detail click-through rate.
- Search refinement rate (lower after quality improves).
- Config-template copy rate.
- Compare-page use rate.
- Recommendation helpfulness score.
- Percentage of query results with an explicit explanation and provenance.

### Safety

- Zero committed secrets.
- Zero literal credentials in configuration exports or logs.
- Percentage of potentially destructive servers with reviewed permission/risk tags.
- Time to flag/update deprecated or compromised listings.

---

## 15. Delivery plan

### Phase 0 — product foundation (this document; approval needed)

- Approve audience, release boundary, repository visibility, source permissions, and language.
- Finalize taxonomy v1 and canonical schema.
- Create architectural decision records (ADRs) and source adapter contracts.

### Phase 1 — trustworthy catalog MVP

- Scaffold web, database, worker, schema, linting/tests, CI, `.gitignore`, and empty `.env.example`.
- Implement source adapters for the official registry plus the Awesome list; add Glama only through an approved interface.
- Build normalization, provenance, dedupe review queue, taxonomy mapping, and data-quality states.
- Release browse/search/filter/detail/compare and safe configuration templates.
- Seed **Developer Tools** first, then expand by category.

### Phase 2 — intelligent mapping

- Add deterministic intent matcher, compatibility filters, transparent recommendation explanations, and relationship graph.
- Add optional local/vector retrieval with evaluation fixtures and human feedback.
- Support saved collections and provider submission workflows.

### Phase 3 — ecosystem scale

- Add approved marketplace/provider connectors, published read API, webhooks/change monitoring, additional client exporters, and public contribution governance.
- Evaluate multilingual UI, enterprise/team workspaces, and partner integrations only after security and data quality targets are met.

---

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Duplicate/stale/conflicting listings | Field-level provenance, source precedence, canonical identifiers, review queue, last-known-good records. |
| Source access restrictions | Use official interfaces/partnerships/manual curation; do not bypass authentication, paywalls, or anti-bot controls. |
| Unsafe server recommendation | Make risk/permission signals prominent; require evidence; never auto-run servers; add advisories/deprecation path. |
| Hallucinated/incorrect classification | Deterministic mappings first; label AI suggestions; require evidence and curator review for publication-impacting fields. |
| Recommendation bias toward popularity | Compatibility, permission fit, provenance, and freshness outrank stars/downloads. |
| Credential leak | Placeholder-only exports, ignore `.env`, secret scanning, least-privilege documentation, no token persistence. |
| Scalability of large directories | Cursor/incremental syncs, normalized storage, content hashing, queue backoff, caching, and paginated APIs. |
| Licensing/content reuse | Store facts and links, preserve attribution, follow source license/terms, support corrections/takedown. |

---

## 17. Open decisions requiring product-owner approval

| Decision | Recommended default | Why it matters |
|---|---|---|
| Launch audience | Public catalog with authenticated curator area | Determines auth, moderation, and hosting needs. |
| First catalog scope | Developer Tools first; schema ready for all categories | Delivers useful quality before attempting 60k+ listings. |
| Repository visibility | Private during development, public after security/data review | Prevents accidental disclosure while operating source adapters. |
| User interface language | English UI first, Indonesian project docs; add i18n structure now | Catalog metadata is mostly English; UI language can expand later. |
| Source integration | Official Registry + Awesome first; Glama via approved interface; MCPMarket manually/partner-integrated | Reduces legal, technical, and data-quality risk. |
| Semantic model | No paid model initially; use deterministic search/ranking and optional local embeddings | Avoids a new API cost and sending catalog content externally. |
| Remote GitHub repository | Create only after a new, scoped token or interactive GitHub authentication is configured securely | Prevents use of an exposed credential and avoids placing secrets in project files. |

---

## 18. Research references

- [MCP specification](https://modelcontextprotocol.io/specification/2025-11-25) — protocol model, capabilities, and security/trust guidance.
- [Official MCP Registry repository](https://github.com/modelcontextprotocol/registry) — community registry implementation reference.
- [Glama MCP Servers](https://glama.ai/mcp/servers?attributes=category%3Adeveloper-tools) — broad directory and developer-tools discovery entry point.
- [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) — curated server list and categories.
- [MCPMarket](https://app.mcpmarket.com/) — marketplace reference, subject to authenticated access/API agreement.
- [Medium: 10 Best Free MCP Servers for Developers in 2026](https://medium.com/syntest/10-best-free-mcp-servers-for-developers-in-2026-20bd96314f4b) — editorial seed, not source of truth.
- [DEV article supplied](https://dev.to/dev_tips/10-open-source-mcps-that-make-your-ai-agents-smarter-than-your-team-lead-m3p) — editorial lead only; terminology must be verified before ingestion.


---

## 19. Approval record and next gate

The product owner approved the recommended implementation direction on 28 July 2026: **public-ready development, Developer Tools first, bilingual Indonesian–English UI, and the recommended TypeScript/Next.js + PostgreSQL architecture**. The local scaffold may proceed with no real credentials committed or copied into the workspace.

A remote GitHub repository remains gated on two inputs: (1) the target GitHub account or organization, and (2) secure, newly issued authentication. A credential exposed in a message must not be used for this purpose.

---

## 20. Approved extension — free MCP discovery and local provider library

The initial implementation now includes a local provider-library capability with these boundaries:

- **Official Registry sync:** use public cursor pagination, `version=latest`, and `updated_since` metadata synchronization as the primary live source. Sync records remain provenance-backed and Git-ignored unless a future database implementation publishes reviewed facts.
- **Free classification:** distinguish verified open-source source code, source-available-but-unverified projects, remote free tiers, and unknown status. A public repository or an editorial “free” claim is not enough to label an entry open source.
- **Local clone manager:** clone one selected, verified source repository at a time through a CLI. It performs no dependency install, package script, build, MCP launch, submodule checkout, or Git hook execution.
- **Client profiles:** generate provider-documented, credential-free templates for Claude Desktop, Cursor, and VS Code. A profile never points at a source clone and is not copied into a user client automatically.
- **Provider tracking:** scheduled sync and clone refresh are permitted to check metadata/provider HEAD. Applying code updates remains an explicit human operation because provider changes can alter dependencies, permissions, and tool behaviour.
- **Clone policy:** require HTTPS, no embedded credentials, approved public Git hosts, a repository URL, active lifecycle state, and verified open-source licence by default. Unverified source availability needs an explicit review override.

See `docs/FREE_MCP_LOCAL_LIBRARY.md` for operations, scheduler examples, and the current curated starter set.

### Implementation checkpoint — 28 July 2026

- **Glama full source coverage:** The implementation now uses Glama's public MCP API with `first` page sizing and `pageInfo.endCursor` pagination. A full live traversal fetched 61,417 records across 615 pages, while the public directory counter observed nearby showed 61,447; the difference is retained as a source-timing/indexing observation rather than filled artificially.
- **Catalog scale:** The latest local snapshot contains 61,522 unique candidates when combined with Official MCP Registry and curated provider records. The browser receives a capped discovery window; full operations use the local worker/CLI and should move to PostgreSQL before shared production deployment.
- **MCPMarket:** The project supports safe import of provider-approved public sitemap exports for server URL + `lastmod` discovery. It does not claim full MCPMarket detail coverage or API catalog sync because a documented catalog endpoint contract has not been confirmed and a temporary bearer `/me` check returned HTTP 401.
- **Release record:** See `CHANGELOG.md`, `docs/LIVE_TEST_REPORT.md`, and `docs/PROVIDER_DOCUMENTATION_INDEX.md` for implementation evidence and source documentation.
