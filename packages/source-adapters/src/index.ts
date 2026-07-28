import type { SourceRecord } from "@mcp-library/catalog-schema";

export type AdapterName = "official-registry" | "glama" | "awesome-mcp-servers" | "mcpmarket";

export interface SourceAdapter {
  readonly name: AdapterName;
  /**
   * Returns records from an approved public API, export, fixture, or manually supplied
   * payload. Network fetching is intentionally outside the normalizer so rate limits,
   * ToS, and credentials are handled explicitly by the worker.
   */
  normalize(input: string, observedAt?: Date): SourceRecord[];
}

export interface AdapterRunReport {
  adapter: AdapterName;
  mode: "dry-run" | "fixture" | "live";
  observedAt: string;
  imported: number;
  needsReview: number;
  warnings: string[];
}

export { normalizeAwesomeMarkdown, awesomeMcpServersAdapter } from "./awesome";
export { OFFICIAL_REGISTRY_BASE_URL, officialRegistryAdapter, normalizeOfficialRegistryPage, parseOfficialRegistryPage } from "./official-registry";
export type { OfficialRegistryEnvelope, OfficialRegistryPage, OfficialRegistryPackage, OfficialRegistryServer } from "./official-registry";

export { DEFAULT_GLAMA_DEVELOPER_TOOLS_URL, normalizeGlamaDirectoryHtml, parseGlamaDirectoryHtml } from "./glama";
export type { GlamaDirectoryEntry } from "./glama";
export { glamaApiServerToEntry, normalizeGlamaApiPage, parseGlamaApiPage } from "./glama";
export type { GlamaApiPage, GlamaApiServer } from "./glama";
export { MCPMARKET_SITEMAP_INDEX_URL, normalizeMcpMarketToolsSitemap, parseMcpMarketSitemapIndex, parseMcpMarketToolsSitemap } from "./mcpmarket";
export type { McpMarketSitemapEntry } from "./mcpmarket";
