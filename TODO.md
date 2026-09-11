# Padel Pong - TODO

## Phase 1 - Project Shell

- [x] Create `index.html`.
- [x] Create `style.css`.
- [x] Create `game.js`.
- [x] Add a fullscreen canvas.
- [x] Add mobile viewport metadata.
- [x] Disable unwanted scrolling/touch selection during play.

## Project Hygiene

- [x] Add `.gitignore`.
- [x] Add Dependabot configuration.
- [x] Add GitHub Actions workflow for linting and tests.

## Phase 2 - Canvas and Responsive Layout

- [x] Initialize canvas and 2D context.
- [x] Handle device pixel ratio.
- [x] Resize canvas on window resize/orientation change.
- [x] Compute court bounds from viewport size.
- [x] Keep the court readable on portrait mobile and desktop.

## Phase 3 - Rendering

- [x] Draw blue background.
- [x] Draw orthographic top-down padel court.
- [x] Draw continuous glass wall outlines.
- [x] Draw center net as a glowing gridded surface.
- [x] Draw simplified court markings.
- [x] Draw player paddle.
- [x] Draw AI paddle.
- [x] Draw glowing ball.
- [x] Draw score display.
- [x] Add start/game-over overlay text.

## Phase 4 - Input

- [x] Add mouse movement input for desktop.
- [x] Add touch drag input for mobile.
- [x] Map pointer position to court coordinates.
- [x] Clamp player paddle inside playable bounds.
- [x] Add optional paddle smoothing.

## Phase 5 - Core Physics

- [x] Represent ball position, velocity, and height.
- [x] Add game loop with fixed or normalized timestep.
- [x] Move ball each frame.
- [x] Add court bounce behavior.
- [x] Add paddle collision.
- [x] Add hit angle based on paddle contact point.
- [x] Add side glass collision.
- [x] Add back glass collision after bounce.
- [x] Add net crossing and net collision.

## Phase 6 - Rules and Scoring

- [ ] Track which side the ball is on.
- [ ] Track bounce count per side.
- [ ] Award point after second bounce on a side.
- [ ] Award point when the ball fails to cross the net legally.
- [ ] Reset ball after a point.
- [ ] Implement first-to-7, win-by-2 scoring.
- [ ] Implement game-over state.
- [ ] Implement restart.

## Phase 7 - AI

- [ ] Add AI paddle state.
- [ ] Predict ball target position on AI side.
- [ ] Move AI paddle with limited speed.
- [ ] Add simple mistake/randomness factor.
- [ ] Tune AI difficulty for a playable first version.

## Phase 8 - Mobile Polish

- [ ] Test in narrow portrait viewport.
- [ ] Increase touch comfort if needed.
- [ ] Ensure text does not overlap the court.
- [ ] Ensure paddle remains easy to control with a finger.
- [ ] Prevent browser gestures from interfering with play where possible.

## Phase 9 - Game Feel

- [ ] Add glow effects consistently.
- [ ] Add small hit flash or particle effect.
- [ ] Add ball trail.
- [ ] Tune ball speed ramp.
- [ ] Tune paddle size and speed.
- [ ] Tune net collision feel.

## Phase 10 - Verification

- [ ] Run locally in a browser.
- [ ] Verify desktop controls.
- [ ] Verify touch controls with mobile viewport.
- [ ] Verify canvas is nonblank after load.
- [ ] Verify scoring works.
- [ ] Verify game can restart after game over.
- [ ] Check that layout has no overlapping text on mobile.

## Later Enhancements

- [ ] Add sound effects.
- [ ] Add real padel scoring.
- [ ] Add serve mechanic.
- [ ] Add difficulty selector.
- [ ] Add local two-player mode.
- [ ] Add pause/resume.
- [ ] Add haptic feedback.
- [ ] Add persistent high score or match history.
