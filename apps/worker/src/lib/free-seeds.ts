import type { LibraryCandidate } from "./local-library";

/**
 * Curated source-code candidates verified from their public provider repositories on
 * 2026-07-28. These are seeds, not an assertion that every connected cloud service is
 * free of charge. Clone eligibility is based on the source licence only.
 */
export const curatedFreeSeeds: LibraryCandidate[] = [
  {
    canonicalName: "github/github-mcp-server",
    title: "GitHub MCP Server",
    description: "GitHub's official MCP Server.",
    source: "provider-repository",
    sourceUrl: "https://github.com/github/github-mcp-server",
    repositoryUrl: "https://github.com/github/github-mcp-server.git",
    version: "provider-main",
    freeStatus: "verified-open-source",
    licenseSpdx: "MIT",
    officialStatus: "official",
    lifecycle: "active",
    cloneEligible: true,
    tags: ["developer-tools", "version-control", "github"],
    evidence: ["https://api.github.com/repos/github/github-mcp-server"],
    updatedAt: "2026-07-27T20:31:51.000Z"
  },
  {
    canonicalName: "microsoft/playwright-mcp",
    title: "Playwright MCP",
    description: "Playwright MCP server for browser automation.",
    source: "provider-repository",
    sourceUrl: "https://github.com/microsoft/playwright-mcp",
    repositoryUrl: "https://github.com/microsoft/playwright-mcp.git",
    version: "provider-main",
    freeStatus: "verified-open-source",
    licenseSpdx: "Apache-2.0",
    officialStatus: "official",
    lifecycle: "active",
    cloneEligible: true,
    tags: ["developer-tools", "browser-automation", "testing"],
    evidence: ["https://api.github.com/repos/microsoft/playwright-mcp"],
    updatedAt: "2026-07-25T08:58:14.000Z"
  },
  {
    canonicalName: "upstash/context7",
    title: "Context7",
    description: "Up-to-date code documentation platform with an MCP server.",
    source: "provider-repository",
    sourceUrl: "https://github.com/upstash/context7",
    repositoryUrl: "https://github.com/upstash/context7.git",
    version: "provider-main",
    freeStatus: "verified-open-source",
    licenseSpdx: "MIT",
    officialStatus: "official",
    lifecycle: "active",
    cloneEligible: true,
    tags: ["developer-tools", "documentation", "search"],
    evidence: ["https://api.github.com/repos/upstash/context7"],
    updatedAt: "2026-07-25T03:38:35.000Z"
  },
  {
    canonicalName: "modelcontextprotocol/servers",
    title: "MCP Servers reference collection",
    description: "Public reference collection with repository-level licence requiring individual review.",
    source: "provider-repository",
    sourceUrl: "https://github.com/modelcontextprotocol/servers",
    repositoryUrl: "https://github.com/modelcontextprotocol/servers.git",
    version: "provider-main",
    freeStatus: "source-available-unverified",
    licenseSpdx: "NOASSERTION",
    officialStatus: "official",
    lifecycle: "active",
    cloneEligible: false,
    tags: ["reference", "developer-tools"],
    evidence: ["https://api.github.com/repos/modelcontextprotocol/servers"],
    updatedAt: "2026-07-26T03:16:32.000Z"
  }
];
