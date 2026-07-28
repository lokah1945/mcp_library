import { describe, expect, it } from "vitest";
import { normalizeAwesomeMarkdown } from "../packages/source-adapters/src/awesome";

describe("normalizeAwesomeMarkdown", () => {
  it("keeps explicit entries, source category, canonical GitHub repository, and provenance time", () => {
    const records = normalizeAwesomeMarkdown(
      "### 🛠️ Developer Tools\n- [org/tool-mcp](https://github.com/org/tool-mcp) 📇 - A test tool.",
      new Date("2026-07-28T00:00:00.000Z")
    );

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      source: "awesome-mcp-servers",
      title: "org/tool-mcp",
      sourceCategory: "Developer Tools",
      repositoryUrl: "https://github.com/org/tool-mcp",
      syncedAt: "2026-07-28T00:00:00.000Z"
    });
  });

  it("does not invent entries from prose", () => {
    expect(normalizeAwesomeMarkdown("A catalog is not a list item.")).toHaveLength(0);
  });
});
