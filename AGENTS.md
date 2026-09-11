# Agent Instructions

## Project

Padel Pong is a mobile-first browser game built with plain HTML, CSS, JavaScript, and Canvas. The first version intentionally avoids a build step and external runtime dependencies.

## Source Files

- Keep the core game in `index.html`, `style.css`, and `game.js` unless the project grows enough to justify splitting modules.
- Follow the phased plan in `TODO.md`.
- Use `SPEC.md` as the source of truth for gameplay, visual style, and platform goals.

## Development Guidelines

- Preserve the bright blue background with white glowing Pong-like line art.
- Prioritize portrait mobile usability, then desktop.
- Keep UI text minimal and avoid instructional panels inside the main play surface unless a game state requires it.
- Avoid adding dependencies for simple checks or browser-native behavior.
- Prefer small, focused changes that complete one phase or one clear slice of a phase.

## Verification

Run these checks before committing:

```sh
npm run lint
npm test
```

When gameplay or rendering changes are made, also verify the app manually in a browser and check at least one narrow mobile viewport.

## Git

Use Conventional Commit style for commit messages, for example:

```text
feat: add paddle input
fix: prevent touch scroll during play
docs: update project roadmap
```
