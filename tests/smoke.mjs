import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, css, game] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("style.css", "utf8"),
  readFile("game.js", "utf8")
]);

assert.match(html, /<meta name="viewport"/, "index.html defines mobile viewport metadata");
assert.match(html, /<canvas id="game-canvas"/, "index.html contains the game canvas");
assert.match(html, /<link rel="stylesheet" href="style\.css">/, "index.html loads style.css");
assert.match(html, /<script src="game\.js" defer><\/script>/, "index.html loads game.js");
assert.match(html, /#1E8FD5/, "index.html sets the browser theme color");

assert.match(css, /overflow:\s*hidden;/, "style.css disables document scrolling");
assert.match(css, /touch-action:\s*none;/, "style.css disables default touch gestures during play");
assert.match(css, /#game-canvas/, "style.css styles the fullscreen canvas");
assert.match(css, /#1E8FD5/, "style.css uses the requested blue background");

assert.match(game, /devicePixelRatio/, "game.js accounts for device pixel ratio");
assert.match(game, /BACKGROUND_COLOR\s*=\s*"#1E8FD5"/, "game.js renders the requested blue background");
assert.match(game, /COURT_WIDTH_METERS\s*=\s*10/, "game.js uses doubles padel court width");
assert.match(game, /COURT_LENGTH_METERS\s*=\s*20/, "game.js uses doubles padel court length");
assert.match(game, /COURT_ASPECT_RATIO/, "game.js derives court aspect ratio from dimensions");
assert.match(game, /MAX_DEVICE_PIXEL_RATIO\s*=\s*3/, "game.js caps device pixel ratio for mobile performance");
assert.match(game, /visualViewport/, "game.js accounts for the mobile visual viewport");
assert.match(game, /requestAnimationFrame/, "game.js batches resize work into animation frames");
assert.match(game, /drawCourtSurface/, "game.js draws the court surface");
assert.match(game, /drawGlassWalls/, "game.js draws glass wall outlines");
assert.doesNotMatch(game, /FAR_WIDTH_SCALE/, "game.js does not narrow the far side of the court");
assert.match(game, /WALL_DEPTH_RATIO/, "game.js draws walls outward from the court");
assert.match(game, /drawNet/, "game.js draws the center net");
assert.match(game, /drawCourtMarkings/, "game.js draws court markings");
assert.match(game, /drawPaddle/, "game.js draws paddles");
assert.match(game, /drawBall/, "game.js draws the ball");
assert.match(game, /drawScore/, "game.js draws score text");
assert.match(game, /drawReadyOverlay/, "game.js draws ready overlay text");
assert.match(game, /screenToCourtPoint/, "game.js maps pointer positions to court coordinates");
assert.match(game, /clampPlayerPaddleX/, "game.js clamps the player paddle to playable bounds");
assert.match(game, /PADDLE_SMOOTHING/, "game.js smooths player paddle input");
assert.match(game, /addEventListener\("pointermove"/, "game.js listens for pointer movement");
assert.match(game, /addEventListener\("pointerdown"/, "game.js listens for pointer drag starts");
assert.match(game, /addEventListener\("resize"/, "game.js listens for resize events");
assert.match(game, /preventDefault\(\)/, "game.js prevents unwanted touch interactions");

console.log("Smoke tests passed.");
