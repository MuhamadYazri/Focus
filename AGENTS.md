# Agent Workflow & Architecture Rules

## 1. Architecture Map Lookup (`flow.md`)
- Before navigating or searching files across the project, consult [`flow.md`](./flow.md) to locate relevant components, services, models, and state variables instead of scanning files sequentially.
- **Cache / Read Once:** If you have already read `flow.md` in this conversation session, **do NOT re-read or scan it again**. Proceed directly with the task using the existing context.

## 2. Post-Sprint / Task Completion Protocol
- Whenever you finish a sprint, feature implementation, refactoring, or add/remove files or state fields:
  - **Mandatory Step:** You **MUST update [`flow.md`](./flow.md)** to reflect the newly added, modified, or deleted files, components, exports, or data schema changes before concluding the task.
  - Keep [`flow.md`](./flow.md) concise, structured, and synchronized with the latest codebase reality.
