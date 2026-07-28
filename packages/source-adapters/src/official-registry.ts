import { createHash } from "node:crypto";
import { sourceRecordSchema, type SourceRecord } from "@mcp-library/catalog-schema";
import type { SourceAdapter } from "./index";

export const OFFICIAL_REGISTRY_BASE_URL = "https://registry.modelcontextprotocol.io";

export interface OfficialRegistryPackage {
  registryType?: string;
  identifier?: string;
  version?: string;
  transport?: { type?: string };
  environmentVariables?: Array<{ name?: string; isSecret?: boolean; isRequired?: boolean }>;
}

export interface OfficialRegistryServer {
  name: string;
  title?: string;
  description?: string;
  version: string;
  repository?: { url: string; source?: string; subfolder?: string };
  packages?: OfficialRegistryPackage[];
  remotes?: Array<{ type?: string; url?: string }>;
  websiteUrl?: string;
}

export interface OfficialRegistryEnvelope {
  server: OfficialRegistryServer;
  _meta?: {
    "io.modelcontextprotocol.registry/official"?: {
      status?: "active" | "deprecated" | "deleted";
      updatedAt?: string;
      publishedAt?: string;
      isLatest?: boolean;
    };
    "io.modelcontextprotocol.registry/publisher-provided"?: {
      title?: string;
      tags?: string[];
      server_card_url?: string;
    };
  };
}

export interface OfficialRegistryPage {
  servers: OfficialRegistryEnvelope[];
  metadata?: { nextCursor?: string; count?: number };
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function detailUrl(name: string, version: string): string {
  return `${OFFICIAL_REGISTRY_BASE_URL}/v0.1/servers/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`;
}

/**
 * Parses a public Official MCP Registry list response. It intentionally preserves only
 * source facts; curation, licence verification, and clone eligibility happen later.
 */
export function parseOfficialRegistryPage(input: unknown): OfficialRegistryPage {
  if (!input || typeof input !== "object") throw new Error("Official Registry response must be an object.");
  const page = input as { servers?: unknown; metadata?: unknown };
  if (!Array.isArray(page.servers)) throw new Error("Official Registry response does not contain a servers array.");

  const servers = page.servers.flatMap((item): OfficialRegistryEnvelope[] => {
    if (!item || typeof item !== "object") return [];
    const envelope = item as { server?: unknown; _meta?: OfficialRegistryEnvelope["_meta"] };
    if (!envelope.server || typeof envelope.server !== "object") return [];
    const server = envelope.server as Partial<OfficialRegistryServer>;
    if (typeof server.name !== "string" || typeof server.version !== "string") return [];
    if (server.repository && (typeof server.repository.url !== "string" || !URL.canParse(server.repository.url))) return [];
    return [{ server: server as OfficialRegistryServer, ...(envelope._meta ? { _meta: envelope._meta } : {}) }];
  });

  const metadata = page.metadata && typeof page.metadata === "object" ? page.metadata as { nextCursor?: unknown; count?: unknown } : undefined;
  return {
    servers,
    ...(metadata ? {
      metadata: {
        ...(typeof metadata.nextCursor === "string" ? { nextCursor: metadata.nextCursor } : {}),
        ...(typeof metadata.count === "number" ? { count: metadata.count } : {})
      }
    } : {})
  };
}

export function normalizeOfficialRegistryPage(input: unknown, observedAt = new Date()): SourceRecord[] {
  const page = parseOfficialRegistryPage(input);
  const timestamp = observedAt.toISOString();

  return page.servers.flatMap((envelope) => {
    const server = envelope.server;
    const official = envelope._meta?.["io.modelcontextprotocol.registry/official"];
    const candidate = {
      source: "official-registry" as const,
      sourceUrl: detailUrl(server.name, server.version),
      externalId: `${server.name}@${server.version}`,
      title: server.title ?? envelope._meta?.["io.modelcontextprotocol.registry/publisher-provided"]?.title ?? server.name,
      ...(server.description ? { description: server.description } : {}),
      ...(server.repository ? { repositoryUrl: server.repository.url } : {}),
      rawHash: stableHash(envelope),
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
      syncedAt: timestamp,
      importStatus: official?.status === "deleted" ? "rejected" as const : "imported" as const
    };
    const parsed = sourceRecordSchema.safeParse(candidate);
    return parsed.success ? [parsed.data] : [];
  });
}

export const officialRegistryAdapter: SourceAdapter = {
  name: "official-registry",
  normalize(input: string, observedAt?: Date): SourceRecord[] {
    return normalizeOfficialRegistryPage(JSON.parse(input), observedAt);
  }
};
