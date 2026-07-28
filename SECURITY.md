# Security policy

## Credential handling

`mcp_library` must never contain a real credential in source code, fixtures, documentation, issue text, configuration exports, logs, or Git history.

- `.env` is ignored; only `.env.example` with empty placeholders may be committed.
- Treat any credential shared through chat, a URL, a screenshot, an issue, or a commit as exposed. Revoke it and create a new minimum-scope credential before use.
- Store deployment secrets in the selected platform's secret manager. The catalog application does not need to persist provider credentials.
- Configuration exports may contain `${ENV_VAR}` placeholders only.

## Local clone and update safety

- A clone is source acquisition, not approval to install or run an MCP server.
- Provider discovery can be scheduled, but `git fetch` only checks for changes. Source updates are never applied automatically by default.
- `library:apply` requires an explicit server name, a clean fast-forward, and `--yes` after the reviewer has inspected the provider change.
- The clone manager accepts only credential-free HTTPS URLs on a small allowlist of public Git hosts and disables submodules, hooks, and Git credential prompts.

## Source safety

Third-party MCP descriptions and setup snippets are untrusted content. The catalog must sanitize rendered content, attribute sources, and never automatically execute a discovered package or call an MCP tool.

## Reporting a vulnerability

Until a public repository owner and contact channel are configured, do not disclose sensitive reports in public issues. Contact the project owner through an agreed private channel with a minimal reproduction and impact summary.
