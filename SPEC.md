# Padel Pong - Specification

## Goal

Build a mobile-optimized browser game with JavaScript, HTML, CSS, and Canvas. The game should feel like a glowing white-line Pong interpretation of padel on a bright blue court background: simple, fast, readable, and playable with mouse or touch.

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

- Blue background: `#1E8FD5`.
- White foreground.
- High-contrast glowing line art.
- Pong-like minimalism.
- Orthographic top-down court view.
- Court is vertically arranged.
- Center net is represented as a glowing gridded surface.
- Glass walls are represented as continuous bright boundary lines.
- Avoid colorful UI in the initial version.

## Court

The court is drawn as an orthographic top-down padel court:

- The playing surface keeps the correct 10 m by 20 m doubles-court ratio.
- Court lines remain rectangular, as if the camera is directly above the field.
- Boundaries are flat white lines without outward wall surfaces.
- Central net crosses the court horizontally.
- On each half, the side boundary nearest the center net is dotted mesh (60%); the rear 40% and both back boundaries are solid lines.
- Court service and center lines may be simplified if they improve readability.

## Controls

### Desktop

- Mouse movement controls the player paddle.
- The player paddle follows the pointer across its half, including lateral space outside the court.
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

- Paddles are white glowing bars without cast shadows.
- Both paddles automatically match the ball height; collision reach is independent of height.
- Paddles stay on their own half but may extend laterally outside the court, allowing edge hits near the boundaries.
- Mobile layout reserves enough lateral space for these strokes.
- Paddle hits redirect the ball.
- Hit angle depends on contact point on the paddle.
- Optional later: spin or speed increase on strong hits.

### Ball Behavior

- Ball is a glowing white circle.
- Ball has 2D court position plus a simplified height value.
- Ball follows constant downward gravity of 9.81 m/s². Returns aim for a floor bounce in the opposing rear court.
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
- The second floor bounce since the last paddle hit ends the rally; wall contacts and net crossings never reset this count. The last hitter wins.
- A shot that first bounces on the hitter’s own floor loses the point.
- The ball may hit glass after bouncing.
- Passing a paddle does not end the point; back-wall rebounds remain playable.
- If the ball fails to cross the net after a hit, the hitting player loses the point.
- All outer boundaries contain the ball at every height; there is no out-of-court scoring.
- Hitting an opposing solid wall before a floor bounce loses the point. Own solid walls may be used for a return.
- Fence contact is legal after the ball bounces on the opposing floor during a rally. Fence contact before that bounce, or during the serve before the receiver returns it, is a fault.
- If the ball gets stuck or slows below a useful threshold, award the point to the opponent of the last hitter.

## Scoring

- Standard advantage game scoring: 0, 15, 30, 40, game.
- At 40–40 show deuce; the next point gives advantage. Losing advantage returns to deuce; winning the next point wins the game.
- Display cumulative games separately from points, with AI left and human right.
- After game, tap/click starts the next game at 0–0 and changes server. Each game starts serving from the server’s right side.
- Sets and tie-breaks are deferred.

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
- Sets and tie-breaks.
- Local two-player mode.
- Pause button.
- Haptic feedback on supported mobile browsers.
- More advanced ball height and wall physics.

## Serve

- Court measures 10 × 20 m, split into two 10 m halves. Each service box is 5 m wide and 6.95 m long from the net.
- Service lines are at y = 3.05 m and y = 16.95 m; center service line extends 20 cm behind them. Line width is 5 cm.
- Automatically position the server behind the service line, first on their right, then alternate sides after every completed point.
- Launch from the serving paddle diagonally into the opposing service box. Check the first floor contact; service lines count as in.
- A service fault allows a second attempt on the same side; a second fault awards a point to the receiver.
- Receiver must let the serve bounce before returning it. The AI waits behind the landing zone.
- Player serves the first game; server changes after each game.
- Tap/click starts the game; after each point the existing short pause precedes an automatic serve.
- The pre-hit bounce and human body/foot placement remain abstracted by the automatic paddle serve.

## Rules Reference

Checked against [FIP Rules of Padel, application 1 January 2026](https://www.padelfip.com/wp-content/uploads/2025/12/FIP_Rules-of-Padel-1.pdf), court dimensions and rules 1, 6–8 and 12–14. Official rules permit fence contact after an opposing floor bounce during a rally, but not on serve. Games use advantage scoring; the automatic serve remains a control simplification.
