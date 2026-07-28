import { describe, expect, it } from "vitest";
import { normalizeGlamaDirectoryHtml, parseGlamaDirectoryHtml } from "../packages/source-adapters/src/glama";

const fixture = `<!doctype html><script type="application/ld+json">{
  "@context":"https://schema.org",
  "@graph":[{
    "@type":"SearchResultsPage",
    "mainEntity":{"@type":"ItemList","itemListElement":[{
      "@type":"ListItem",
      "position":1,
      "item":{"@type":"SoftwareApplication","name":"Example MCP","description":"A public example.","license":"MIT","operatingSystem":"Cross-platform","url":"https://glama.ai/mcp/servers/example/example-mcp","author":{"@type":"Organization","name":"example","sameAs":"https://github.com/example"}}
    }]}
  }]
}</script>`;

describe("Glama public directory adapter", () => {
  it("extracts publicly embedded JSON-LD without an API key", () => {
    const entries = parseGlamaDirectoryHtml(fixture);
    expect(entries).toEqual([expect.objectContaining({ externalId: "example/example-mcp", title: "Example MCP", license: "MIT", author: "example" })]);
  });

  it("creates provenance-backed source records", () => {
    const records = normalizeGlamaDirectoryHtml(fixture, new Date("2026-07-28T00:00:00.000Z"), "Developer Tools");
    expect(records[0]).toMatchObject({ source: "glama", externalId: "example/example-mcp", sourceCategory: "Developer Tools" });
  });
});

const apiFixture = {
  pageInfo: { startCursor: "start", endCursor: "next", hasNextPage: true },
  servers: [{
    id: "abc123",
    name: "API Example MCP",
    namespace: "example-org",
    slug: "api-mcp",
    url: "https://glama.ai/mcp/servers/abc123",
    attributes: ["author:official", "hosting:local-only"],
    description: "An API-backed example.",
    repository: { url: "https://github.com/example-org/api-mcp" },
    spdxLicense: { name: "MIT License", url: "https://spdx.org/licenses/MIT.json" },
    environmentVariablesJsonSchema: { type: "object", properties: { EXAMPLE_KEY: {} }, required: ["EXAMPLE_KEY"] },
    tools: [{ name: "example" }]
  }]
};

describe("Glama public API adapter", () => {
  it("parses page cursors and repository/license metadata", async () => {
    const { parseGlamaApiPage, glamaApiServerToEntry, normalizeGlamaApiPage } = await import("../packages/source-adapters/src/glama");
    const page = parseGlamaApiPage(apiFixture);
    expect(page.pageInfo).toMatchObject({ hasNextPage: true, endCursor: "next" });
    const entry = glamaApiServerToEntry(page.servers[0]!);
    expect(entry).toMatchObject({ externalId: "example-org/api-mcp", repositoryUrl: "https://github.com/example-org/api-mcp", license: "MIT License", toolCount: 1, requiredEnvironmentVariables: ["EXAMPLE_KEY"] });
    expect(normalizeGlamaApiPage(apiFixture)).toHaveLength(1);
  });
});
