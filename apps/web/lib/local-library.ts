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

import { catalogServers, type CatalogServer, type CategorySlug, type LocalizedText, type RiskLevel, type VerificationState } from "./catalog";

export function candidateToCatalogServer(candidate: LocalLibraryCandidate): CatalogServer {
  const slug = candidate.canonicalName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const summary: LocalizedText = {
    en: candidate.description || `${candidate.title} MCP Server.`,
    id: candidate.description || `Server MCP ${candidate.title}.`
  };

  const sourceName = candidate.source === "official-registry"
    ? "Official Registry"
    : candidate.source === "glama"
      ? "Glama Directory"
      : candidate.source === "mcpmarket"
        ? "MCPMarket"
        : "Provider Repository";

  const verification: VerificationState = candidate.freeStatus === "verified-open-source"
    ? "Verified"
    : candidate.freeStatus === "source-available-unverified"
      ? "Needs review"
      : "Imported";

  const risk: RiskLevel = candidate.freeStatus === "verified-open-source" ? "Low" : "Moderate";

  const publisher = candidate.canonicalName.includes("/")
    ? candidate.canonicalName.split("/")[0]!
    : candidate.source === "official-registry"
      ? "Official"
      : "Community";

  const matchedCategories: CategorySlug[] = [];
  const lowercaseTags = (candidate.tags || []).map(t => t.toLowerCase());
  const lowercaseDesc = (candidate.description || "").toLowerCase();

  if (lowercaseTags.some(t => t.includes("git") || t.includes("github") || t.includes("version") || t.includes("pr") || t.includes("issue")) || lowercaseDesc.includes("github") || lowercaseDesc.includes("git ")) {
    matchedCategories.push("version-control");
  }
  if (lowercaseTags.some(t => t.includes("browser") || t.includes("playwright") || t.includes("puppeteer") || t.includes("web") || t.includes("selenium")) || lowercaseDesc.includes("browser") || lowercaseDesc.includes("playwright")) {
    matchedCategories.push("browser-automation");
  }
  if (lowercaseTags.some(t => t.includes("db") || t.includes("database") || t.includes("sql") || t.includes("postgres") || t.includes("mysql") || t.includes("redis") || t.includes("sqlite")) || lowercaseDesc.includes("database") || lowercaseDesc.includes("postgres") || lowercaseDesc.includes("sql")) {
    matchedCategories.push("databases-data-platforms");
  }
  if (lowercaseTags.some(t => t.includes("cloud") || t.includes("devops") || t.includes("docker") || t.includes("aws") || t.includes("kubernetes") || t.includes("deploy")) || lowercaseDesc.includes("cloud") || lowercaseDesc.includes("devops") || lowercaseDesc.includes("docker")) {
    matchedCategories.push("cloud-devops");
  }
  if (lowercaseTags.some(t => t.includes("test") || t.includes("qa") || t.includes("jest") || t.includes("playwright") || t.includes("cypress")) || lowercaseDesc.includes("testing") || lowercaseDesc.includes(" qa ")) {
    matchedCategories.push("testing-qa");
  }
  if (lowercaseTags.some(t => t.includes("observe") || t.includes("monitor") || t.includes("sentry") || t.includes("log") || t.includes("trace") || t.includes("telemetry")) || lowercaseDesc.includes("monitor") || lowercaseDesc.includes("sentry")) {
    matchedCategories.push("observability-monitoring");
  }
  if (lowercaseTags.some(t => t.includes("security") || t.includes("identity") || t.includes("auth") || t.includes("crypt") || t.includes("secret")) || lowercaseDesc.includes("security") || lowercaseDesc.includes("auth")) {
    matchedCategories.push("security-identity-cryptography");
  }

  if (matchedCategories.length === 0) {
    matchedCategories.push("developer-tools");
  }

  const officialStatus = candidate.officialStatus === "official"
    ? "Official"
    : candidate.officialStatus === "claimed"
      ? "Claimed"
      : "Community";

  const lifecycle = candidate.lifecycle === "active"
    ? "Active"
    : candidate.lifecycle === "deprecated"
      ? "Deprecated"
      : "Needs review";

  const permissionTags: LocalizedText[] = [];
  if (matchedCategories.includes("browser-automation")) {
    permissionTags.push({ en: "Browser control", id: "Kontrol browser" });
    permissionTags.push({ en: "Network egress through visited pages", id: "Akses jaringan melalui halaman yang dikunjungi" });
  }
  if (matchedCategories.includes("databases-data-platforms")) {
    permissionTags.push({ en: "Sensitive data access", id: "Akses data sensitif" });
    permissionTags.push({ en: "Potential write or destructive SQL if role permits it", id: "Potensi SQL tulis atau destruktif bila role mengizinkannya" });
  }
  if (matchedCategories.includes("version-control")) {
    permissionTags.push({ en: "Can read repository data", id: "Dapat membaca data repositori" });
    permissionTags.push({ en: "May create or modify issues and PRs when granted write scopes", id: "Dapat membuat atau mengubah issue dan PR bila diberi scope tulis" });
  }
  if (permissionTags.length === 0) {
    permissionTags.push({ en: "No high-risk permission tags identified", id: "Tidak ada tag izin berisiko tinggi yang teridentifikasi" });
  }

  return {
    slug,
    name: candidate.title,
    summary,
    description: summary,
    categories: matchedCategories,
    tags: candidate.tags.length ? candidate.tags : ["mcp"],
    publisher: publisher.toUpperCase(),
    officialStatus,
    verification,
    lifecycle,
    execution: "Local",
    transports: ["stdio"],
    implementation: candidate.tags.includes("python") ? "Python" : "TypeScript",
    license: candidate.licenseSpdx || "Verify with provider",
    auth: { en: "Verify credential needs with provider", id: "Verifikasi kebutuhan kredensial dengan provider" },
    credentialVariables: [],
    risk,
    permissionTags,
    compatibility: ["Claude Desktop", "Cursor", "VS Code clients"],
    repositoryUrl: candidate.repositoryUrl || candidate.sourceUrl,
    documentationUrl: candidate.repositoryUrl || candidate.sourceUrl,
    sourceName,
    sourceUrl: candidate.sourceUrl,
    observedAt: candidate.updatedAt || new Date().toISOString(),
    setup: {
      packageName: candidate.canonicalName,
      command: "npx",
      args: ["-y", candidate.canonicalName]
    },
    useCases: [
      { en: `Automate tasks using ${candidate.title}`, id: `Otomatisasi tugas menggunakan ${candidate.title}` }
    ],
    alternatives: []
  };
}

export async function getCombinedServers(): Promise<CatalogServer[]> {
  try {
    const snapshot = await loadLocalLibrarySnapshot();
    const mapped = (snapshot.candidates || []).map(candidateToCatalogServer);
    
    const combined = [...catalogServers];
    const existingSlugs = new Set(combined.map(s => s.slug));
    
    for (const server of mapped) {
      if (!existingSlugs.has(server.slug)) {
        combined.push(server);
        existingSlugs.add(server.slug);
      }
    }
    return combined;
  } catch (error) {
    console.error("Failed to load combined servers:", error);
    return catalogServers;
  }
}

export async function findServerDynamic(slug: string): Promise<CatalogServer | undefined> {
  const combined = await getCombinedServers();
  return combined.find((server) => server.slug === slug);
}

export async function findServersDynamic(slugs: string[]): Promise<CatalogServer[]> {
  const combined = await getCombinedServers();
  return slugs.map(slug => combined.find(s => s.slug === slug)).filter((server): server is CatalogServer => Boolean(server));
}
