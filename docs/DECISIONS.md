# Initial decisions

**Recorded:** 28 July 2026 (Asia/Jakarta)

The product owner approved the baseline PRD with these choices:

| Decision | Chosen value | Implementation consequence |
|---|---|---|
| Continue to scaffold | Approved | A working local, public-ready scaffold may be created. |
| Repository visibility | Public immediately | The source is structured to be safe for publication; no secret, real credential, or copied authenticated URL is included. A remote will only be created after owner/organization and secure authentication are confirmed. |
| UI language | Bilingual Indonesia–English | UI strings and catalog seed fields are modeled in both languages; source facts keep their original language when no reliable translation exists. |
| Initial scope | Developer Tools first | Taxonomy supports all domains, while early review and source work prioritize developer tooling. |
| Initial stack | Next.js + TypeScript + PostgreSQL design | UI and contracts are implemented now; database persistence is the next milestone. |
| First sources | Official Registry + Awesome list | The adapter framework includes an Awesome parser and dry-run worker. Live collection requires source-policy approval and database setup. |

## Security decision

No credential submitted in conversation is accepted as a project credential. Any token exposed outside a secret manager must be revoked and newly issued before a future remote GitHub push or authenticated source enrichment.

## Source implementation update — 28 July 2026

| Source | Decision | Result |
|---|---|---|
| Official MCP Registry | Use documented REST discovery and retain cursor/freshness state. | Enabled; 101 records in the latest local snapshot. |
| Glama | Replace the initial 20-entry directory preview with the public cursor-paginated MCP API. | Enabled; 61,417 records fetched across 615 pages in the latest full run. |
| MCPMarket API | Do not infer undocumented catalog endpoints or bypass Vercel Security Checkpoint. | API catalog sync remains disabled. A temporary `/me` bearer check returned HTTP 401. |
| MCPMarket sitemap | Support provider-approved browser/exported public `tools-N.xml` files for URL + `lastmod` discovery. | Custom importer enabled; full import waits for exported sitemap files or a provider-approved fetch path. |
| Browser UI | Do not serialize the full 60k+ snapshot to client-side React state. | UI reports full count and shows a capped curated discovery window; CLI operates on the complete local snapshot. |
