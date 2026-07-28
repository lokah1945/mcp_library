import { describe, expect, it } from "vitest";
import { normalizeOfficialRegistryPage, parseOfficialRegistryPage } from "../packages/source-adapters/src/official-registry";

const fixture = {
  servers: [{
    server: {
      name: "io.github.example/free-mcp",
      title: "Free MCP",
      description: "Example public server.",
      version: "1.2.3",
      repository: { url: "https://github.com/example/free-mcp", source: "github" },
      packages: [{ registryType: "npm", identifier: "free-mcp", transport: { type: "stdio" } }]
    },
    _meta: { "io.modelcontextprotocol.registry/official": { status: "active", updatedAt: "2026-07-28T00:00:00Z", isLatest: true } }
  }],
  metadata: { nextCursor: "next-page", count: 1 }
};

describe("Official Registry adapter", () => {
  it("preserves public registry facts and canonical repository provenance", () => {
    const page = parseOfficialRegistryPage(fixture);
    expect(page.metadata?.nextCursor).toBe("next-page");
    const records = normalizeOfficialRegistryPage(page, new Date("2026-07-28T00:00:00.000Z"));
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      source: "official-registry",
      externalId: "io.github.example/free-mcp@1.2.3",
      title: "Free MCP",
      repositoryUrl: "https://github.com/example/free-mcp"
    });
  });

  it("drops malformed envelope entries instead of inventing metadata", () => {
    expect(parseOfficialRegistryPage({ servers: [{ server: { name: 12, version: null } }] }).servers).toEqual([]);
  });
});
