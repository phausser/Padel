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
assert.match(game, /vz:/, "game.js represents ball height velocity");
assert.match(game, /MAX_FRAME_DELTA/, "game.js caps game loop delta time");
assert.match(game, /updateGame/, "game.js updates gameplay in an animation loop");
assert.match(game, /updateBall/, "game.js moves the ball each frame");
assert.match(game, /handleCourtBounce/, "game.js handles court bounce behavior");
assert.match(game, /handlePaddleCollision/, "game.js handles paddle collision");
assert.match(game, /getPaddleContactDirection/, "game.js steers paddle hits by contact zone");
assert.match(game, /PADDLE_SPIN_TRANSFER/, "game.js transfers paddle movement into ball spin");
assert.match(game, /PLAYER_PADDLE_Y_RANGE/, "game.js allows a small player stroke lane");
assert.match(game, /BALL_AIR_WALL_RESTITUTION/, "game.js constrains airborne wall collisions");
assert.match(game, /BALL_PADDLE_STROKE_ACCELERATION/, "game.js changes return speed from paddle stroke");
assert.match(game, /getPaddleStrokeSpeedBonus/, "game.js computes forward and backward stroke speed");
assert.match(game, /BALL_TRAIL_MAX_POINTS/, "game.js caps the glowing ball trail length");
assert.match(game, /drawBallTrail/, "game.js draws a fading ball trail");
assert.match(game, /addHitFlash/, "game.js adds small hit flash effects");
assert.match(game, /addHitParticles/, "game.js adds small hit particle effects");
assert.match(game, /BALL_SPEED_RAMP_PER_HIT/, "game.js ramps ball speed during rallies");
assert.match(game, /handleSideGlassCollision/, "game.js handles side glass collision");
assert.match(game, /handleBackGlassCollision/, "game.js handles back glass collision");
assert.match(game, /handleNetCollision/, "game.js handles net collision");
assert.match(game, /ballSide/, "game.js tracks which side the ball is on");
assert.match(game, /bouncesOnSide/, "game.js tracks bounce count per side");
assert.match(game, /awardPoint/, "game.js awards points from rule events");
assert.match(game, /POINT_RESET_DELAY_MS/, "game.js resets after scored points");
assert.match(game, /WINNING_SCORE\s*=\s*7/, "game.js uses first-to-7 scoring");
assert.match(game, /WIN_BY\s*=\s*2/, "game.js requires win by two");
assert.match(game, /status:\s*"ready"/, "game.js has a ready state");
assert.match(game, /"gameover"/, "game.js has a game-over state");
assert.match(game, /renderState\.score\.player\s*=\s*0/, "game.js restarts by resetting score");
assert.match(game, /aiState/, "game.js tracks AI paddle state");
assert.match(game, /AI_MAX_SPEED/, "game.js limits AI paddle speed");
assert.match(game, /updateAiPaddle/, "game.js updates AI paddle movement");
assert.match(game, /predictBallXAtY/, "game.js predicts the ball target on the AI side");
assert.match(game, /AI_PREDICTION_ERROR/, "game.js gives the AI a tunable mistake factor");
assert.match(game, /addEventListener\("resize"/, "game.js listens for resize events");
assert.match(game, /preventDefault\(\)/, "game.js prevents unwanted touch interactions");

console.log("Smoke tests passed.");
