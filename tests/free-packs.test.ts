import { describe, expect, it } from "vitest";
import { exportFreePackProfile, freePacks } from "../packages/config-exporters/src/index";

describe("free-ready packs", () => {
  it("contains the three curated ready packs", () => {
    expect(freePacks.map((pack) => pack.name)).toEqual(["free-web-research", "free-thinking-memory", "free-developer"]);
  });

  it("pins local package versions in the thinking-memory pack", () => {
    const profile = exportFreePackProfile("cursor", "free-thinking-memory");
    expect(profile.content).toContain("@modelcontextprotocol/server-sequential-thinking@2026.7.4");
    expect(profile.content).toContain("@modelcontextprotocol/server-memory@2026.7.4");
    expect(profile.content).not.toMatch(/github_pat_[A-Za-z0-9]{20,}/);
  });

  it("uses the VS Code server envelope for the web-research pack", () => {
    const content = JSON.parse(exportFreePackProfile("vscode", "free-web-research").content) as { servers: Record<string, unknown> };
    expect(content.servers).toHaveProperty("context7");
    expect(content.servers).toHaveProperty("playwright");
  });
});
