import { createHash } from "node:crypto";
import { sourceRecordSchema, type SourceRecord } from "@mcp-library/catalog-schema";

export const DEFAULT_GLAMA_DEVELOPER_TOOLS_URL = "https://glama.ai/mcp/servers?attributes=category%3Adeveloper-tools";

export interface GlamaDirectoryEntry {
  externalId: string;
  title: string;
  description?: string;
  license?: string;
  author?: string;
  authorUrl?: string;
  sourceUrl: string;
  operatingSystem?: string;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function identifierFromUrl(url: string): string {
  const parsed = new URL(url);
  const marker = "/mcp/servers/";
  const position = parsed.pathname.indexOf(marker);
  const remainder = position >= 0 ? parsed.pathname.slice(position + marker.length) : parsed.pathname.replace(/^\/+/, "");
  return remainder.replace(/\/+$/, "") || createHash("sha256").update(url).digest("hex").slice(0, 16);
}

/**
 * Parses publicly embedded JSON-LD from a Glama server directory page. It does not
 * call undocumented APIs, authenticate, or bypass rate limits/login controls.
 */
export function parseGlamaDirectoryHtml(html: string): GlamaDirectoryEntry[] {
  const match = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match?.[1]) throw new Error("Glama public directory did not expose JSON-LD metadata.");
  let root: unknown;
  try {
    root = JSON.parse(match[1]);
  } catch {
    throw new Error("Glama JSON-LD metadata is not valid JSON.");
  }
  const graph = asRecord(root)?.["@graph"];
  if (!Array.isArray(graph)) return [];
  const page = graph.map(asRecord).find((item) => item?.["@type"] === "SearchResultsPage");
  const mainEntity = asRecord(page?.mainEntity);
  const list = mainEntity?.itemListElement;
  if (!Array.isArray(list)) return [];

  return list.flatMap((raw): GlamaDirectoryEntry[] => {
    const wrapper = asRecord(raw);
    const item = asRecord(wrapper?.item);
    const url = asText(item?.url) ?? asText(wrapper?.url);
    const title = asText(item?.name);
    if (!url || !title || !URL.canParse(url)) return [];
    const author = asRecord(item?.author);
    const description = asText(item?.description);
    const license = asText(item?.license);
    const authorName = asText(author?.name);
    const authorUrl = asText(author?.sameAs);
    const operatingSystem = asText(item?.operatingSystem);
    return [{
      externalId: identifierFromUrl(url),
      title,
      ...(description ? { description } : {}),
      ...(license ? { license } : {}),
      ...(authorName ? { author: authorName } : {}),
      ...(authorUrl ? { authorUrl } : {}),
      sourceUrl: url,
      ...(operatingSystem ? { operatingSystem } : {})
    }];
  });
}

export function normalizeGlamaDirectoryHtml(html: string, observedAt = new Date(), sourceCategory = "Glama directory"): SourceRecord[] {
  const timestamp = observedAt.toISOString();
  return parseGlamaDirectoryHtml(html).flatMap((entry) => {
    const candidate = {
      source: "glama" as const,
      sourceUrl: entry.sourceUrl,
      externalId: entry.externalId,
      title: entry.title,
      ...(entry.description ? { description: entry.description } : {}),
      sourceCategory,
      rawHash: stableHash(entry),
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
      syncedAt: timestamp,
      importStatus: "imported" as const
    };
    const parsed = sourceRecordSchema.safeParse(candidate);
    return parsed.success ? [parsed.data] : [];
  });
}

export interface GlamaApiServer {
  attributes?: string[];
  description?: string;
  environmentVariablesJsonSchema?: { properties?: Record<string, unknown>; required?: string[] } | null;
  id: string;
  name: string;
  namespace: string;
  repository?: { url?: string } | null;
  slug: string;
  spdxLicense?: { name?: string; url?: string } | null;
  tools?: unknown[];
  url: string;
}

export interface GlamaApiPage {
  pageInfo: {
    endCursor?: string;
    hasNextPage: boolean;
    startCursor?: string;
  };
  servers: GlamaApiServer[];
}

/** Parses the documented public Glama MCP API response (`/api/mcp/v1/servers`). */
export function parseGlamaApiPage(input: unknown): GlamaApiPage {
  const root = asRecord(input);
  const rawPageInfo = asRecord(root?.pageInfo);
  const rawServers = root?.servers;
  if (!rawPageInfo || !Array.isArray(rawServers) || typeof rawPageInfo.hasNextPage !== "boolean") {
    throw new Error("Glama public API response does not match the expected servers/pageInfo shape.");
  }
  const servers = rawServers.flatMap((raw): GlamaApiServer[] => {
    const item = asRecord(raw);
    const id = asText(item?.id);
    const name = asText(item?.name);
    const namespace = asText(item?.namespace);
    const slug = asText(item?.slug);
    const url = asText(item?.url);
    if (!id || !name || !namespace || !slug || !url || !URL.canParse(url)) return [];
    const repository = asRecord(item?.repository);
    const repositoryUrl = asText(repository?.url);
    const spdx = asRecord(item?.spdxLicense);
    const spdxName = asText(spdx?.name);
    const spdxUrl = asText(spdx?.url);
    const description = asText(item?.description);
    const attributes = Array.isArray(item?.attributes) ? item.attributes.filter((value): value is string => typeof value === "string") : undefined;
    const tools = Array.isArray(item?.tools) ? item.tools : undefined;
    const schema = asRecord(item?.environmentVariablesJsonSchema);
    return [{
      id,
      name,
      namespace,
      slug,
      url,
      ...(attributes ? { attributes } : {}),
      ...(description ? { description } : {}),
      ...(repositoryUrl ? { repository: { url: repositoryUrl } } : {}),
      ...(spdxName || spdxUrl ? { spdxLicense: { ...(spdxName ? { name: spdxName } : {}), ...(spdxUrl ? { url: spdxUrl } : {}) } } : {}),
      ...(tools ? { tools } : {}),
      ...(schema ? { environmentVariablesJsonSchema: schema } : {})
    }];
  });
  const endCursor = asText(rawPageInfo.endCursor);
  const startCursor = asText(rawPageInfo.startCursor);
  return {
    pageInfo: {
      hasNextPage: rawPageInfo.hasNextPage,
      ...(endCursor ? { endCursor } : {}),
      ...(startCursor ? { startCursor } : {})
    },
    servers
  };
}

export function glamaApiServerToEntry(server: GlamaApiServer): GlamaDirectoryEntry & { repositoryUrl?: string; attributes: string[]; toolCount: number; requiredEnvironmentVariables: string[] } {
  const required = Array.isArray(server.environmentVariablesJsonSchema?.required) ? server.environmentVariablesJsonSchema.required.filter((value): value is string => typeof value === "string") : [];
  return {
    externalId: `${server.namespace}/${server.slug}`,
    title: server.name,
    ...(server.description ? { description: server.description } : {}),
    ...(server.spdxLicense?.name ? { license: server.spdxLicense.name } : {}),
    sourceUrl: server.url,
    ...(server.repository?.url ? { repositoryUrl: server.repository.url } : {}),
    attributes: server.attributes ?? [],
    toolCount: server.tools?.length ?? 0,
    requiredEnvironmentVariables: required
  };
}

export function normalizeGlamaApiPage(input: unknown, observedAt = new Date()): SourceRecord[] {
  const page = parseGlamaApiPage(input);
  const timestamp = observedAt.toISOString();
  return page.servers.flatMap((server) => {
    const entry = glamaApiServerToEntry(server);
    const candidate = {
      source: "glama" as const,
      sourceUrl: entry.sourceUrl,
      externalId: entry.externalId,
      title: entry.title,
      ...(entry.description ? { description: entry.description } : {}),
      ...(entry.repositoryUrl ? { repositoryUrl: entry.repositoryUrl } : {}),
      sourceCategory: entry.attributes.join(", ") || "Glama API",
      rawHash: stableHash(server),
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
      syncedAt: timestamp,
      importStatus: "imported" as const
    };
    const parsed = sourceRecordSchema.safeParse(candidate);
    return parsed.success ? [parsed.data] : [];
  });
}
