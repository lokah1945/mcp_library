import { createHash } from "node:crypto";
import { sourceRecordSchema, type SourceRecord } from "@mcp-library/catalog-schema";

export const MCPMARKET_SITEMAP_INDEX_URL = "https://mcpmarket.com/sitemap.xml";

export interface McpMarketSitemapEntry {
  slug: string;
  sourceUrl: string;
  lastModified?: string;
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function textFromTag(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}[^>]*>\\s*([\\s\\S]*?)\\s*<\\/${tag}>`, "i"));
  return match?.[1] ? decodeXml(match[1].trim()) : undefined;
}

/** Parses the official MCPMarket sitemap index and returns only server/tool sitemap URLs. */
export function parseMcpMarketSitemapIndex(xml: string): string[] {
  const urls = [...xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)].map((match) => decodeXml(match[1]!.trim()));
  return urls.filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname === "mcpmarket.com" && /^\/sitemap\/tools-\d+\.xml$/.test(parsed.pathname);
    } catch {
      return false;
    }
  });
}

/** Parses a public MCPMarket tools sitemap file into stable server discovery records. */
export function parseMcpMarketToolsSitemap(xml: string): McpMarketSitemapEntry[] {
  const entries: McpMarketSitemapEntry[] = [];
  for (const match of xml.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/gi)) {
    const block = match[1]!;
    const sourceUrl = textFromTag(block, "loc");
    if (!sourceUrl) continue;
    try {
      const parsed = new URL(sourceUrl);
      const serverMatch = parsed.pathname.match(/^\/server\/([^/]+)\/?$/);
      if (!serverMatch?.[1] || parsed.hostname !== "mcpmarket.com") continue;
      const lastModified = textFromTag(block, "lastmod");
      entries.push({ slug: serverMatch[1], sourceUrl, ...(lastModified ? { lastModified } : {}) });
    } catch {
      // Ignore malformed sitemap URLs rather than inventing server records.
    }
  }
  return entries;
}

export function normalizeMcpMarketToolsSitemap(xml: string, observedAt = new Date()): SourceRecord[] {
  const timestamp = observedAt.toISOString();
  return parseMcpMarketToolsSitemap(xml).flatMap((entry) => {
    const candidate = {
      source: "mcpmarket" as const,
      sourceUrl: entry.sourceUrl,
      externalId: entry.slug,
      title: entry.slug,
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
