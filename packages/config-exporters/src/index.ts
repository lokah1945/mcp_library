import type { CatalogServer } from "@mcp-library/catalog-schema";

export type SupportedClient = "claude-desktop" | "cursor" | "vscode";

export interface ConfigExport {
  client: SupportedClient;
  filename: string;
  content: string;
  requiredEnvironmentVariables: string[];
  warnings: string[];
}

const likelySecret = /(?:github_pat_|ghp_|sk-[a-z0-9]|AIza)[A-Za-z0-9_\-]{8,}/i;

/** Rejects accidental literal secrets before a config becomes copyable or persistable. */
export function assertNoLikelySecret(value: string): void {
  if (likelySecret.test(value)) {
    throw new Error("A likely credential was detected. Configuration exports must use environment-variable placeholders.");
  }
}

function firstDistribution(server: CatalogServer) {
  const distribution = server.distributions[0];
  if (!distribution) {
    throw new Error(`Server ${server.slug} has no distributable configuration.`);
  }
  return distribution;
}

function requiredEnvironmentVariables(server: CatalogServer): string[] {
  return server.credentialRequirements
    .filter((requirement) => requirement.required && requirement.envVarName)
    .map((requirement) => requirement.envVarName as string);
}

/**
 * Generates a deliberately small stdio template. It does not run packages and never
 * interpolates a real credential. Remote transports are shown as review-required.
 */
export function exportClientConfig(server: CatalogServer, client: SupportedClient): ConfigExport {
  const distribution = firstDistribution(server);
  const envVars = requiredEnvironmentVariables(server);
  const env = Object.fromEntries(envVars.map((name) => [name, `\${${name}}`]));

  if (distribution.transport !== "stdio") {
    const endpoint = distribution.endpointTemplate ?? "REVIEW_SERVER_ENDPOINT";
    assertNoLikelySecret(endpoint);
    return {
      client,
      filename: client === "claude-desktop" ? "claude_desktop_config.json" : "mcp.json",
      content: JSON.stringify({
        mcpServers: {
          [server.slug]: {
            transport: distribution.transport,
            url: endpoint,
            env
          }
        }
      }, null, 2),
      requiredEnvironmentVariables: envVars,
      warnings: ["Review the remote endpoint, OAuth flow, permissions, and provider documentation before connecting."]
    };
  }

  const content = JSON.stringify({
    mcpServers: {
      [server.slug]: {
        command: "npx",
        args: ["-y", distribution.packageName],
        ...(envVars.length ? { env } : {})
      }
    }
  }, null, 2);
  assertNoLikelySecret(content);

  return {
    client,
    filename: client === "claude-desktop" ? "claude_desktop_config.json" : "mcp.json",
    content,
    requiredEnvironmentVariables: envVars,
    warnings: ["Template only: review package provenance, requested permissions, and least-privilege scopes before running it."]
  };
}

export type LocalProfileClient = "claude-desktop" | "cursor" | "vscode";
export type ProfileServer = "github" | "playwright" | "context7" | "sequential-thinking" | "memory";
export type FreePackName = "free-web-research" | "free-thinking-memory" | "free-developer";

export interface LocalProfileExport {
  client: LocalProfileClient;
  filename: string;
  content: string;
  providerDocumentation: Partial<Record<ProfileServer, string>>;
  warnings: string[];
}

export interface FreePackDefinition {
  name: FreePackName;
  title: string;
  description: string;
  servers: ProfileServer[];
  riskNotes: string[];
}

interface ProfileDefinition {
  name: ProfileServer;
  documentation: string;
  kind: "remote" | "stdio";
  url?: string;
  command?: string;
  args?: string[];
  packageName?: string;
  pinnedVersion?: string;
  warnings: string[];
}

/**
 * Provider-documented, credential-free defaults. Profiles deliberately do not execute
 * a cloned repository: clones are for source inspection, while a client profile should
 * use the provider-supported package or remote endpoint. npm packages are version-pinned
 * so an upstream update is reviewed rather than silently activated.
 */
const profileDefinitions: Record<ProfileServer, ProfileDefinition> = {
  github: {
    name: "github",
    documentation: "https://github.com/github/github-mcp-server",
    kind: "remote",
    url: "https://api.githubcopilot.com/mcp/",
    warnings: ["A compatible client completes OAuth. Do not paste a PAT into this template.", "GitHub access can include write-capable tools; choose least-privilege scopes and toolsets."]
  },
  playwright: {
    name: "playwright",
    documentation: "https://github.com/microsoft/playwright-mcp",
    kind: "stdio",
    command: "npx",
    args: ["@playwright/mcp@0.0.78"],
    packageName: "@playwright/mcp",
    pinnedVersion: "0.0.78",
    warnings: ["Browser automation can interact with authenticated sessions. Start with a dedicated browser profile and non-production accounts."]
  },
  context7: {
    name: "context7",
    documentation: "https://github.com/upstash/context7",
    kind: "remote",
    url: "https://mcp.context7.com/mcp",
    warnings: ["The remote endpoint can be used without a template credential; provider documentation recommends a free API key for higher rate limits."]
  },
  "sequential-thinking": {
    name: "sequential-thinking",
    documentation: "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
    kind: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking@2026.7.4"],
    packageName: "@modelcontextprotocol/server-sequential-thinking",
    pinnedVersion: "2026.7.4",
    warnings: ["This package is configured as a local stdio tool. Inspect updates before changing its pinned version."]
  },
  memory: {
    name: "memory",
    documentation: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
    kind: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory@2026.7.4"],
    packageName: "@modelcontextprotocol/server-memory",
    pinnedVersion: "2026.7.4",
    warnings: ["Memory data is persisted by the server runtime. Use a dedicated local profile and do not assume sensitive-data isolation."]
  }
};

export const freePacks: FreePackDefinition[] = [
  {
    name: "free-web-research",
    title: "Free Web & Research",
    description: "Current documentation via Context7 plus controlled browser automation via Playwright.",
    servers: ["context7", "playwright"],
    riskNotes: ["No provider secret is embedded; hosted provider rate limits and terms may still apply.", "Playwright has browser-control capability; review its target sites and browser session."]
  },
  {
    name: "free-thinking-memory",
    title: "Free Thinking & Memory",
    description: "Local sequential planning and a local knowledge-graph memory server.",
    servers: ["sequential-thinking", "memory"],
    riskNotes: ["Uses version-pinned public npm packages; the published packages declare SEE LICENSE, so review licence terms before redistribution.", "Memory persists context; keep it out of sensitive workspaces unless reviewed."]
  },
  {
    name: "free-developer",
    title: "Free Developer Starter",
    description: "GitHub remote MCP, Playwright, and Context7 for common engineering workflows.",
    servers: ["github", "playwright", "context7"],
    riskNotes: ["GitHub uses a client-supported OAuth flow; account/service policy and write actions require deliberate permission review.", "Playwright browser control and remote Context7 access have different privacy boundaries."]
  }
];

function definitionEntry(definition: ProfileDefinition, client: LocalProfileClient): Record<string, unknown> {
  if (definition.kind === "remote") return { type: "http", url: definition.url };
  const base = { command: definition.command, args: definition.args };
  return client === "vscode" ? { type: "stdio", ...base } : base;
}

function assertKnownServers(servers: ProfileServer[]): void {
  if (!servers.length) throw new Error("At least one profile server is required.");
  for (const server of servers) {
    if (!profileDefinitions[server]) throw new Error(`Unknown profile server '${server}'.`);
  }
}

export interface PackageProfileDefinition {
  name: ProfileServer;
  packageName: string;
  pinnedVersion: string;
  documentation: string;
}

export function availablePackageProfiles(): PackageProfileDefinition[] {
  return Object.values(profileDefinitions).flatMap((definition) => {
    if (!definition.packageName || !definition.pinnedVersion) return [];
    return [{ name: definition.name, packageName: definition.packageName, pinnedVersion: definition.pinnedVersion, documentation: definition.documentation }];
  });
}

export function exportLocalProfile(client: LocalProfileClient, servers: ProfileServer[] = ["github", "playwright", "context7"]): LocalProfileExport {
  const unique = [...new Set(servers)];
  assertKnownServers(unique);
  const entries = Object.fromEntries(unique.map((name) => {
    const definition = profileDefinitions[name];
    return [definition.name, definitionEntry(definition, client)];
  }));
  const providerDocumentation = Object.fromEntries(unique.map((name) => [name, profileDefinitions[name].documentation]));
  const warnings = [...new Set(unique.flatMap((name) => profileDefinitions[name].warnings))];
  const content = JSON.stringify(client === "vscode" ? { servers: entries } : { mcpServers: entries }, null, 2);
  assertNoLikelySecret(content);
  return {
    client,
    filename: client === "vscode" ? "mcp.json" : `${client}.mcp.json`,
    content,
    providerDocumentation,
    warnings: [
      "Template contains no credentials. Complete OAuth in a supporting client or add only newly issued least-privilege credentials through that client's secret flow.",
      "Profiles use provider-documented package/remote endpoints, not local source clones. Review each provider's current documentation before connecting.",
      ...warnings
    ]
  };
}

export function exportFreePackProfile(client: LocalProfileClient, packName: FreePackName): LocalProfileExport & { pack: FreePackDefinition } {
  const pack = freePacks.find((candidate) => candidate.name === packName);
  if (!pack) throw new Error(`Unknown free pack '${packName}'.`);
  const profile = exportLocalProfile(client, pack.servers);
  return { ...profile, pack, warnings: [...profile.warnings, ...pack.riskNotes] };
}
