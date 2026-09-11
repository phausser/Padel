# Padel Pong

Padel Pong is a mobile-first browser game prototype built with plain HTML, CSS, JavaScript, and Canvas. It aims to feel like a glowing white-line Pong interpretation of padel on a bright blue court background: fast, minimal, readable, and playable with mouse or touch.

## Current Status

Phase 3 is complete. The project shell, responsive canvas layout, and first static rendering pass are in place, including a scale-aware top-down doubles padel court, outward glass walls, glowing line art, a gridded net, paddles, ball, score display, and ready overlay.

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
npm run build
```

The build command writes the static GitHub Pages artifact to `dist/`.

## Deployment

Merges to `main` deploy automatically to GitHub Pages through `.github/workflows/pages.yml`.

## Roadmap

See `TODO.md` for the phased implementation plan and `SPEC.md` for the game specification.

## License

This project is licensed under the MIT License. You may use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software as long as the license notice is included.
