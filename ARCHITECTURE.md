# Architecture

Proposed modular monorepo: Next.js experience, NestJS/Fastify API, PostgreSQL durable state, Redis ephemeral state, OpenTofu provider adapters, Temporal durable orchestration, n8n workflow integration, OpenTelemetry evidence. Technology selections are provisional until ADR acceptance.

## Trust boundaries
Browser -> authenticated API -> tenant-scoped policy -> approved typed plan -> isolated worker -> provider adapter. Workers emit evidence; Observatory reads a separate projection. AI cannot directly execute shell or provider mutations.

## First vertical slice
Simulated n8n deployment intent, deterministic plan, policy decision, approval, mock execution and evidence projection. No external resources until provider credentials and acceptance gates are established.
