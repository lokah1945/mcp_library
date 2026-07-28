import { describe, expect, it } from "vitest";
import { assertNoLikelySecret, exportClientConfig } from "../packages/config-exporters/src/index";
import type { CatalogServer } from "../packages/catalog-schema/src/index";

const server: CatalogServer = {
  id: "9ad0a448-ca3a-4a95-b56f-543c91baf9f3",
  slug: "safe-example",
  name: "Safe Example",
  summary: { en: "A test profile.", id: "Profil uji." },
  officialStatus: "official",
  lifecycleStatus: "active",
  maturity: "stable",
  categories: ["developer-tools"],
  tags: [],
  transports: ["stdio"],
  execution: "local",
  security: { permissionTags: ["read-only"], riskLevel: "low", reviewStatus: "reviewed" },
  distributions: [{ packageManager: "npm", packageName: "safe-example-mcp", installCommandTemplate: "npx -y safe-example-mcp", transport: "stdio" }],
  credentialRequirements: [{ kind: "pat", envVarName: "GITHUB_TOKEN", required: true, scopes: [] }],
  evidence: [{ source: "provider-repository", url: "https://example.com/repository", observedAt: "2026-07-28T00:00:00.000Z", confidence: 0.9 }],
  firstSeenAt: "2026-07-28T00:00:00.000Z",
  lastSeenAt: "2026-07-28T00:00:00.000Z"
};

describe("safe configuration exports", () => {
  it("exports only environment-variable placeholders", () => {
    const exported = exportClientConfig(server, "cursor");
    expect(exported.content).toContain("${GITHUB_TOKEN}");
    expect(exported.content).not.toContain("github_pat_");
  });

  it("rejects a synthetic literal secret pattern", () => {
    expect(() => assertNoLikelySecret("github" + "_pat_" + "abcdefghijklmnopqrstuvwxyz0123456789")).toThrow(/likely credential/i);
  });
});
