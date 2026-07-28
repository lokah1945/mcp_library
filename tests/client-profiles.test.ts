import { describe, expect, it } from "vitest";
import { exportLocalProfile } from "../packages/config-exporters/src/index";

describe("provider-documented local client profiles", () => {
  it("uses server-keyed VS Code config without credentials", () => {
    const profile = exportLocalProfile("vscode");
    const json = JSON.parse(profile.content) as { servers: Record<string, { url?: string; command?: string }> };
    expect(json.servers.github?.url).toBe("https://api.githubcopilot.com/mcp/");
    expect(json.servers.playwright?.command).toBe("npx");
    expect(profile.content).not.toContain("github_pat_");
  });

  it("uses mcpServers for Claude Desktop and Cursor", () => {
    expect(JSON.parse(exportLocalProfile("claude-desktop", ["context7"]).content)).toHaveProperty("mcpServers.context7");
    expect(JSON.parse(exportLocalProfile("cursor", ["playwright"]).content)).toHaveProperty("mcpServers.playwright");
  });
});
