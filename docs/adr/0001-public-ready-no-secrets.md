# ADR 0001: Public-ready repository, no credentials

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

The initial repository is intended to be public. A credential was included in project discussion, which means it must be considered exposed and cannot be used or committed by the project.

## Decision

The repository contains only `.env.example` placeholders. `.env` and environment-specific variants are ignored. Source adapters have dry-run and fixture modes that do not contact external services. Remote GitHub setup requires a target owner/organization and newly issued, minimum-scope authentication outside the repository.

## Consequences

The project can safely be reviewed publicly now. Live source enrichment and remote publishing are intentionally delayed until secure deployment inputs are supplied.
