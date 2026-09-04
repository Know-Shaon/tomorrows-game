# Engineering rules

## Working method

Use caveman mode: inspect, make one understandable change, validate it, then continue. Changes must be small, reversible, and preserve user work. Do not create extra repositories, worktrees, or workspaces without permission.

## Product boundaries

The shipped browser experience must not call an LLM, paid AI API, database, account service, or unrequested remote endpoint. Prototype state is device-local and must be labelled honestly. Configuration is typed, validated, and limited to allowlisted values.

## Quality bar

- Strict TypeScript without `any`, ignored errors, or undocumented lint suppressions.
- Behavioural changes include tests.
- Accessibility includes semantics, keyboard operation, 44px targets, contrast, focus visibility, responsive layout, and reduced-motion support.
- Dependencies require a concrete reason.
- No secrets in source control.
- Completion claims require exact command or browser evidence.
- Preserve user changes and avoid destructive Git operations.
