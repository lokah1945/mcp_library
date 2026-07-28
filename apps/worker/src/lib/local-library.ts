import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
import type { OfficialRegistryEnvelope } from "@mcp-library/source-adapters";

export type FreeStatus = "verified-open-source" | "source-available-unverified" | "free-tier" | "unknown";
export type CandidateSource = "official-registry" | "provider-repository" | "glama" | "mcpmarket";

export interface LibraryCandidate {
  canonicalName: string;
  title: string;
  description?: string;
  source: CandidateSource;
  sourceUrl: string;
  repositoryUrl?: string;
  version: string;
  freeStatus: FreeStatus;
  licenseSpdx?: string;
  officialStatus: "official" | "claimed" | "community" | "unknown";
  lifecycle: "active" | "deprecated" | "archived" | "needs-review";
  cloneEligible: boolean;
  tags: string[];
  evidence: string[];
  updatedAt?: string;
  packageIdentifiers?: string[];
  hasRequiredSecret?: boolean;
}

export interface RegistrySnapshot {
  schemaVersion: 1;
  generatedAt: string;
  officialRegistryLastSync?: string;
  officialRegistryCursor?: string;
  glamaLastSync?: string;
  glamaApiCursor?: string;
  mcpmarketLastSync?: string;
  mcpmarketSitemapFilesImported?: number;
  candidates: LibraryCandidate[];
}

export interface LocalCloneManifest {
  schemaVersion: 1;
  canonicalName: string;
  title: string;
  destination: string;
  repositoryUrl: string;
  sourceVersion: string;
  licenseSpdx?: string;
  clonedCommit: string;
  clonedAt: string;
  lastCheckedAt?: string;
  remoteCommit?: string;
  updateAvailable?: boolean;
  lastAppliedAt?: string;
}

interface GitResult {
  stdout: string;
  stderr: string;
}

const OPEN_SOURCE_LICENSES = new Set([
  "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "MPL-2.0",
  "GPL-2.0-only", "GPL-2.0-or-later", "GPL-3.0-only", "GPL-3.0-or-later",
  "LGPL-2.1-only", "LGPL-2.1-or-later", "LGPL-3.0-only", "LGPL-3.0-or-later",
  "AGPL-3.0-only", "AGPL-3.0-or-later", "Unlicense", "CC0-1.0"
]);
const ALLOWED_CLONE_HOSTS = new Set(["github.com", "gitlab.com", "codeberg.org"]);

export function getLibraryRoot(workspaceRoot = process.cwd()): string {
  return resolve(process.env.MCP_LIBRARY_HOME || join(workspaceRoot, "local-library"));
}

function registryPath(root: string): string {
  return join(root, "registry", "catalog.json");
}

function clonesPath(root: string): string {
  return join(root, "clones");
}

function manifestsPath(root: string): string {
  return join(root, "manifests");
}

function manifestPath(root: string, canonicalName: string): string {
  return join(manifestsPath(root), `${toSafeName(canonicalName)}.json`);
}

function clonePath(root: string, canonicalName: string): string {
  return join(clonesPath(root), toSafeName(canonicalName));
}

function toSafeName(value: string): string {
  const display = value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "server";
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 10);
  return `${display}-${hash}`;
}

function assertContained(root: string, target: string): void {
  const fromRoot = relative(resolve(root), resolve(target));
  if (fromRoot.startsWith("..") || fromRoot === "" || /^(?:\/|\\)/.test(fromRoot)) {
    throw new Error("Refusing a path outside the configured local library root.");
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(resolve(path, ".."), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temp, path);
}

async function readJson<T>(path: string): Promise<T | undefined> {
  if (!existsSync(path)) return undefined;
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function sourcePriority(source: CandidateSource): number {
  if (source === "provider-repository") return 4;
  if (source === "official-registry") return 3;
  if (source === "glama") return 2;
  return 1;
}

function mergeCandidate(existing: LibraryCandidate, incoming: LibraryCandidate): LibraryCandidate {
  const incomingWins = sourcePriority(incoming.source) >= sourcePriority(existing.source);
  const verified = existing.freeStatus === "verified-open-source" ? existing : incoming.freeStatus === "verified-open-source" ? incoming : undefined;
  const repositoryUrl = existing.repositoryUrl ?? incoming.repositoryUrl;
  const description = existing.description ?? incoming.description;
  const licenseSpdx = verified?.licenseSpdx ?? (incomingWins ? incoming.licenseSpdx : existing.licenseSpdx);
  const packageIdentifiers = [...new Set([...(existing.packageIdentifiers ?? []), ...(incoming.packageIdentifiers ?? [])])];
  return {
    ...existing,
    ...(incomingWins ? incoming : {}),
    freeStatus: verified?.freeStatus ?? (incomingWins ? incoming.freeStatus : existing.freeStatus),
    ...(licenseSpdx ? { licenseSpdx } : {}),
    cloneEligible: verified?.cloneEligible ?? (incomingWins ? incoming.cloneEligible : existing.cloneEligible),
    ...(repositoryUrl ? { repositoryUrl } : {}),
    ...(description ? { description } : {}),
    tags: [...new Set([...existing.tags, ...incoming.tags])].sort(),
    evidence: [...new Set([...existing.evidence, ...incoming.evidence])].sort(),
    ...(packageIdentifiers.length ? { packageIdentifiers } : {}),
    ...(existing.hasRequiredSecret || incoming.hasRequiredSecret ? { hasRequiredSecret: true } : {})
  };
}

export function mergeCandidates(candidates: LibraryCandidate[]): LibraryCandidate[] {
  const byName = new Map<string, LibraryCandidate>();
  for (const candidate of candidates) {
    const existing = byName.get(candidate.canonicalName);
    byName.set(candidate.canonicalName, existing ? mergeCandidate(existing, candidate) : candidate);
  }
  return [...byName.values()].sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));
}

export async function ensureSnapshot(root: string, seeds: LibraryCandidate[]): Promise<RegistrySnapshot> {
  const path = registryPath(root);
  const existing = await readJson<RegistrySnapshot>(path);
  if (existing?.schemaVersion === 1 && Array.isArray(existing.candidates)) return existing;
  const snapshot: RegistrySnapshot = { schemaVersion: 1, generatedAt: new Date().toISOString(), candidates: mergeCandidates(seeds) };
  await writeJson(path, snapshot);
  return snapshot;
}

export async function saveSnapshot(root: string, snapshot: RegistrySnapshot): Promise<void> {
  await writeJson(registryPath(root), snapshot);
}

export function candidateFromMcpMarket(entry: { slug: string; sourceUrl: string; lastModified?: string }): LibraryCandidate {
  return {
    canonicalName: `mcpmarket/${entry.slug}`,
    title: entry.slug,
    source: "mcpmarket",
    sourceUrl: entry.sourceUrl,
    version: "mcpmarket-sitemap",
    freeStatus: "unknown",
    officialStatus: "unknown",
    lifecycle: "active",
    cloneEligible: false,
    tags: ["mcpmarket", "sitemap"],
    evidence: [entry.sourceUrl],
    ...(entry.lastModified ? { updatedAt: entry.lastModified } : {})
  };
}

export function candidateFromGlama(entry: { externalId: string; title: string; description?: string; license?: string; author?: string; authorUrl?: string; sourceUrl: string; repositoryUrl?: string; operatingSystem?: string; attributes?: string[]; toolCount?: number; requiredEnvironmentVariables?: string[] }): LibraryCandidate {
  const licenseLookup: Record<string, string> = { "MIT License": "MIT", "MIT": "MIT", "Apache 2.0": "Apache-2.0", "Apache-2.0": "Apache-2.0", "BSD 3-Clause": "BSD-3-Clause" };
  const licenseSpdx = entry.license ? licenseLookup[entry.license] : undefined;
  const repositoryUrl = entry.repositoryUrl;
  return {
    canonicalName: `glama/${entry.externalId}`,
    title: entry.title,
    ...(entry.description ? { description: entry.description } : {}),
    source: "glama",
    sourceUrl: entry.sourceUrl,
    ...(repositoryUrl ? { repositoryUrl } : {}),
    version: "glama-directory",
    freeStatus: repositoryUrl ? "source-available-unverified" : "unknown",
    ...(licenseSpdx ? { licenseSpdx } : {}),
    officialStatus: "unknown",
    lifecycle: "active",
    cloneEligible: false,
    tags: ["glama", ...(entry.operatingSystem ? [entry.operatingSystem] : []), ...(entry.attributes ?? []), ...(entry.toolCount ? [`tools:${entry.toolCount}`] : [])],
    evidence: [entry.sourceUrl, ...(entry.authorUrl ? [entry.authorUrl] : [])],
    ...(entry.requiredEnvironmentVariables?.length ? { hasRequiredSecret: true } : {})
  };
}

export function candidateFromOfficialRegistry(envelope: OfficialRegistryEnvelope): LibraryCandidate {
  const official = envelope._meta?.["io.modelcontextprotocol.registry/official"];
  const publisher = envelope._meta?.["io.modelcontextprotocol.registry/publisher-provided"];
  const repositoryUrl = envelope.server.repository?.url;
  const packageIdentifiers = envelope.server.packages?.flatMap((item) => item.identifier ? [item.identifier] : []) ?? [];
  const tags = publisher?.tags ?? [];
  const requiredSecret = Boolean(envelope.server.packages?.some((item) => item.environmentVariables?.some((variable) => Boolean(variable.isSecret && variable.isRequired))));
  const status = official?.status === "deprecated" ? "deprecated" : official?.status === "deleted" ? "archived" : "active";

  return {
    canonicalName: envelope.server.name,
    title: envelope.server.title ?? publisher?.title ?? envelope.server.name,
    ...(envelope.server.description ? { description: envelope.server.description } : {}),
    source: "official-registry",
    sourceUrl: `https://registry.modelcontextprotocol.io/v0.1/servers/${encodeURIComponent(envelope.server.name)}/versions/${encodeURIComponent(envelope.server.version)}`,
    ...(repositoryUrl ? { repositoryUrl } : {}),
    version: envelope.server.version,
    freeStatus: repositoryUrl ? "source-available-unverified" : "unknown",
    officialStatus: "official",
    lifecycle: status,
    cloneEligible: false,
    tags,
    evidence: ["https://registry.modelcontextprotocol.io"],
    ...(official?.updatedAt ? { updatedAt: official.updatedAt } : {}),
    ...(packageIdentifiers.length ? { packageIdentifiers } : {}),
    ...(requiredSecret ? { hasRequiredSecret: true } : {})
  };
}

function cloneHost(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Repository URL is invalid.");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || !ALLOWED_CLONE_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("Only credential-free HTTPS repositories from approved public Git hosts are cloneable.");
  }
  const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "").split("/");
  if (parts.length < 2 || !parts[0] || !parts[1]) throw new Error("Repository URL must include owner and repository.");
  return parsed;
}

export function canonicalCloneUrl(repositoryUrl: string): string {
  const parsed = cloneHost(repositoryUrl);
  const clean = parsed.pathname.replace(/\/+$/g, "").replace(/\.git$/i, "");
  return `https://${parsed.hostname}${clean}.git`;
}

function githubCoordinates(repositoryUrl: string): { owner: string; repository: string } | undefined {
  const parsed = cloneHost(repositoryUrl);
  if (parsed.hostname.toLowerCase() !== "github.com") return undefined;
  const [owner, repository] = parsed.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "").split("/");
  return owner && repository ? { owner, repository } : undefined;
}

async function runGit(args: string[], cwd?: string): Promise<GitResult> {
  return new Promise((resolveResult, rejectResult) => {
    const child = spawn("git", args, {
      ...(cwd ? { cwd } : {}),
      shell: false,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_CONFIG_NOSYSTEM: "1", GIT_OPTIONAL_LOCKS: "0" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", rejectResult);
    child.on("close", (code) => {
      if (code === 0) resolveResult({ stdout: stdout.trim(), stderr: stderr.trim() });
      else rejectResult(new Error(`git ${args[0] ?? "command"} failed (${code ?? "unknown"}): ${stderr.trim() || stdout.trim()}`));
    });
  });
}

export async function enrichFromGitHub(candidate: LibraryCandidate): Promise<LibraryCandidate> {
  if (!candidate.repositoryUrl) throw new Error("This candidate has no repository URL to enrich.");
  const coordinates = githubCoordinates(candidate.repositoryUrl);
  if (!coordinates) throw new Error("GitHub enrichment is currently available for GitHub repositories only.");
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(coordinates.owner)}/${encodeURIComponent(coordinates.repository)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "mcp-library-provider-sync/0.1",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) throw new Error(`GitHub metadata request failed (${response.status}). Use a newly issued minimum-scope token only if public API quota is exhausted.`);
  const payload = await response.json() as {
    clone_url?: string; html_url?: string; archived?: boolean; disabled?: boolean; license?: { spdx_id?: string | null }; pushed_at?: string | null; updated_at?: string | null;
  };
  const licenseSpdx = payload.license?.spdx_id ?? undefined;
  const updateTime = payload.pushed_at ?? payload.updated_at ?? undefined;
  const verifiedOpenSource = Boolean(licenseSpdx && OPEN_SOURCE_LICENSES.has(licenseSpdx) && !payload.archived && !payload.disabled);
  return {
    ...candidate,
    ...(payload.clone_url ? { repositoryUrl: payload.clone_url } : {}),
    ...(licenseSpdx ? { licenseSpdx } : {}),
    freeStatus: verifiedOpenSource ? "verified-open-source" : candidate.repositoryUrl ? "source-available-unverified" : candidate.freeStatus,
    cloneEligible: verifiedOpenSource,
    lifecycle: payload.archived || payload.disabled ? "archived" : candidate.lifecycle,
    ...(updateTime ? { updatedAt: updateTime } : {}),
    evidence: [...new Set([...candidate.evidence, payload.html_url ? `https://api.github.com/repos/${coordinates.owner}/${coordinates.repository}` : candidate.sourceUrl])]
  };
}

export async function listCandidates(root: string, seeds: LibraryCandidate[], freeOnly = false): Promise<LibraryCandidate[]> {
  const snapshot = await ensureSnapshot(root, seeds);
  return snapshot.candidates.filter((candidate) => !freeOnly || candidate.freeStatus === "verified-open-source" || candidate.freeStatus === "source-available-unverified");
}

export async function upsertCandidate(root: string, seeds: LibraryCandidate[], candidate: LibraryCandidate): Promise<RegistrySnapshot> {
  const snapshot = await ensureSnapshot(root, seeds);
  const updated: RegistrySnapshot = {
    ...snapshot,
    generatedAt: new Date().toISOString(),
    candidates: mergeCandidates([...snapshot.candidates, candidate])
  };
  await saveSnapshot(root, updated);
  return updated;
}

export async function updateOfficialSnapshot(root: string, seeds: LibraryCandidate[], candidates: LibraryCandidate[], cursor?: string): Promise<RegistrySnapshot> {
  const snapshot = await ensureSnapshot(root, seeds);
  const updated: RegistrySnapshot = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    officialRegistryLastSync: new Date().toISOString(),
    ...(cursor ? { officialRegistryCursor: cursor } : {}),
    candidates: mergeCandidates([...snapshot.candidates, ...candidates])
  };
  await saveSnapshot(root, updated);
  return updated;
}

export async function updateGlamaSnapshot(root: string, seeds: LibraryCandidate[], candidates: LibraryCandidate[], cursor?: string): Promise<RegistrySnapshot> {
  const snapshot = await ensureSnapshot(root, seeds);
  const updated: RegistrySnapshot = {
    ...snapshot,
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    glamaLastSync: new Date().toISOString(),
    ...(cursor ? { glamaApiCursor: cursor } : {}),
    candidates: mergeCandidates([...snapshot.candidates, ...candidates])
  };
  await saveSnapshot(root, updated);
  return updated;
}

export async function updateMcpMarketSnapshot(root: string, seeds: LibraryCandidate[], candidates: LibraryCandidate[], sitemapFilesImported: number): Promise<RegistrySnapshot> {
  const snapshot = await ensureSnapshot(root, seeds);
  const updated: RegistrySnapshot = {
    ...snapshot,
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mcpmarketLastSync: new Date().toISOString(),
    mcpmarketSitemapFilesImported: sitemapFilesImported,
    candidates: mergeCandidates([...snapshot.candidates, ...candidates])
  };
  await saveSnapshot(root, updated);
  return updated;
}

function requireCandidate(snapshot: RegistrySnapshot, canonicalName: string): LibraryCandidate {
  const candidate = snapshot.candidates.find((item) => item.canonicalName === canonicalName);
  if (!candidate) throw new Error(`Unknown server '${canonicalName}'. Run providers:sync first or use library:list.`);
  return candidate;
}

export async function cloneCandidate(root: string, seeds: LibraryCandidate[], canonicalName: string, options: { confirmed: boolean; allowSourceAvailable: boolean; dryRun: boolean }): Promise<LocalCloneManifest> {
  if (!options.confirmed) throw new Error("Cloning requires --yes. Cloning downloads source code but never installs dependencies or runs the MCP server.");
  const snapshot = await ensureSnapshot(root, seeds);
  const candidate = requireCandidate(snapshot, canonicalName);
  if (!candidate.repositoryUrl) throw new Error("This server is remote-only or has no provider repository; it cannot be cloned.");
  if (!candidate.cloneEligible && !(candidate.freeStatus === "source-available-unverified" && options.allowSourceAvailable)) {
    throw new Error("Clone blocked: only verified open-source candidates are eligible. Re-run enrichment or pass --allow-source-available with --yes after reviewing the provider licence.");
  }
  if (candidate.lifecycle !== "active") throw new Error(`Clone blocked: lifecycle is ${candidate.lifecycle}.`);

  const destination = clonePath(root, candidate.canonicalName);
  assertContained(root, destination);
  const repositoryUrl = canonicalCloneUrl(candidate.repositoryUrl);
  if (existsSync(destination)) throw new Error(`Clone destination already exists: ${destination}. Use library:refresh to check provider updates.`);

  const manifest: LocalCloneManifest = {
    schemaVersion: 1,
    canonicalName: candidate.canonicalName,
    title: candidate.title,
    destination,
    repositoryUrl,
    sourceVersion: candidate.version,
    ...(candidate.licenseSpdx ? { licenseSpdx: candidate.licenseSpdx } : {}),
    clonedCommit: "DRY_RUN",
    clonedAt: new Date().toISOString()
  };
  if (options.dryRun) return manifest;

  await mkdir(clonesPath(root), { recursive: true });
  try {
    await runGit(["-c", "core.hooksPath=/dev/null", "clone", "--depth", "1", "--no-tags", "--filter=blob:none", "--no-recurse-submodules", repositoryUrl, destination]);
    const revision = await runGit(["rev-parse", "HEAD"], destination);
    manifest.clonedCommit = revision.stdout;
    await writeJson(manifestPath(root, candidate.canonicalName), manifest);
    return manifest;
  } catch (error) {
    await rm(destination, { recursive: true, force: true });
    throw error;
  }
}

async function loadManifest(root: string, canonicalName: string): Promise<LocalCloneManifest> {
  const manifest = await readJson<LocalCloneManifest>(manifestPath(root, canonicalName));
  if (!manifest || manifest.schemaVersion !== 1) throw new Error(`No local clone manifest exists for '${canonicalName}'.`);
  assertContained(root, manifest.destination);
  if (!existsSync(join(manifest.destination, ".git"))) throw new Error(`Local clone is missing or invalid: ${manifest.destination}`);
  return manifest;
}

export async function refreshClone(root: string, canonicalName: string): Promise<LocalCloneManifest> {
  const manifest = await loadManifest(root, canonicalName);
  await runGit(["fetch", "--no-tags", "--prune", "origin", "HEAD"], manifest.destination);
  const current = await runGit(["rev-parse", "HEAD"], manifest.destination);
  const remote = await runGit(["rev-parse", "FETCH_HEAD"], manifest.destination);
  const updated: LocalCloneManifest = {
    ...manifest,
    clonedCommit: current.stdout,
    remoteCommit: remote.stdout,
    updateAvailable: current.stdout !== remote.stdout,
    lastCheckedAt: new Date().toISOString()
  };
  await writeJson(manifestPath(root, canonicalName), updated);
  return updated;
}

export async function applyCloneUpdate(root: string, canonicalName: string, confirmed: boolean): Promise<LocalCloneManifest> {
  if (!confirmed) throw new Error("Applying provider code changes requires --yes. Run library:refresh first and review the diff before applying.");
  const manifest = await refreshClone(root, canonicalName);
  if (!manifest.updateAvailable) return manifest;
  await runGit(["merge", "--ff-only", "FETCH_HEAD"], manifest.destination);
  const current = await runGit(["rev-parse", "HEAD"], manifest.destination);
  const updated: LocalCloneManifest = { ...manifest, clonedCommit: current.stdout, remoteCommit: current.stdout, updateAvailable: false, lastAppliedAt: new Date().toISOString() };
  await writeJson(manifestPath(root, canonicalName), updated);
  return updated;
}

export async function listCloneManifests(root: string): Promise<LocalCloneManifest[]> {
  if (!existsSync(manifestsPath(root))) return [];
  const { readdir } = await import("node:fs/promises");
  const files = await readdir(manifestsPath(root));
  const manifests = await Promise.all(files.filter((file) => file.endsWith(".json")).map(async (file) => readJson<LocalCloneManifest>(join(manifestsPath(root), basename(file)))));
  return manifests.filter((manifest): manifest is LocalCloneManifest => Boolean(manifest)).sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));
}
