import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface LocalLibraryCandidate {
  canonicalName: string;
  title: string;
  description?: string;
  source: "official-registry" | "provider-repository" | "glama" | "mcpmarket";
  sourceUrl: string;
  repositoryUrl?: string;
  version: string;
  freeStatus: "verified-open-source" | "source-available-unverified" | "free-tier" | "unknown";
  licenseSpdx?: string;
  officialStatus: string;
  lifecycle: string;
  cloneEligible: boolean;
  tags: string[];
  evidence: string[];
  updatedAt?: string;
}

export interface LocalLibrarySnapshot {
  generatedAt?: string;
  officialRegistryLastSync?: string;
  glamaLastSync?: string;
  glamaApiCursor?: string;
  /** Total records persisted locally; candidates is intentionally capped for the browser payload. */
  totalCandidates: number;
  sourceCounts: Record<string, number>;
  candidates: LocalLibraryCandidate[];
}

const fallbackCandidates: LocalLibraryCandidate[] = [
  { canonicalName: "github/github-mcp-server", title: "GitHub MCP Server", description: "GitHub's official MCP Server.", source: "provider-repository", sourceUrl: "https://github.com/github/github-mcp-server", repositoryUrl: "https://github.com/github/github-mcp-server.git", version: "provider-main", freeStatus: "verified-open-source", licenseSpdx: "MIT", officialStatus: "official", lifecycle: "active", cloneEligible: true, tags: ["developer-tools", "version-control"], evidence: ["https://api.github.com/repos/github/github-mcp-server"] },
  { canonicalName: "microsoft/playwright-mcp", title: "Playwright MCP", description: "Microsoft's browser automation MCP server.", source: "provider-repository", sourceUrl: "https://github.com/microsoft/playwright-mcp", repositoryUrl: "https://github.com/microsoft/playwright-mcp.git", version: "provider-main", freeStatus: "verified-open-source", licenseSpdx: "Apache-2.0", officialStatus: "official", lifecycle: "active", cloneEligible: true, tags: ["developer-tools", "browser-automation"], evidence: ["https://api.github.com/repos/microsoft/playwright-mcp"] },
  { canonicalName: "upstash/context7", title: "Context7", description: "Up-to-date code documentation platform with an MCP server.", source: "provider-repository", sourceUrl: "https://github.com/upstash/context7", repositoryUrl: "https://github.com/upstash/context7.git", version: "provider-main", freeStatus: "verified-open-source", licenseSpdx: "MIT", officialStatus: "official", lifecycle: "active", cloneEligible: true, tags: ["developer-tools", "documentation"], evidence: ["https://api.github.com/repos/upstash/context7"] }
];

function isCandidate(value: unknown): value is LocalLibraryCandidate {
  return Boolean(value && typeof value === "object" && typeof (value as { canonicalName?: unknown }).canonicalName === "string" && typeof (value as { title?: unknown }).title === "string");
}

export async function loadLocalLibrarySnapshot(): Promise<LocalLibrarySnapshot> {
  // INIT_CWD is set by npm to the directory that initiated a workspace command.
  // In production, set MCP_LIBRARY_HOME to an absolute persistent-volume path.
  const libraryRoot = process.env.MCP_LIBRARY_HOME || join(process.env.INIT_CWD || process.cwd(), "local-library");
  const path = join(libraryRoot, "registry", "catalog.json");
  if (!existsSync(path)) return { totalCandidates: fallbackCandidates.length, sourceCounts: { "provider-repository": fallbackCandidates.length }, candidates: fallbackCandidates };
  try {
    const value = JSON.parse(await readFile(path, "utf8")) as { generatedAt?: unknown; officialRegistryLastSync?: unknown; glamaLastSync?: unknown; glamaApiCursor?: unknown; candidates?: unknown };
    const allCandidates = Array.isArray(value.candidates) ? value.candidates.filter(isCandidate) : fallbackCandidates;
    const sourceCounts = allCandidates.reduce<Record<string, number>>((counts, candidate) => {
      counts[candidate.source] = (counts[candidate.source] ?? 0) + 1;
      return counts;
    }, {});
    // Do not serialize a 60k+ catalog into the browser. The worker/CLI owns full-catalog
    // operations; this view shows a curated, source-balanced discovery window.
    const candidates = [...allCandidates].sort((left, right) => {
      const rank = (candidate: LocalLibraryCandidate) => candidate.cloneEligible ? 0 : candidate.source === "provider-repository" ? 1 : candidate.source === "official-registry" ? 2 : 3;
      return rank(left) - rank(right) || left.title.localeCompare(right.title);
    }).slice(0, 300);
    return {
      ...(typeof value.generatedAt === "string" ? { generatedAt: value.generatedAt } : {}),
      ...(typeof value.officialRegistryLastSync === "string" ? { officialRegistryLastSync: value.officialRegistryLastSync } : {}),
      ...(typeof value.glamaLastSync === "string" ? { glamaLastSync: value.glamaLastSync } : {}),
      ...(typeof value.glamaApiCursor === "string" ? { glamaApiCursor: value.glamaApiCursor } : {}),
      totalCandidates: allCandidates.length,
      sourceCounts,
      candidates
    };
  } catch {
    return { totalCandidates: fallbackCandidates.length, sourceCounts: { "provider-repository": fallbackCandidates.length }, candidates: fallbackCandidates };
  }
}
