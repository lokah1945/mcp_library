import { z } from "zod";

/** A display field that supports the product's initial Indonesian–English UI. */
export const localizedTextSchema = z.object({
  en: z.string().min(1),
  id: z.string().min(1)
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const canonicalCategorySchema = z.enum([
  "developer-tools",
  "coding-agents",
  "code-execution-sandboxing",
  "version-control",
  "browser-automation",
  "command-line-os-automation",
  "cloud-devops",
  "databases-data-platforms",
  "search-web-data-extraction",
  "files-documents",
  "knowledge-memory-research",
  "security-identity-cryptography",
  "observability-monitoring",
  "testing-qa",
  "collaboration-productivity",
  "design-product",
  "ai-model-providers",
  "business-domains",
  "other-needs-review"
]);

export type CanonicalCategory = z.infer<typeof canonicalCategorySchema>;

export const sourceNameSchema = z.enum([
  "official-registry",
  "glama",
  "awesome-mcp-servers",
  "mcpmarket",
  "provider-repository",
  "package-registry",
  "editorial",
  "community-submission"
]);

export const evidenceSchema = z.object({
  source: sourceNameSchema,
  url: z.string().url(),
  observedAt: z.string().datetime(),
  field: z.string().min(1).optional(),
  confidence: z.number().min(0).max(1)
});

export const credentialRequirementSchema = z.object({
  kind: z.enum(["none", "api-key", "oauth", "pat", "service-account", "local-credential", "unknown"]),
  envVarName: z.string().regex(/^[A-Z][A-Z0-9_]*$/).optional(),
  required: z.boolean(),
  scopes: z.array(z.string()).default([]),
  setupUrl: z.string().url().optional(),
  notes: localizedTextSchema.optional()
});

export const distributionSchema = z.object({
  packageManager: z.enum(["npm", "pypi", "container", "binary", "git", "hosted", "unknown"]),
  packageName: z.string().min(1),
  version: z.string().optional(),
  installCommandTemplate: z.string().min(1),
  runtime: z.string().min(1).optional(),
  transport: z.enum(["stdio", "streamable-http", "sse", "unknown"]),
  endpointTemplate: z.string().url().optional()
});

export const securityProfileSchema = z.object({
  permissionTags: z.array(z.enum([
    "read-only",
    "write-actions",
    "destructive-actions",
    "filesystem-access",
    "shell-code-execution",
    "network-egress",
    "sensitive-data-access",
    "browser-control"
  ])).default([]),
  riskLevel: z.enum(["low", "moderate", "high", "unknown"]),
  reviewStatus: z.enum(["not-reviewed", "reviewed", "advisory", "blocked"]),
  notes: localizedTextSchema.optional()
});

export const serverSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  summary: localizedTextSchema,
  officialStatus: z.enum(["official", "claimed", "community", "unknown"]),
  lifecycleStatus: z.enum(["active", "deprecated", "archived", "needs-review"]),
  maturity: z.enum(["experimental", "beta", "stable", "unknown"]),
  categories: z.array(canonicalCategorySchema).min(1),
  tags: z.array(z.string()).default([]),
  transports: z.array(z.enum(["stdio", "streamable-http", "sse", "unknown"])).min(1),
  execution: z.enum(["local", "cloud", "hybrid", "unknown"]),
  homepageUrl: z.string().url().optional(),
  repositoryUrl: z.string().url().optional(),
  documentationUrl: z.string().url().optional(),
  licenseSpdx: z.string().optional(),
  distributions: z.array(distributionSchema).default([]),
  credentialRequirements: z.array(credentialRequirementSchema).default([]),
  security: securityProfileSchema,
  evidence: z.array(evidenceSchema).min(1),
  firstSeenAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
  lastVerifiedAt: z.string().datetime().optional()
});

export type CatalogServer = z.infer<typeof serverSchema>;

export const sourceRecordSchema = z.object({
  source: sourceNameSchema,
  sourceUrl: z.string().url(),
  externalId: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  sourceCategory: z.string().optional(),
  repositoryUrl: z.string().url().optional(),
  rawHash: z.string().min(8),
  firstSeenAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
  syncedAt: z.string().datetime(),
  importStatus: z.enum(["imported", "needs-review", "rejected"])
});

export type SourceRecord = z.infer<typeof sourceRecordSchema>;

export function isCanonicalCategory(value: string): value is CanonicalCategory {
  return canonicalCategorySchema.safeParse(value).success;
}
