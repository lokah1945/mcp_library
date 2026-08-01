import { describe, expect, it } from "vitest";
import { candidateToCatalogServer, type LocalLibraryCandidate } from "../apps/web/lib/local-library";
import { categories } from "../apps/web/lib/catalog";

describe("Web Catalog Data Bridge (Enterprise Grade Integration)", () => {
  it("successfully maps a verified open-source LocalLibraryCandidate to CatalogServer shape", () => {
    const candidate: LocalLibraryCandidate = {
      canonicalName: "test-owner/test-mcp-server",
      title: "Test MCP Server",
      description: "An outstanding test server for browser and database tasks.",
      source: "official-registry",
      sourceUrl: "https://registry.modelcontextprotocol.io/v0.1/servers/test-mcp-server/versions/1.0.0",
      repositoryUrl: "https://github.com/test-owner/test-mcp-server.git",
      version: "1.0.0",
      freeStatus: "verified-open-source",
      licenseSpdx: "MIT",
      officialStatus: "official",
      lifecycle: "active",
      cloneEligible: true,
      tags: ["browser", "postgres", "test"],
      evidence: ["https://api.github.com/repos/test-owner/test-mcp-server"]
    };

    const server = candidateToCatalogServer(candidate);

    expect(server.slug).toBe("test-owner-test-mcp-server");
    expect(server.name).toBe("Test MCP Server");
    expect(server.summary.en).toBe("An outstanding test server for browser and database tasks.");
    expect(server.summary.id).toBe("An outstanding test server for browser and database tasks.");
    expect(server.publisher).toBe("TEST-OWNER");
    expect(server.officialStatus).toBe("Official");
    expect(server.verification).toBe("Verified");
    expect(server.lifecycle).toBe("Active");
    expect(server.risk).toBe("Low");
    expect(server.license).toBe("MIT");

    // Categories matched dynamically from description and tags
    expect(server.categories).toContain("browser-automation");
    expect(server.categories).toContain("databases-data-platforms");
    expect(server.categories).toContain("testing-qa");

    // Setup command is populated dynamically
    expect(server.setup).toEqual({
      packageName: "test-owner/test-mcp-server",
      command: "npx",
      args: ["-y", "test-owner/test-mcp-server"]
    });
  });

  it("handles missing description and empty tags gracefully", () => {
    const candidate: LocalLibraryCandidate = {
      canonicalName: "minimal-mcp",
      title: "Minimal MCP",
      source: "glama",
      sourceUrl: "https://glama.ai/mcp/servers/minimal-mcp",
      version: "glama-directory",
      freeStatus: "unknown",
      officialStatus: "unknown",
      lifecycle: "active",
      cloneEligible: false,
      tags: [],
      evidence: []
    };

    const server = candidateToCatalogServer(candidate);

    expect(server.slug).toBe("minimal-mcp");
    expect(server.name).toBe("Minimal MCP");
    expect(server.summary.en).toBe("Minimal MCP MCP Server.");
    expect(server.summary.id).toBe("Server MCP Minimal MCP.");
    expect(server.categories).toContain("developer-tools");
    expect(server.tags).toEqual(["mcp"]);
  });
});
