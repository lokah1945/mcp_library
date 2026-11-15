import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Centralized MCP provider API-key handling.
 *
 * `library.api.key` (repository root) is the single, Git-ignored place where
 * implementers configure every provider credential this worker consumes.
 * The loader applies a strict allowlist of provider variables, never
 * overwrites variables already present in the process environment, and never
 * logs or persists any credential value — only variable names and presence.
 */

export const API_KEY_FILE_NAME = "library.api.key";
export const API_KEY_FILE_TEMPLATE_NAME = "library.api.key.example";

export type ProviderKeyRequirement = "required" | "optional" | "none";

export interface ProviderApiKeyEntry {
  /** Catalog provider that consumes the credential. */
  provider: string;
  /** Environment variable the worker reads. Empty string for keyless providers. */
  envVarName: string;
  /** Whether the provider needs the key for catalog work. */
  requirement: ProviderKeyRequirement;
  /** Worker commands that read this variable. */
  usedBy: string;
  /** Where a new key/token is created, when applicable. */
  createAt?: string;
  /** Non-secret base-URL override rather than a credential. */
  isBaseUrl?: boolean;
}

/** Every provider that supplies MCP data to this project, and its key needs. */
export const PROVIDER_API_KEY_ENTRIES: readonly ProviderApiKeyEntry[] = [
  {
    provider: "Official MCP Registry",
    envVarName: "",
    requirement: "none",
    usedBy: "providers:sync, providers:check"
  },
  {
    provider: "Glama",
    envVarName: "GLAMA_API_KEY",
    requirement: "required",
    usedBy: "providers:sync-glama",
    createAt: "https://glama.ai/settings/api-keys"
  },
  {
    provider: "Glama",
    envVarName: "GLAMA_API_BASE_URL",
    requirement: "optional",
    usedBy: "providers:sync-glama",
    isBaseUrl: true
  },
  {
    provider: "MCPMarket",
    envVarName: "MCPMARKET_API_KEY",
    requirement: "optional",
    usedBy: "providers:mcpmarket-auth-check",
    createAt: "https://docs.mcpmarket.com/docs/api-tokens/using-api-tokens"
  },
  {
    provider: "MCPMarket",
    envVarName: "MCPMARKET_API_BASE_URL",
    requirement: "optional",
    usedBy: "providers:mcpmarket-auth-check",
    isBaseUrl: true
  },
  {
    provider: "GitHub enrichment",
    envVarName: "GITHUB_TOKEN",
    requirement: "optional",
    usedBy: "providers:sync --enrich-github, library:enrich",
    createAt: "https://github.com/settings/personal-access-tokens/new"
  },
  {
    provider: "Awesome MCP Servers",
    envVarName: "",
    requirement: "none",
    usedBy: "fixtures import"
  }
];

/** Only these variables may be sourced from library.api.key. */
export const PROVIDER_API_KEY_VARIABLES: readonly string[] = [
  "GLAMA_API_KEY",
  "GLAMA_API_BASE_URL",
  "MCPMARKET_API_KEY",
  "MCPMARKET_API_BASE_URL",
  "GITHUB_TOKEN"
];

const VARIABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Walks up from startDir to the workspace root (package.json + tsconfig.base.json). */
export function resolveWorkspaceRoot(startDir = process.cwd()): string {
  let current = resolve(startDir);
  for (;;) {
    if (existsSync(join(current, "package.json")) && existsSync(join(current, "tsconfig.base.json"))) return current;
    const parent = resolve(current, "..");
    if (parent === current) return startDir;
    current = parent;
  }
}

export function resolveApiKeyFilePath(startDir = process.cwd()): string {
  return process.env.MCP_LIBRARY_API_KEY_FILE
    ? resolve(process.env.MCP_LIBRARY_API_KEY_FILE)
    : join(resolveWorkspaceRoot(startDir), API_KEY_FILE_NAME);
}

/**
 * Parses dotenv-style `KEY=value` lines. Supports `#` comments, blank lines,
 * an optional `export ` prefix, one pair of surrounding quotes, and `=` inside
 * values. Invalid lines are ignored so a malformed edit cannot crash a sync.
 */
export function parseApiKeyFile(content: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice("export ".length).trim();
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    if (!VARIABLE_NAME_PATTERN.test(key)) continue;
    let value = line.slice(separator + 1).trim();
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

export type ApiKeyVariableOrigin = "environment" | "file";

export interface ApiKeyLoadReport {
  /** Absolute path that was consulted. */
  file: string;
  /** Whether library.api.key exists. */
  fileExists: boolean;
  /** Allowlisted variables applied from the file (names only, never values). */
  appliedFromFile: string[];
  /** Allowlisted variables found in the file but already set in the environment. */
  retainedFromEnvironment: string[];
  /** Variables present in the file that are not on the provider allowlist. */
  ignoredUnknownVariables: string[];
  /** Allowlisted variables with an empty value in the file. */
  emptyInFile: string[];
}

export interface LoadProviderApiKeysOptions {
  /** Overrides the file path (used by tests and deployments). */
  apiKeyFilePath?: string;
  /** Mutable environment target; defaults to process.env. */
  environment?: Record<string, string | undefined>;
}

/**
 * Loads `library.api.key` from the repository root and applies allowlisted
 * provider variables to the environment. Real environment variables always
 * win, no value is ever returned, logged, or written anywhere else.
 */
export function loadProviderApiKeys(options: LoadProviderApiKeysOptions = {}): ApiKeyLoadReport {
  const environment = options.environment ?? process.env;
  const file = options.apiKeyFilePath ?? resolveApiKeyFilePath();
  if (!existsSync(file)) {
    return { file, fileExists: false, appliedFromFile: [], retainedFromEnvironment: [], ignoredUnknownVariables: [], emptyInFile: [] };
  }

  let parsed: Record<string, string>;
  try {
    parsed = parseApiKeyFile(readFileSync(file, "utf8"));
  } catch {
    // An unreadable key file must never break catalog work; report and continue.
    return { file, fileExists: true, appliedFromFile: [], retainedFromEnvironment: [], ignoredUnknownVariables: [], emptyInFile: [] };
  }

  const appliedFromFile: string[] = [];
  const retainedFromEnvironment: string[] = [];
  const ignoredUnknownVariables: string[] = [];
  const emptyInFile: string[] = [];
  const allowlist = new Set(PROVIDER_API_KEY_VARIABLES);

  for (const [key, value] of Object.entries(parsed)) {
    if (!allowlist.has(key)) { ignoredUnknownVariables.push(key); continue; }
    if (!value) { emptyInFile.push(key); continue; }
    if (environment[key]) { retainedFromEnvironment.push(key); continue; }
    environment[key] = value;
    appliedFromFile.push(key);
  }

  return { file, fileExists: true, appliedFromFile, retainedFromEnvironment, ignoredUnknownVariables, emptyInFile };
}

export interface ProviderApiKeyStatusRow {
  provider: string;
  variable: string;
  requirement: string;
  status: string;
  usedBy: string;
  createAt: string;
}

/**
 * Builds a presence-only status table for every MCP provider. `configured`
 * states never include the credential value itself.
 */
export function providerApiKeyStatus(report: ApiKeyLoadReport, environment: Record<string, string | undefined> = process.env): ProviderApiKeyStatusRow[] {
  const fromFile = new Set(report.appliedFromFile);
  const rows: ProviderApiKeyStatusRow[] = [];
  const seen = new Set<string>();
  for (const entry of PROVIDER_API_KEY_ENTRIES) {
    const status = entry.requirement === "none" || !entry.envVarName
      ? "no key required"
      : environment[entry.envVarName]
        ? fromFile.has(entry.envVarName)
          ? `configured (library.api.key)`
          : "configured (environment)"
        : entry.requirement === "required"
          ? "missing (required)"
          : "not set (optional)";
    const row: ProviderApiKeyStatusRow = {
      provider: entry.provider,
      variable: entry.envVarName || "—",
      requirement: entry.requirement,
      status,
      usedBy: entry.usedBy,
      createAt: entry.createAt ?? "—"
    };
    const dedupe = `${row.provider}|${row.variable}`;
    if (!seen.has(dedupe)) { seen.add(dedupe); rows.push(row); }
  }
  return rows;
}
