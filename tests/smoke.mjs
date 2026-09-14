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
assert.match(game, /PADDLE_COLLISION_DEPTH/, "game.js gives paddle collision a playable depth");
assert.match(game, /PADDLE_SPIN_TRANSFER/, "game.js transfers paddle movement into ball spin");
assert.match(game, /PADDLE_HALF_COURT_MARGIN/, "game.js allows paddle movement across each half");
assert.match(game, /getHeightShadowOffset/, "game.js offsets shadows by object height");
assert.match(game, /BALL_AIR_WALL_RESTITUTION/, "game.js constrains airborne wall collisions");
assert.match(game, /BALL_PADDLE_STROKE_ACCELERATION/, "game.js changes return speed from paddle stroke");
assert.match(game, /getPaddleStrokeSpeedBonus/, "game.js computes forward and backward stroke speed");
assert.match(game, /BALL_TRAIL_MAX_POINTS/, "game.js caps the glowing ball trail length");
assert.match(game, /drawBallTrail/, "game.js draws a fading ball trail");
assert.match(game, /addHitFlash/, "game.js adds small hit flash effects");
assert.match(game, /addHitParticles/, "game.js adds small hit particle effects");
assert.match(game, /BALL_SPEED_RAMP_PER_HIT/, "game.js ramps ball speed during rallies");
assert.match(game, /AudioContext/, "game.js uses browser-native Web Audio");
assert.match(game, /unlockAudio/, "game.js unlocks audio from player input");
assert.match(game, /playSound/, "game.js plays sound effects for game events");
assert.match(game, /SOUND_MASTER_VOLUME/, "game.js keeps sound effect volume controlled");
assert.match(game, /handleSideGlassCollision/, "game.js handles side glass collision");
assert.match(game, /handleBackGlassCollision/, "game.js handles back glass collision");
assert.match(game, /handleNetCollision/, "game.js handles net collision");
assert.match(game, /ballSide/, "game.js tracks which side the ball is on");
assert.match(game, /bouncesOnSide/, "game.js tracks bounce count per side");
assert.match(game, /awardPoint/, "game.js awards points from rule events");
assert.match(game, /POINT_RESET_DELAY_MS/, "game.js resets after scored points");
assert.match(game, /WINNING_SCORE\s*=\s*4/, "game.js uses four-point game scoring");
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

// Run the real physics with browser APIs stubbed, without starting the render loop.
const { runInNewContext } = await import("node:vm");
const sandbox = {
  assert,
  performance: { now: () => 0 },
  document: { querySelector: () => ({ getContext: () => ({}), addEventListener() {} }) },
  window: { addEventListener() {} }
};
runInNewContext(game.replace(/resizeCanvas\(\);\s*$/, "") + `
  gameState.status = "playing";
  assert.equal(SERVICE_LINE_TOP, 3.05);
  assert.equal(SERVICE_LINE_BOTTOM, 16.95);
  for (const server of ["player", "ai"]) {
    for (const points of [0, 1, 6, 7]) {
      gameState.server = server;
      renderState.score.player = points;
      renderState.score.ai = 0;
      gameState.serveAttempt = 2;
      gameState.status = "playing";
      resetBall();
      const setup = getServiceSetup();
      assert.equal(renderState.ball.isServe, true);
      assert.equal(renderState.ball.x, setup.x);
      // Keep receiver behind the landing zone so we test the first floor contact.
      Object.assign(renderState.playerPaddle, { x: 5, y: 19 });
      Object.assign(renderState.aiPaddle, { x: 5, y: 1 });
      for (let i = 0; i < 400 && !renderState.ball.hasCourtBounce; i += 1) updateBall(1 / 120);
      assert.equal(gameState.status, "playing");
      assert.ok(renderState.ball.hasCourtBounce);
      assert.ok(isInServiceBox(renderState.ball), "serve lands diagonally in service box");
      assert.ok(Math.abs(renderState.ball.x - setup.targetX) < 0.1);
    }
  }
  gameState.server = "player";
  renderState.score.player = 0;
  renderState.score.ai = 0;
  for (const [x, y] of [[-1, 2], [11, 18], [5, -1], [5, 21]]) {
    Object.assign(renderState.ball, { hasCourtBounce: true, x, y, z: 20, vx: x < 0 ? -3 : 3, vy: y < 0 ? -3 : 3 });
    handleSideGlassCollision(renderState.ball);
    handleBackGlassCollision(renderState.ball);
    assert.ok(renderState.ball.x >= BALL_RADIUS && renderState.ball.x <= 10 - BALL_RADIUS);
    assert.ok(renderState.ball.y >= BALL_RADIUS && renderState.ball.y <= 20 - BALL_RADIUS);
    if (x < 0) assert.ok(renderState.ball.vx > 0);
    if (x > 10) assert.ok(renderState.ball.vx < 0);
    if (y < 0) assert.ok(renderState.ball.vy > 0);
    if (y > 20) assert.ok(renderState.ball.vy < 0);
  }
  Object.assign(renderState.ball, { x: 5, y: 19.7, z: 2, vx: 1, vy: 3 });
  handleDeadBall(renderState.ball);
  assert.equal(gameState.status, "playing", "passing a paddle does not score OUT");

  for (const x of [-1, 11]) {
    for (const [isServe, hasCourtBounce, y, expected] of [
      [true, true, 8, "point"],
      [true, false, 8, "point"],
      [false, false, 8, "point"],
      [false, false, 12, "point"],
      [false, true, 8, "playing"]
    ]) {
      renderState.score.ai = 0;
      renderState.score.player = 0;
      gameState.serveAttempt = 2;
      gameState.status = "playing";
      gameState.bouncesOnSide = hasCourtBounce ? 1 : 0;
      Object.assign(renderState.ball, { x, y, z: 2, vx: x < 0 ? -3 : 3, isServe, hasCourtBounce, lastHitBy: "player" });
      const before = renderState.score.ai;
      handleSideGlassCollision(renderState.ball);
      assert.equal(gameState.status, expected, "FIP fence contact rule");
      assert.equal(renderState.score.ai, before + (expected === "point" ? 1 : 0));
      if (expected === "playing") {
        assert.ok(x < 0 ? renderState.ball.vx > 0 : renderState.ball.vx < 0);
        assert.equal(gameState.bouncesOnSide, 1, "fence does not reset bounce count");
      }
    }
  }
  gameState.status = "playing";
  gameState.serveAttempt = 2;
  Object.assign(renderState.ball, { x: 5, y: -1, z: 2, hasCourtBounce: false, lastHitBy: "player" });
  handleBackGlassCollision(renderState.ball);
  assert.equal(gameState.status, "point", "opponent wall before floor is a fault");
  gameState.status = "playing";
  gameState.bouncesOnSide = 0;
  Object.assign(renderState.ball, { x: 5, y: 4, z: 0, vz: -4, hasCourtBounce: false, isServe: false, lastHitBy: "player" });
  handleCourtBounce(renderState.ball);
  assert.equal(gameState.status, "playing", "one bounce is allowed");
  renderState.ball.y = 11;
  trackBallSide(renderState.ball);
  assert.equal(gameState.bouncesOnSide, 1, "crossing the net does not erase the bounce");
  renderState.ball.z = 0;
  handleCourtBounce(renderState.ball);
  assert.equal(gameState.status, "point", "second bounce ends rally");
  gameState.status = "playing";
  resetBall();
  const initialZ = renderState.ball.z;
  const initialVz = renderState.ball.vz;
  updateBall(0.01);
  assert.ok(Math.abs(renderState.ball.z - (initialZ + initialVz * 0.01 - 0.5 * 9.81 * 0.01 ** 2)) < 1e-9);
  assert.ok(clampPlayerPaddleX(11) > 10 && clampPlayerPaddleX(-1) < 0);
  Object.assign(renderState.playerPaddle, { x: 10.5, y: 18 });
  Object.assign(renderState.ball, { x: 9.8, y: 18.1, z: 2, vy: 5, hasCourtBounce: true, lastHitBy: "ai" });
  handlePaddleCollision(renderState.ball, renderState.playerPaddle, -1, 9.8, 17.8, "player");
  assert.equal(renderState.ball.isServe, false, "return ends service restrictions");
  assert.ok(renderState.ball.vy < 0, "outside paddle returns ball with its inside edge");

  renderState.score.player = 0;
  renderState.score.ai = 0;
  renderState.ball.isServe = false;
  for (const label of ["15", "30", "40", "GAME"]) {
    gameState.status = "playing";
    awardPoint("player", "DOUBLE BOUNCE");
    assert.equal(getScoreLabel("player"), label);
  }
  assert.equal(gameState.status, "gameover");
  Object.assign(renderState.score, { player: 3, ai: 3 });
  for (const winner of ["player", "ai", "ai", "player"]) {
    gameState.status = "playing";
    awardPoint(winner, "DOUBLE BOUNCE");
    assert.equal(hasWinner(), false);
    assert.equal(getScoreLabel(winner), renderState.score.player === renderState.score.ai ? "40" : "AD");
  }
  for (let i = 0; i < 2; i += 1) {
    gameState.status = "playing";
    awardPoint("ai", "DOUBLE BOUNCE");
  }
  assert.equal(gameState.status, "gameover");
  Object.assign(renderState.score, { player: 0, ai: 0 });
  gameState.status = "playing";
  gameState.serveAttempt = 1;
  resetBall();
  const firstX = renderState.ball.x;
  Object.assign(renderState.ball, { x: 8, y: 6, z: 0 });
  handleCourtBounce(renderState.ball);
  assert.equal(gameState.serveAttempt, 2);
  assert.equal(renderState.score.ai, 0);
  gameState.status = "playing";
  resetBall();
  assert.equal(renderState.ball.x, firstX, "second serve uses same side");
  Object.assign(renderState.ball, { x: 8, y: 6, z: 0 });
  handleCourtBounce(renderState.ball);
  assert.equal(renderState.score.ai, 1, "double fault awards receiver a point");
  resetBall();
  assert.notEqual(renderState.ball.x, firstX, "next point switches service side");
`, sandbox);
console.log("Serve and boundary physics tests passed.");

runInNewContext(game.replace(/resizeCanvas\(\);\s*$/, "") + `
  for (const delta of [1 / 30, 1 / 60, 1 / 120]) {
    for (const randomValue of [0, 0.5, 1]) {
      Math.random = () => randomValue;
      for (const points of [0, 1, 2, 3]) {
        gameState.server = "player";
        gameState.status = "playing";
        gameState.serveAttempt = 1;
        Object.assign(renderState.score, { player: points, ai: 0 });
        resetBall();
        let bouncedBeforeReturn = false;
        for (let frame = 0; frame < 6 / delta; frame += 1) {
          updateAiPaddle(delta);
          updateBall(delta);
          bouncedBeforeReturn ||= renderState.ball.hasCourtBounce;
          if (renderState.ball.lastHitBy === "ai" || gameState.status !== "playing") break;
        }
        assert.equal(gameState.status, "playing", "AI receives serve without a fault");
        assert.equal(renderState.ball.lastHitBy, "ai", "AI returns serves from both sides");
        assert.ok(bouncedBeforeReturn, "AI waits for the service bounce");
        assert.ok(renderState.ball.vy > 0, "AI sends the return toward the player");
      }
    }
  }
`, { ...sandbox });
console.log("AI serve reception tests passed.");
