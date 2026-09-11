# Padel Pong

Padel Pong is a mobile-first browser game prototype built with plain HTML, CSS, JavaScript, and Canvas. It aims to feel like a glowing black-and-white Pong interpretation of padel: fast, minimal, readable, and playable with mouse or touch.

## Current Status

Phase 1 is complete. The project shell includes a fullscreen canvas, mobile viewport metadata, touch-scroll prevention, lightweight local checks, Dependabot, and a GitHub Actions CI workflow.

## Project Structure

- `index.html` - Page shell and canvas container.
- `style.css` - Fullscreen layout, mobile behavior, and visual base styles.
- `game.js` - Canvas setup and initial render shell.
- `scripts/lint.mjs` - Dependency-free lint checks.
- `tests/smoke.mjs` - Basic project smoke tests.
- `.github/workflows/ci.yml` - CI workflow for linting and tests.
- `.github/dependabot.yml` - Weekly dependency and GitHub Actions update checks.

## Running Locally

Open `index.html` directly in a browser, or serve the directory with any static file server.

## Checks

```sh
npm run lint
npm test
```

## Roadmap

See `TODO.md` for the phased implementation plan and `SPEC.md` for the game specification.

## License

This project is licensed under the MIT License. You may use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software as long as the license notice is included.
