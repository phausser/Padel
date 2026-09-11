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

assert.match(css, /overflow:\s*hidden;/, "style.css disables document scrolling");
assert.match(css, /touch-action:\s*none;/, "style.css disables default touch gestures during play");
assert.match(css, /#game-canvas/, "style.css styles the fullscreen canvas");

assert.match(game, /devicePixelRatio/, "game.js accounts for device pixel ratio");
assert.match(game, /COURT_WIDTH_METERS\s*=\s*10/, "game.js uses doubles padel court width");
assert.match(game, /COURT_LENGTH_METERS\s*=\s*20/, "game.js uses doubles padel court length");
assert.match(game, /COURT_ASPECT_RATIO/, "game.js derives court aspect ratio from dimensions");
assert.match(game, /MAX_DEVICE_PIXEL_RATIO\s*=\s*3/, "game.js caps device pixel ratio for mobile performance");
assert.match(game, /visualViewport/, "game.js accounts for the mobile visual viewport");
assert.match(game, /requestAnimationFrame/, "game.js batches resize work into animation frames");
assert.match(game, /addEventListener\("resize"/, "game.js listens for resize events");
assert.match(game, /preventDefault\(\)/, "game.js prevents unwanted touch interactions");

console.log("Smoke tests passed.");
