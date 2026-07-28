import { createHash } from "node:crypto";
import { sourceRecordSchema, type SourceRecord } from "@mcp-library/catalog-schema";
import type { SourceAdapter } from "./index";

const headingPattern = /^###\s+(?<heading>.+)$/;
const entryPattern = /^\s*-\s+\[(?<title>[^\]]+)\]\((?<url>https?:\/\/[^)]+)\)(?<rest>.*)$/;
const githubRepositoryPattern = /^https:\/\/github\.com\/[^/]+\/[^/#?]+\/?$/i;

function stableHash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeTitle(title: string): string {
  return title.replace(/\\/g, "").trim();
}

/**
 * Conservative parser for the public Awesome MCP Servers README.
 * It only turns explicit Markdown list links into source records. Classification,
 * duplicate resolution, and publication happen in later review stages.
 */
export function normalizeAwesomeMarkdown(markdown: string, observedAt = new Date()): SourceRecord[] {
  const timestamp = observedAt.toISOString();
  const records: SourceRecord[] = [];
  let currentCategory: string | undefined;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const heading = rawLine.match(headingPattern)?.groups?.heading;
    if (heading) {
      currentCategory = heading.replace(/^[^A-Za-z0-9]+\s*/, "").trim();
      continue;
    }

    const match = rawLine.match(entryPattern);
    if (!match?.groups?.title || !match.groups.url) continue;

    const title = normalizeTitle(match.groups.title);
    const sourceUrl = match.groups.url;
    const rest = match.groups.rest?.replace(/^\s*[-–—]\s*/, "").trim();
    const repositoryUrl = githubRepositoryPattern.test(sourceUrl) ? sourceUrl.replace(/\/$/, "") : undefined;
    const externalId = repositoryUrl?.replace("https://github.com/", "");

    const candidate = {
      source: "awesome-mcp-servers" as const,
      sourceUrl,
      ...(externalId ? { externalId } : {}),
      title,
      ...(rest ? { description: rest } : {}),
      ...(currentCategory ? { sourceCategory: currentCategory } : {}),
      ...(repositoryUrl ? { repositoryUrl } : {}),
      rawHash: stableHash(rawLine),
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
      syncedAt: timestamp,
      importStatus: "imported" as const
    };

    const parsed = sourceRecordSchema.safeParse(candidate);
    if (parsed.success) records.push(parsed.data);
  }

  return records;
}

export const awesomeMcpServersAdapter: SourceAdapter = {
  name: "awesome-mcp-servers",
  normalize: normalizeAwesomeMarkdown
};
