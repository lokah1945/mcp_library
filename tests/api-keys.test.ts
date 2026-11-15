import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  API_KEY_FILE_NAME,
  PROVIDER_API_KEY_VARIABLES,
  loadProviderApiKeys,
  parseApiKeyFile,
  providerApiKeyStatus,
  resolveApiKeyFilePath,
  resolveWorkspaceRoot
} from "../apps/worker/src/lib/api-keys";

const WORKSPACE_ROOT = resolve(__dirname, "..");

const TOUCHED_VARIABLES = [
  "GLAMA_API_KEY",
  "MCPMARKET_API_KEY",
  "GITHUB_TOKEN",
  "GLAMA_API_BASE_URL",
  "MCPMARKET_API_BASE_URL",
  "MCP_LIBRARY_API_KEY_FILE"
];
const savedEnvironment: Record<string, string | undefined> = {};

beforeAll(() => {
  for (const name of TOUCHED_VARIABLES) {
    savedEnvironment[name] = process.env[name];
    delete process.env[name];
  }
});

afterEach(() => {
  for (const name of TOUCHED_VARIABLES) delete process.env[name];
});

afterAll(() => {
  for (const [name, value] of Object.entries(savedEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("library.api.key dotenv parsing", () => {
  it("parses assignments, comments, blank lines, export prefixes, quotes, and '=' in values", () => {
    const parsed = parseApiKeyFile([
      "# comment line",
      "",
      "GLAMA_API_KEY=abc123",
      "export GITHUB_TOKEN='ghp_secret_with=equals'",
      "MCPMARKET_API_KEY=\"quoted-token\"",
      "GLAMA_API_BASE_URL=https://glama.ai/api/mcp/v1",
      "   ",
      "# another comment"
    ].join("\n"));
    expect(parsed).toEqual({
      GLAMA_API_KEY: "abc123",
      GITHUB_TOKEN: "ghp_secret_with=equals",
      MCPMARKET_API_KEY: "quoted-token",
      GLAMA_API_BASE_URL: "https://glama.ai/api/mcp/v1"
    });
  });

  it("ignores malformed lines instead of failing the whole file", () => {
    const parsed = parseApiKeyFile([
      "no-separator-here",
      "1INVALID=x",
      "=starts-with-equals",
      "--flag=true",
      "GITHUB_TOKEN=valid"
    ].join("\n"));
    expect(parsed).toEqual({ GITHUB_TOKEN: "valid" });
  });
});

describe("centralized provider key loading", () => {
  it("resolves library.api.key at the workspace root", () => {
    expect(resolveWorkspaceRoot(WORKSPACE_ROOT)).toBe(WORKSPACE_ROOT);
    expect(resolveWorkspaceRoot(join(WORKSPACE_ROOT, "apps", "worker"))).toBe(WORKSPACE_ROOT);
    expect(resolveApiKeyFilePath(WORKSPACE_ROOT)).toBe(join(WORKSPACE_ROOT, API_KEY_FILE_NAME));
  });

  it("applies allowlisted provider variables from the file and reports names only", () => {
    const directory = mkdtempSync(join(tmpdir(), "mcp-library-keys-"));
    try {
      const file = join(directory, API_KEY_FILE_NAME);
      writeFileSync(file, [
        "GLAMA_API_KEY=glama-key-value",
        "MCPMARKET_API_KEY=mcpmarket-key-value",
        "SOME_UNRELATED_SECRET=should-not-be-applied"
      ].join("\n"), "utf8");
      const environment: Record<string, string | undefined> = {};
      const report = loadProviderApiKeys({ apiKeyFilePath: file, environment });
      expect(report.fileExists).toBe(true);
      expect(report.appliedFromFile).toEqual(["GLAMA_API_KEY", "MCPMARKET_API_KEY"]);
      expect(report.ignoredUnknownVariables).toEqual(["SOME_UNRELATED_SECRET"]);
      expect(environment.GLAMA_API_KEY).toBe("glama-key-value");
      expect(environment.MCPMARKET_API_KEY).toBe("mcpmarket-key-value");
      expect(environment.SOME_UNRELATED_SECRET).toBeUndefined();
      // The report itself must never carry credential values.
      expect(JSON.stringify(report)).not.toContain("glama-key-value");
      expect(JSON.stringify(report)).not.toContain("mcpmarket-key-value");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("never overwrites variables already present in the environment", () => {
    const directory = mkdtempSync(join(tmpdir(), "mcp-library-keys-"));
    try {
      const file = join(directory, API_KEY_FILE_NAME);
      writeFileSync(file, "GLAMA_API_KEY=from-file\nGITHUB_TOKEN=from-file-too", "utf8");
      const environment: Record<string, string | undefined> = { GLAMA_API_KEY: "from-environment" };
      const report = loadProviderApiKeys({ apiKeyFilePath: file, environment });
      expect(environment.GLAMA_API_KEY).toBe("from-environment");
      expect(environment.GITHUB_TOKEN).toBe("from-file-too");
      expect(report.retainedFromEnvironment).toEqual(["GLAMA_API_KEY"]);
      expect(report.appliedFromFile).toEqual(["GITHUB_TOKEN"]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("records empty values instead of clearing an existing configuration", () => {
    const directory = mkdtempSync(join(tmpdir(), "mcp-library-keys-"));
    try {
      const file = join(directory, API_KEY_FILE_NAME);
      writeFileSync(file, "GLAMA_API_KEY=\nMCPMARKET_API_BASE_URL=https://app.mcpmarket.com/api/v1", "utf8");
      const environment: Record<string, string | undefined> = { GLAMA_API_KEY: "existing" };
      const report = loadProviderApiKeys({ apiKeyFilePath: file, environment });
      expect(environment.GLAMA_API_KEY).toBe("existing");
      expect(report.emptyInFile).toEqual(["GLAMA_API_KEY"]);
      expect(report.appliedFromFile).toEqual(["MCPMARKET_API_BASE_URL"]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("is a safe no-op when the key file is absent", () => {
    const report = loadProviderApiKeys({ apiKeyFilePath: join(tmpdir(), `missing-${Date.now()}.key`), environment: {} });
    expect(report.fileExists).toBe(false);
    expect(report.appliedFromFile).toEqual([]);
    expect(report.ignoredUnknownVariables).toEqual([]);
  });
});

describe("provider key status reporting", () => {
  it("lists every MCP provider with presence-only status and no values", () => {
    const report = loadProviderApiKeys({ apiKeyFilePath: join(tmpdir(), `missing-${Date.now()}.key`), environment: {} });
    const rows = providerApiKeyStatus({ ...report, appliedFromFile: ["GLAMA_API_KEY"] }, { GLAMA_API_KEY: "super-secret-value" });
    const glama = rows.find((row) => row.variable === "GLAMA_API_KEY");
    expect(glama?.status).toBe("configured (library.api.key)");
    const registry = rows.find((row) => row.provider === "Official MCP Registry");
    expect(registry?.status).toBe("no key required");
    const github = rows.find((row) => row.variable === "GITHUB_TOKEN");
    expect(github?.status).toBe("not set (optional)");
    expect(JSON.stringify(rows)).not.toContain("super-secret-value");
  });

  it("covers exactly the documented provider allowlist", () => {
    expect(PROVIDER_API_KEY_VARIABLES).toEqual([
      "GLAMA_API_KEY",
      "GLAMA_API_BASE_URL",
      "MCPMARKET_API_KEY",
      "MCPMARKET_API_BASE_URL",
      "GITHUB_TOKEN"
    ]);
  });
});
