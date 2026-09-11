# Padel Pong - Specification

## Goal

Build a mobile-optimized browser game with JavaScript, HTML, CSS, and Canvas. The game should feel like a glowing black-and-white Pong interpretation of padel: simple, fast, readable, and playable with mouse or touch.

## Core Concept

The player controls a paddle near the bottom of a vertically oriented padel court. An AI opponent controls the paddle near the top. The ball moves across a pseudo-3D top-down court, can bounce on the court surface, interact with glass walls, cross a central net, and score according to simplified padel-inspired rules.

## Platform

- Browser-based.
- No required build step for the first version.
- Works on desktop and mobile.
- Primary target: portrait mobile screens.
- Secondary target: desktop browser.

## Files

- `index.html`: page shell and canvas container.
- `style.css`: layout, responsive behavior, typography, and non-canvas UI styling.
- `game.js`: game loop, rendering, input, physics, AI, and scoring.

## Visual Style

- Black background.
- White foreground.
- High-contrast glowing line art.
- Pong-like minimalism.
- Pseudo-3D top-down perspective.
- Court is vertically arranged.
- Center net is represented as a glowing gridded surface.
- Glass walls are represented as continuous bright boundary lines.
- Avoid colorful UI in the initial version.

## Court

The court is drawn as a perspective-projected padel court:

- Far side appears slightly narrower.
- Near side appears wider.
- Central net crosses the court horizontally.
- Side and back glass walls are continuous outlines.
- Court service and center lines may be simplified if they improve readability.

## Controls

### Desktop

- Mouse movement controls the player paddle.
- The player paddle follows the pointer horizontally.
- Optional: subtle smoothing to avoid jitter.

### Mobile

- Touch drag controls the player paddle.
- Prevent page scrolling while interacting with the game.
- Use a generous control area so the player can drag anywhere on the lower half of the screen.

## Gameplay

### Players

- Human player: bottom side.
- AI opponent: top side.

### Paddle Behavior

- Paddles are white glowing bars.
- Paddle position is constrained to its side of the court.
- Paddle hits redirect the ball.
- Hit angle depends on contact point on the paddle.
- Optional later: spin or speed increase on strong hits.

### Ball Behavior

- Ball is a glowing white circle.
- Ball has 2D court position plus a simplified height value.
- Ball can bounce on the court surface.
- Ball can bounce off glass after hitting the court.
- Ball must cross the net to reach the other side.

### Net Behavior

- The net is in the middle of the court.
- If the ball crosses with enough height, it passes over.
- If the ball crosses too low, it collides with the net and loses speed or drops.

## Simplified Padel Rules

Initial version should use arcade-friendly padel-inspired rules:

- A side may allow one court bounce before returning the ball.
- If the ball bounces twice on the same side, the other player scores.
- The ball may hit glass after bouncing.
- The ball may not be returned directly from behind the player paddle.
- If the ball fails to cross the net after a hit, the hitting player loses the point.
- If the ball gets stuck, leaves the playable area, or slows below a useful threshold, award the point based on last legal side.

## Scoring

Initial version can use arcade scoring:

- First to 7 points wins a game.
- Win by 2 points.
- Show player and AI score in a simple Pong-style display.

Optional later version:

- Real padel/tennis scoring: `0`, `15`, `30`, `40`, advantage, game, set.

## AI

The first AI should be simple but playable:

- Tracks predicted ball x-position.
- Moves with limited speed.
- Makes mistakes at lower difficulty.
- Reacts slower when the ball is far away or moving quickly.

Difficulty can be tuned by:

- AI max speed.
- Prediction accuracy.
- Reaction delay.
- Paddle size.

## Game States

Required:

- Loading/ready state.
- Playing state.
- Point scored state.
- Game over state.
- Restart state.

The first version may start immediately after a tap/click.

## UI

- Score at top or overlayed near the court edges.
- Start/restart prompt.
- Minimal text.
- Mobile-safe sizing.
- No visible instructional panels inside the main play surface unless needed before start/game over.

## Responsiveness

- Canvas fills the viewport.
- Court preserves its intended aspect ratio.
- Game remains playable on narrow portrait screens.
- Desktop layout should center the court and avoid stretching it too wide.

## Performance

- Use `requestAnimationFrame`.
- Avoid expensive per-frame DOM changes.
- Canvas rendering should remain smooth on mobile.

## Nice-to-Have Later

- Sound effects.
- Particle sparks on hits.
- Difficulty selection.
- Real padel scoring.
- Local two-player mode.
- Pause button.
- Haptic feedback on supported mobile browsers.
- Serve mechanics.
- More advanced ball height and wall physics.

