import { describe, expect, it } from "vitest";
import { normalizeMcpMarketToolsSitemap, parseMcpMarketSitemapIndex, parseMcpMarketToolsSitemap } from "../packages/source-adapters/src/mcpmarket";

const indexFixture = `<?xml version="1.0"?><sitemapindex>
  <sitemap><loc>https://mcpmarket.com/sitemap/tools-0.xml</loc></sitemap>
  <sitemap><loc>https://mcpmarket.com/sitemap/skills-0.xml</loc></sitemap>
  <sitemap><loc>https://mcpmarket.com/sitemap/tools-12.xml</loc></sitemap>
</sitemapindex>`;

const toolsFixture = `<?xml version="1.0"?><urlset>
  <url><loc>https://mcpmarket.com/server/context7-1</loc><lastmod>2026-07-27T00:00:00.000Z</lastmod></url>
  <url><loc>https://mcpmarket.com/server/playwright</loc><lastmod>2026-07-26T00:00:00.000Z</lastmod></url>
  <url><loc>https://mcpmarket.com/tools/skills/a-skill</loc></url>
</urlset>`;

describe("MCPMarket public sitemap adapter", () => {
  it("finds only official tool sitemap files from the sitemap index", () => {
    expect(parseMcpMarketSitemapIndex(indexFixture)).toEqual([
      "https://mcpmarket.com/sitemap/tools-0.xml",
      "https://mcpmarket.com/sitemap/tools-12.xml"
    ]);
  });

  it("discovers server URLs and last-modified metadata without scraping detail pages", () => {
    expect(parseMcpMarketToolsSitemap(toolsFixture)).toEqual([
      { slug: "context7-1", sourceUrl: "https://mcpmarket.com/server/context7-1", lastModified: "2026-07-27T00:00:00.000Z" },
      { slug: "playwright", sourceUrl: "https://mcpmarket.com/server/playwright", lastModified: "2026-07-26T00:00:00.000Z" }
    ]);
    const records = normalizeMcpMarketToolsSitemap(toolsFixture, new Date("2026-07-28T00:00:00.000Z"));
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ source: "mcpmarket", externalId: "context7-1" });
  });
});
