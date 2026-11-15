import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { availablePackageProfiles, exportFreePackProfile, exportLocalProfile, freePacks, type FreePackName, type LocalProfileClient, type ProfileServer } from "@mcp-library/config-exporters";
import {
  DEFAULT_GLAMA_DEVELOPER_TOOLS_URL,
  MCPMARKET_SITEMAP_INDEX_URL,
  OFFICIAL_REGISTRY_BASE_URL,
  glamaApiServerToEntry,
  normalizeAwesomeMarkdown,
  parseMcpMarketSitemapIndex,
  parseMcpMarketToolsSitemap,
  parseGlamaApiPage,
  parseGlamaDirectoryHtml,
  parseOfficialRegistryPage,
  type OfficialRegistryPage
} from "@mcp-library/source-adapters";
import { curatedFreeSeeds } from "./lib/free-seeds";
import { has, parseArgs, positiveNumber, required, value, type ParsedArgs } from "./lib/cli-args";
import {
  candidateFromGlama,
  candidateFromMcpMarket,
  candidateFromOfficialRegistry,
  cloneCandidate,
  enrichFromGitHub,
  ensureSnapshot,
  getLibraryRoot,
  listCandidates,
  listCloneManifests,
  refreshClone,
  applyCloneUpdate,
  updateGlamaSnapshot,
  updateMcpMarketSnapshot,
  updateOfficialSnapshot,
  upsertCandidate,
  type LibraryCandidate
} from "./lib/local-library";

function printHelp(): void {
  console.log(`
mcp_library provider and local-clone commands

  npm run providers:sync -- [--limit 25] [--all] [--search term] [--updated-since RFC3339] [--enrich-github]
      Fetches public Official MCP Registry metadata. Default is one page with up to 25 latest versions.
      --all follows pagination and can be large. --enrich-github is opt-in and may hit public API quota.

  npm run providers:check -- [--limit 25] [--search term]
      Performs a read-only registry health/discovery check without persisting a snapshot.

  npm run providers:sync-glama [--first 100] [--all] [--max-pages N] [--resume] [--check]
      Ingests Glama's documented MCP API with cursor pagination. The API has required a key since
      2026-08-26: export GLAMA_API_KEY from your local secret environment first (never as a CLI argument).
      Default fetches one API page; --all follows every page and should run on persistent storage.

  npm run providers:sync-glama -- --directory-url <public-directory-url> [--check]
      Compatibility mode: ingests public JSON-LD from a Glama directory page.

  npm run providers:mcpmarket-status
      Reports MCPMarket catalog-integration status without reading a credential.

  npm run providers:mcpmarket-auth-check
      Makes one read-only GET /me request using MCPMARKET_API_KEY from the process environment.
      It prints only HTTP success/schema keys, never the key or response values.

  npm run providers:import-mcpmarket-sitemaps -- --dir <directory> [--check]
      Imports official MCPMarket tools sitemap XML files downloaded via an approved browser/export path.
      This discovers all public server URLs and lastmod data without API guessing or security-checkpoint bypass.
      --check parses and reports the files without persisting a snapshot.

  npm run library:list [--limit 50] [--query term]
  npm run library:free [--limit 50] [--query term]
      Lists a bounded, searchable view of local catalog candidates. Free means verified open-source or source-available pending licence review.

  npm run library:enrich -- --server <canonical-name>
      Retrieves public GitHub licence/archival metadata for a GitHub candidate.

  npm run library:clone -- --server <canonical-name> --yes [--dry-run] [--allow-source-available]
      Clones only a reviewed provider repository. No package install, build, hook, or MCP execution occurs.

  npm run library:refresh [-- --server <canonical-name>]
      Fetches provider HEAD and reports whether a local clone has an update. Does not alter checked-out code.

  npm run library:apply -- --server <canonical-name> --yes
      Explicitly fast-forwards one clean local clone to the provider's fetched HEAD after review.

  npm run library:status
      Shows local clone manifests and update state.

  npm run library:packs
      Lists the curated free-ready pack definitions and their risk notes.

  npm run library:pack -- --name <free-web-research|free-thinking-memory|free-developer>
      Writes credential-free pack templates for Claude Desktop, Cursor, and VS Code under local-library/packs.

  npm run library:profiles [-- --servers github,playwright,context7]
      Writes credential-free client profile templates for Claude Desktop, Cursor, and VS Code.

  npm run library:check-packages
      Checks public npm releases for pinned pack packages without changing pinned versions or installing anything.

State location defaults to ./local-library and can be changed with MCP_LIBRARY_HOME.
`);
}

function compact(candidate: LibraryCandidate): Record<string, unknown> {
  return {
    server: candidate.canonicalName,
    title: candidate.title,
    free: candidate.freeStatus,
    licence: candidate.licenseSpdx ?? "unverified",
    clone: candidate.cloneEligible ? "eligible" : "blocked",
    source: candidate.source,
    repository: candidate.repositoryUrl ?? "remote-only"
  };
}

async function fetchOfficialRegistryPage(input: { limit: number; cursor?: string; search?: string; updatedSince?: string }): Promise<OfficialRegistryPage> {
  const url = new URL("/v0.1/servers", OFFICIAL_REGISTRY_BASE_URL);
  url.searchParams.set("limit", String(input.limit));
  url.searchParams.set("version", "latest");
  if (input.cursor) url.searchParams.set("cursor", input.cursor);
  if (input.search) url.searchParams.set("search", input.search);
  if (input.updatedSince) {
    url.searchParams.set("updated_since", input.updatedSince);
    url.searchParams.set("include_deleted", "true");
  }
  const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "mcp-library-provider-sync/0.1" } });
  if (!response.ok) throw new Error(`Official Registry request failed (${response.status} ${response.statusText}).`);
  return parseOfficialRegistryPage(await response.json());
}

async function syncOfficialRegistry(args: ParsedArgs, checkOnly: boolean): Promise<void> {
  const root = getLibraryRoot();
  const limit = positiveNumber(args, "limit", 25, 100);
  const all = has(args, "all");
  const search = value(args, "search");
  const snapshot = checkOnly ? undefined : await ensureSnapshot(root, curatedFreeSeeds);
  const updatedSince = value(args, "updated-since") ?? (!all ? snapshot?.officialRegistryLastSync : undefined);
  let cursor: string | undefined;
  const fetched: LibraryCandidate[] = [];
  let pages = 0;
  do {
    const page = await fetchOfficialRegistryPage({ limit, ...(cursor ? { cursor } : {}), ...(search ? { search } : {}), ...(updatedSince ? { updatedSince } : {}) });
    const candidates = page.servers.map(candidateFromOfficialRegistry);
    fetched.push(...candidates);
    cursor = page.metadata?.nextCursor;
    pages += 1;
    if (!all) break;
  } while (cursor);

  let enriched = 0;
  if (has(args, "enrich-github")) {
    for (let index = 0; index < fetched.length; index += 1) {
      const candidate = fetched[index];
      if (!candidate?.repositoryUrl?.includes("github.com/")) continue;
      fetched[index] = await enrichFromGitHub(candidate);
      enriched += 1;
    }
  }

  if (checkOnly) {
    console.table(fetched.slice(0, 20).map(compact));
    console.log(`Read-only provider check: ${fetched.length} entries from ${pages} page(s); no local state, clone, install, or execution occurred.`);
    return;
  }
  const updated = await updateOfficialSnapshot(root, curatedFreeSeeds, fetched, cursor);
  console.table(fetched.slice(0, 20).map(compact));
  console.log(`Provider sync complete: ${fetched.length} registry entries from ${pages} page(s), ${enriched} GitHub enrichments, ${updated.candidates.length} catalog candidates total.`);
  console.log(`Persisted metadata only: ${root}`);
}

async function fetchGlamaApiPage(first: number, after?: string): Promise<ReturnType<typeof parseGlamaApiPage>> {
  const url = new URL("https://glama.ai/api/mcp/v1/servers");
  url.searchParams.set("first", String(first));
  if (after) url.searchParams.set("after", after);
  // Glama closed unauthenticated access to its documented MCP API on 2026-08-26.
  // A key is sent only from the process environment and is never logged or persisted.
  const apiKey = process.env.GLAMA_API_KEY;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "mcp-library-provider-sync/0.1",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    }
  });
  if (response.status === 401) {
    throw new Error(
      "Glama MCP API request failed (401 Unauthorized). Glama requires an API key for its documented MCP API since 2026-08-26. " +
      "Create a key at https://glama.ai/settings/api-keys, store it in a local secret manager, and export it as GLAMA_API_KEY (never pass it as a CLI argument). " +
      "The key value is never logged. API data use is governed by Glama's API Data License, which requires visible attribution and links to Glama listings when the data is displayed."
    );
  }
  if (!response.ok) throw new Error(`Glama MCP API request failed (${response.status} ${response.statusText}).`);
  return parseGlamaApiPage(await response.json());
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function syncGlama(args: ParsedArgs): Promise<void> {
  const directoryUrl = value(args, "directory-url");
  const checkOnly = has(args, "check");
  if (directoryUrl) {
    const response = await fetch(directoryUrl, { headers: { Accept: "text/html", "User-Agent": "mcp-library-provider-sync/0.1" } });
    if (!response.ok) throw new Error(`Glama public directory request failed (${response.status} ${response.statusText}).`);
    const entries = parseGlamaDirectoryHtml(await response.text());
    const candidates = entries.map(candidateFromGlama);
    if (checkOnly) {
      console.table(candidates.map(compact));
      console.log(`Read-only Glama directory check: ${candidates.length} publicly listed entries parsed; no key, clone, installation, or execution occurred.`);
      return;
    }
    const updated = await updateGlamaSnapshot(getLibraryRoot(), curatedFreeSeeds, candidates);
    console.table(candidates.map(compact));
    console.log(`Glama directory sync complete: ${candidates.length} entries ingested; ${updated.candidates.length} catalog candidates total.`);
    return;
  }

  const first = positiveNumber(args, "first", 100, 100);
  const all = has(args, "all");
  const maxPages = positiveNumber(args, "max-pages", all ? Number.MAX_SAFE_INTEGER : 1, 100000);
  const snapshot = checkOnly ? undefined : await ensureSnapshot(getLibraryRoot(), curatedFreeSeeds);
  let after = has(args, "resume") ? snapshot?.glamaApiCursor : undefined;
  const candidates: LibraryCandidate[] = [];
  let pages = 0;
  let hasNextPage = false;

  do {
    const page = await fetchGlamaApiPage(first, after);
    candidates.push(...page.servers.map(glamaApiServerToEntry).map(candidateFromGlama));
    pages += 1;
    after = page.pageInfo.endCursor;
    hasNextPage = page.pageInfo.hasNextPage && Boolean(after);
    if (all && hasNextPage && pages < maxPages) await sleep(125);
  } while (all && hasNextPage && pages < maxPages);

  if (checkOnly) {
    console.table(candidates.slice(0, 20).map(compact));
    console.log(`Read-only Glama API check: ${candidates.length} entries from ${pages} page(s); hasNextPage=${hasNextPage}. No key, clone, installation, or execution occurred.`);
    return;
  }
  const updated = await updateGlamaSnapshot(getLibraryRoot(), curatedFreeSeeds, candidates, after);
  console.table(candidates.slice(0, 20).map(compact));
  console.log(`Glama API sync complete: ${candidates.length} entries from ${pages} page(s); hasNextPage=${hasNextPage}; ${updated.candidates.length} catalog candidates total.`);
  if (hasNextPage && !all) console.log("More Glama pages are available. Use --all for a full traversal, or --resume --max-pages N for bounded continuation.");
}

async function importMcpMarketSitemaps(args: ParsedArgs): Promise<void> {
  const directory = required(args, "dir");
  if (!existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}. Download the public MCPMarket tools-N.xml sitemap files through an approved browser/export path first, then pass their directory with --dir.`);
  }
  const names = (await readdir(directory)).filter((name) => /^tools-\d+\.xml$/i.test(name)).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  if (!names.length) throw new Error(`No tools-N.xml files found in ${directory}. Download the public MCPMarket sitemap files through an approved browser/export path first.`);
  const entries = [];
  for (const name of names) {
    const xml = await readFile(join(directory, name), "utf8");
    entries.push(...parseMcpMarketToolsSitemap(xml));
  }
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const candidates = [...bySlug.values()].map(candidateFromMcpMarket);
  if (has(args, "check")) {
    console.table(candidates.slice(0, 20).map(compact));
    console.log(`Read-only MCPMarket sitemap import check: ${candidates.length} unique server URLs from ${names.length} sitemap file(s). No credential, page fetch, clone, installation, or execution occurred.`);
    return;
  }
  const updated = await updateMcpMarketSnapshot(getLibraryRoot(), curatedFreeSeeds, candidates, names.length);
  console.table(candidates.slice(0, 20).map(compact));
  console.log(`MCPMarket sitemap import complete: ${candidates.length} unique server URLs from ${names.length} sitemap file(s); ${updated.candidates.length} catalog candidates total.`);
}

function mcpMarketStatus(): void {
  const endpoint = process.env.MCPMARKET_API_BASE_URL || "https://app.mcpmarket.com/api/v1";
  console.log(`MCPMarket bearer-token API base is documented as ${endpoint}. API catalog synchronization remains disabled because the public docs retrieved so far do not define a catalog list/search/pagination endpoint contract. The public sitemap index is ${MCPMARKET_SITEMAP_INDEX_URL}; use providers:import-mcpmarket-sitemaps with browser/export-downloaded tools-N.xml files for compliant URL discovery. No request was sent and no credential was read. Automated homepage access is protected by a Vercel Security Checkpoint and will not be bypassed.`);
}

async function mcpMarketAuthCheck(): Promise<void> {
  const token = process.env.MCPMARKET_API_KEY;
  if (!token) throw new Error("MCPMARKET_API_KEY is not set in the process environment. Set it locally or in a secret manager; do not pass it as a CLI argument.");
  const base = (process.env.MCPMARKET_API_BASE_URL || "https://app.mcpmarket.com/api/v1").replace(/\/+$/, "");
  const response = await fetch(`${base}/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "User-Agent": "mcp-library-auth-check/0.1" }
  });
  if (!response.ok) throw new Error(`MCPMarket read-only authentication check failed (${response.status} ${response.statusText}). No credential value was logged.`);
  let payload: unknown;
  try { payload = await response.json(); } catch { payload = undefined; }
  const keys = payload && typeof payload === "object" && !Array.isArray(payload) ? Object.keys(payload as Record<string, unknown>).sort() : [];
  console.log(`MCPMarket read-only authentication check succeeded (HTTP ${response.status}). Response top-level fields: ${keys.length ? keys.join(", ") : "none"}. No token or response values were printed.`);
}

async function showCandidates(args: ParsedArgs, freeOnly: boolean): Promise<void> {
  const candidates = await listCandidates(getLibraryRoot(), curatedFreeSeeds, freeOnly);
  const query = value(args, "query")?.toLowerCase();
  const matching = query ? candidates.filter((candidate) => [candidate.canonicalName, candidate.title, candidate.description ?? "", ...candidate.tags].join(" ").toLowerCase().includes(query)) : candidates;
  const limit = positiveNumber(args, "limit", 50, 1000);
  console.table(matching.slice(0, limit).map(compact));
  console.log(`${matching.length} matching candidate(s); showing ${Math.min(matching.length, limit)}. 'verified-open-source' is cloneable; 'source-available-unverified' needs explicit licence review.`);
}

async function enrichCandidate(args: ParsedArgs): Promise<void> {
  const root = getLibraryRoot();
  const server = required(args, "server");
  const snapshot = await ensureSnapshot(root, curatedFreeSeeds);
  const candidate = snapshot.candidates.find((item) => item.canonicalName === server);
  if (!candidate) throw new Error(`Unknown server '${server}'. Run library:list first.`);
  const enriched = await enrichFromGitHub(candidate);
  await upsertCandidate(root, curatedFreeSeeds, enriched);
  console.table([compact(enriched)]);
  console.log("Provider metadata refreshed. No repository was cloned or executed.");
}

async function cloneLibraryCandidate(args: ParsedArgs): Promise<void> {
  const manifest = await cloneCandidate(getLibraryRoot(), curatedFreeSeeds, required(args, "server"), {
    confirmed: has(args, "yes"),
    allowSourceAvailable: has(args, "allow-source-available"),
    dryRun: has(args, "dry-run")
  });
  console.table([{ server: manifest.canonicalName, destination: manifest.destination, commit: manifest.clonedCommit, licence: manifest.licenseSpdx ?? "unverified" }]);
  console.log(has(args, "dry-run") ? "Dry run only: no repository was cloned." : "Clone complete. No dependencies were installed and no MCP server was run.");
}

async function refreshLibraryCandidates(args: ParsedArgs): Promise<void> {
  const root = getLibraryRoot();
  const requested = value(args, "server");
  const names = requested ? [requested] : (await listCloneManifests(root)).map((item) => item.canonicalName);
  if (!names.length) { console.log("No local clones yet. Use library:clone with a reviewed candidate."); return; }
  const results = [];
  for (const name of names) {
    const manifest = await refreshClone(root, name);
    results.push({ server: manifest.canonicalName, local: manifest.clonedCommit.slice(0, 12), provider: manifest.remoteCommit?.slice(0, 12) ?? "unknown", update: manifest.updateAvailable ? "available — review then apply" : "current" });
  }
  console.table(results);
  console.log("Refresh fetched provider metadata only. Checked-out provider code was not changed.");
}

async function applyLibraryCandidate(args: ParsedArgs): Promise<void> {
  const manifest = await applyCloneUpdate(getLibraryRoot(), required(args, "server"), has(args, "yes"));
  console.table([{ server: manifest.canonicalName, commit: manifest.clonedCommit.slice(0, 12), updated: manifest.lastAppliedAt ?? "not applied" }]);
  console.log("Fast-forward complete. Dependencies were not installed and the server was not executed.");
}

async function statusLibrary(): Promise<void> {
  const manifests = await listCloneManifests(getLibraryRoot());
  if (!manifests.length) { console.log("No local clone manifests found."); return; }
  console.table(manifests.map((item) => ({ server: item.canonicalName, commit: item.clonedCommit.slice(0, 12), update: item.updateAvailable === true ? "available" : item.updateAvailable === false ? "current" : "unknown", checked: item.lastCheckedAt ?? "never", path: item.destination })));
}

async function writeProfiles(args: ParsedArgs): Promise<void> {
  const selected = (value(args, "servers")?.split(",").map((item) => item.trim()).filter(Boolean) ?? ["github", "playwright", "context7"]) as ProfileServer[];
  const root = getLibraryRoot();
  const clients: LocalProfileClient[] = ["claude-desktop", "cursor", "vscode"];
  const writes = await Promise.all(clients.map(async (client) => {
    const profile = exportLocalProfile(client, selected);
    const directory = join(root, "profiles", client);
    await mkdir(directory, { recursive: true });
    const path = join(directory, profile.filename);
    await writeFile(path, `${profile.content}\n`, "utf8");
    return { client, file: path, servers: selected.join(", ") };
  }));
  console.table(writes);
  console.log("Client profile templates written. They contain no credential values and do not execute local source clones.");
}

function showPacks(): void {
  console.table(freePacks.map((pack) => ({ name: pack.name, title: pack.title, servers: pack.servers.join(", "), notes: pack.riskNotes.join(" ") })));
  console.log("Packs are configuration templates only. Review the displayed risk notes before copying one into an active MCP client.");
}

async function writePack(args: ParsedArgs): Promise<void> {
  const name = required(args, "name") as FreePackName;
  const root = getLibraryRoot();
  const clients: LocalProfileClient[] = ["claude-desktop", "cursor", "vscode"];
  const writes = await Promise.all(clients.map(async (client) => {
    const profile = exportFreePackProfile(client, name);
    const directory = join(root, "packs", name, client);
    await mkdir(directory, { recursive: true });
    const path = join(directory, profile.filename);
    await writeFile(path, `${profile.content}\n`, "utf8");
    return { pack: profile.pack.name, client, file: path, servers: profile.pack.servers.join(", ") };
  }));
  console.table(writes);
  console.log("Free-ready pack templates written. They are credential-free, pinned where a local npm package is used, and do not execute anything.");
}

async function checkPackPackages(): Promise<void> {
  const packageProfiles = availablePackageProfiles();
  const rows = [];
  for (const profile of packageProfiles) {
    if (!profile.packageName || !profile.pinnedVersion) continue;
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(profile.packageName)}/latest`, { headers: { Accept: "application/json", "User-Agent": "mcp-library-package-check/0.1" } });
    if (!response.ok) {
      rows.push({ server: profile.name, package: profile.packageName, pinned: profile.pinnedVersion, latest: `error ${response.status}`, status: "check failed" });
      continue;
    }
    const payload = await response.json() as { version?: unknown };
    const latest = typeof payload.version === "string" ? payload.version : "unknown";
    rows.push({ server: profile.name, package: profile.packageName, pinned: profile.pinnedVersion, latest, status: latest === profile.pinnedVersion ? "current" : "update available — review then regenerate pack" });
  }
  console.table(rows);
  console.log("Package check does not alter pinned profile versions or install any package.");
}

function runFixtures(): void {
  const fixture = `\n### 🛠️ Developer Tools\n- [example-org/github-mcp](https://github.com/example-org/github-mcp) 📇 ☁️ - Example GitHub workflow tools.\n- [example-org/browser-mcp](https://github.com/example-org/browser-mcp) 📇 🏠 - Example browser automation.\n\n### 🗄️ Databases\n- [example-org/postgres-mcp](https://github.com/example-org/postgres-mcp) 🐍 🏠 - Example database access.\n`;
  const records = normalizeAwesomeMarkdown(fixture, new Date("2026-07-28T00:00:00.000Z"));
  console.table(records.map((record) => ({ source: record.source, title: record.title, category: record.sourceCategory ?? "Unclassified", repository: record.repositoryUrl ?? "—" })));
  console.log(`Fixture normalized: ${records.length} source records. No data was persisted.`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const command = args.positional[0] ?? "help";
  if (command === "help" || command === "--help" || command === "-h") { printHelp(); return; }
  if (command === "dry-run") { console.log("mcp_library worker: dry-run only\nNo network request, credential access, database write, source scraping, clone, install, or execution was performed."); return; }
  if (command === "fixtures") { runFixtures(); return; }
  if (command === "providers:sync") { await syncOfficialRegistry(args, false); return; }
  if (command === "providers:check") { await syncOfficialRegistry(args, true); return; }
  if (command === "providers:sync-glama") { await syncGlama(args); return; }
  if (command === "providers:mcpmarket-status") { mcpMarketStatus(); return; }
  if (command === "providers:mcpmarket-auth-check") { await mcpMarketAuthCheck(); return; }
  if (command === "providers:import-mcpmarket-sitemaps") { await importMcpMarketSitemaps(args); return; }
  if (command === "library:list") { await showCandidates(args, false); return; }
  if (command === "library:free") { await showCandidates(args, true); return; }
  if (command === "library:enrich") { await enrichCandidate(args); return; }
  if (command === "library:clone") { await cloneLibraryCandidate(args); return; }
  if (command === "library:refresh") { await refreshLibraryCandidates(args); return; }
  if (command === "library:apply") { await applyLibraryCandidate(args); return; }
  if (command === "library:status") { await statusLibrary(); return; }
  if (command === "library:profiles") { await writeProfiles(args); return; }
  if (command === "library:packs") { showPacks(); return; }
  if (command === "library:pack") { await writePack(args); return; }
  if (command === "library:check-packages") { await checkPackPackages(); return; }
  throw new Error(`Unknown command '${command}'. Run npm run worker:help.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
