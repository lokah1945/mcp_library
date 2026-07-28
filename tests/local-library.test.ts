import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { curatedFreeSeeds } from "../apps/worker/src/lib/free-seeds";
import { canonicalCloneUrl, cloneCandidate, mergeCandidates } from "../apps/worker/src/lib/local-library";

describe("local clone library policy", () => {
  it("only accepts credential-free HTTPS URLs on approved public Git hosts", () => {
    expect(canonicalCloneUrl("https://github.com/microsoft/playwright-mcp")).toBe("https://github.com/microsoft/playwright-mcp.git");
    expect(() => canonicalCloneUrl("file:///tmp/untrusted-repository")).toThrow(/approved public Git hosts/i);
    expect(() => canonicalCloneUrl("https://token@example.com/repository.git")).toThrow(/credential-free/i);
  });

  it("preserves verified open-source clone eligibility over lower-confidence records", () => {
    const verified = curatedFreeSeeds[0];
    if (!verified) throw new Error("Missing curated free seed.");
    const { licenseSpdx: _licenseSpdx, ...unverified } = verified;
    const merged = mergeCandidates([verified, { ...unverified, source: "official-registry", freeStatus: "source-available-unverified", cloneEligible: false }]);
    expect(merged[0]).toMatchObject({ freeStatus: "verified-open-source", cloneEligible: true, licenseSpdx: "MIT" });
  });

  it("previews a clone without downloading or executing provider code", async () => {
    const root = await mkdtemp(join(tmpdir(), "mcp-library-test-"));
    try {
      const manifest = await cloneCandidate(root, curatedFreeSeeds, "microsoft/playwright-mcp", { confirmed: true, allowSourceAvailable: false, dryRun: true });
      expect(manifest.clonedCommit).toBe("DRY_RUN");
      expect(manifest.destination).toContain("microsoft-playwright-mcp");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
