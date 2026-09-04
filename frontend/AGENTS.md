# Frontend instructions

- Follow the root `AGENTS.md`.
- Keep Canvas rendering and browser input separate from the deterministic shared simulation.
- Every interactive target must be at least 44 by 44 CSS pixels and keyboard operable.
- Use semantic labels, visible focus states, sufficient contrast, and `prefers-reduced-motion` fallbacks.
- Test user-visible behavioural changes with React Testing Library; use Playwright for critical browser flows when available.
- Preserve user changes and keep edits small and reversible.
- Justify new dependencies and never place secrets, remote media, or executable configuration in the client.
