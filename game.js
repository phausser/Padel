"use strict";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const COURT_WIDTH_METERS = 10;
const COURT_LENGTH_METERS = 20;
const COURT_ASPECT_RATIO = COURT_WIDTH_METERS / COURT_LENGTH_METERS;
const MIN_COURT_MARGIN = 30;
const MAX_DEVICE_PIXEL_RATIO = 3;
const BACKGROUND_COLOR = "#1E8FD5";
const WALL_DEPTH_RATIO = 0.115;
const PLAYER_PADDLE_Y = 18.35;
const AI_PADDLE_Y = 1.65;
const PLAYER_PADDLE_WIDTH = 2.15;
const PLAYER_MOBILE_PADDLE_WIDTH = 2.48;
const AI_PADDLE_WIDTH = 1.9;
const PADDLE_SMOOTHING = 0.35;
const BALL_START_X = 5.35;
const BALL_START_Y = 12.25;
const BALL_RADIUS = 0.16;
const BALL_GRAVITY = 5.8;
const BALL_FLOOR_RESTITUTION = 0.72;
const BALL_FLOOR_FRICTION = 0.985;
const BALL_PADDLE_LIFT = 7.6;
const BALL_MIN_BOUNCE_VELOCITY = 1.25;
const BALL_NET_HEIGHT = 0.42;
const BALL_NET_RESTITUTION = 0.36;
const BALL_WALL_RESTITUTION = 0.84;
const BALL_HEIGHT_SCREEN_SCALE = 0.56;
const BALL_MAX_SIDE_SPEED = 5.4;
const BALL_SPIN_ACCELERATION = 1.45;
const BALL_SPIN_DECAY = 0.92;
const PADDLE_REACH_HEIGHT = 6.25;
const PADDLE_SPIN_TRANSFER = 0.34;
const PADDLE_SHADOW_COLOR = "#0b4f78";
const MAX_FRAME_DELTA = 1 / 30;
const POINT_RESET_DELAY_MS = 900;
const WINNING_SCORE = 7;
const WIN_BY = 2;
const AI_MAX_SPEED = 6.1;
const AI_REACTION_INTERVAL = 0.14;
const AI_CENTERING_SPEED = 1.25;
const AI_PREDICTION_ERROR = 0.42;

const renderState = {
  score: {
    player: 0,
    ai: 0
  },
  playerPaddle: {
    x: 5,
    y: PLAYER_PADDLE_Y,
    width: PLAYER_PADDLE_WIDTH,
    vx: 0
  },
  aiPaddle: {
    x: 5,
    y: AI_PADDLE_Y,
    width: AI_PADDLE_WIDTH,
    vx: 0
  },
  ball: {
    x: BALL_START_X,
    y: BALL_START_Y,
    z: 1.15,
    vx: 0.74,
    vy: -6.6,
    vz: 3,
    spin: 0,
    radius: BALL_RADIUS,
    hasCourtBounce: false,
    lastHitBy: "player"
  }
};

const inputState = {
  activePointerId: null,
  targetX: renderState.playerPaddle.x,
  smoothingFrame: 0
};

const aiState = {
  targetX: renderState.aiPaddle.x,
  reactionTimer: 0,
  mistakeOffset: 0
};

const gameState = {
  status: "ready",
  animationFrame: 0,
  lastTime: 0,
  pointResumeTime: 0,
  message: "TAP / CLICK",
  ballSide: "player",
  bouncesOnSide: 0
};

const layout = {
  viewport: {
    width: 0,
    height: 0,
    dpr: 1
  },
  court: {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }
};

let pendingResizeFrame = 0;

function resizeCanvas() {
  layout.viewport = getViewport();

  canvas.width = Math.floor(layout.viewport.width * layout.viewport.dpr);
  canvas.height = Math.floor(layout.viewport.height * layout.viewport.dpr);
  canvas.style.width = `${layout.viewport.width}px`;
  canvas.style.height = `${layout.viewport.height}px`;

  context.setTransform(layout.viewport.dpr, 0, 0, layout.viewport.dpr, 0, 0);
  layout.court = getCourtBounds(layout.viewport.width, layout.viewport.height);
  updateResponsivePaddles();
  drawShell();
}

function getCourtBounds(width, height) {
  const shortestSide = Math.min(width, height);
  const courtMargin = Math.max(MIN_COURT_MARGIN, shortestSide * 0.055);
  const safeWidth = Math.max(0, width - courtMargin * 2);
  const safeHeight = Math.max(0, height - courtMargin * 2);
  let courtWidth = Math.min(safeWidth, safeHeight * COURT_ASPECT_RATIO);
  let courtHeight = courtWidth / COURT_ASPECT_RATIO;

  if (courtHeight > safeHeight) {
    courtHeight = safeHeight;
    courtWidth = courtHeight * COURT_ASPECT_RATIO;
  }

  return {
    x: (width - courtWidth) / 2,
    y: (height - courtHeight) / 2,
    width: courtWidth,
    height: courtHeight
  };
}

function getViewport() {
  const viewport = window.visualViewport;
  const width = Math.floor(viewport?.width || window.innerWidth);
  const height = Math.floor(viewport?.height || window.innerHeight);
  const dpr = Math.min(
    MAX_DEVICE_PIXEL_RATIO,
    Math.max(1, window.devicePixelRatio || 1)
  );

  return { width, height, dpr };
}

function updateResponsivePaddles() {
  const isNarrowPortrait =
    layout.viewport.width <= 480 && layout.viewport.height > layout.viewport.width;

  renderState.playerPaddle.width = isNarrowPortrait
    ? PLAYER_MOBILE_PADDLE_WIDTH
    : PLAYER_PADDLE_WIDTH;
  renderState.aiPaddle.width = AI_PADDLE_WIDTH;
  inputState.targetX = clampPlayerPaddleX(inputState.targetX);
  renderState.playerPaddle.x = clampPlayerPaddleX(renderState.playerPaddle.x);
  renderState.aiPaddle.x = clampAiPaddleX(renderState.aiPaddle.x);
}

function queueResize() {
  if (pendingResizeFrame !== 0) {
    cancelAnimationFrame(pendingResizeFrame);
  }

  pendingResizeFrame = requestAnimationFrame(() => {
    pendingResizeFrame = 0;
    resizeCanvas();
  });
}

function queueInputRender() {
  if (gameState.status === "playing") {
    return;
  }

  if (inputState.smoothingFrame !== 0) {
    return;
  }

  inputState.smoothingFrame = requestAnimationFrame(updatePlayerPaddle);
}

function updatePlayerPaddle() {
  inputState.smoothingFrame = 0;

  movePlayerPaddleTowardTarget();
  drawShell();

  if (renderState.playerPaddle.x !== inputState.targetX) {
    queueInputRender();
  }
}

function movePlayerPaddleTowardTarget(delta = 1 / 60) {
  const paddle = renderState.playerPaddle;
  const previousX = paddle.x;
  const nextX = lerp(paddle.x, inputState.targetX, PADDLE_SMOOTHING);

  paddle.x = clampPlayerPaddleX(
    Math.abs(nextX - inputState.targetX) < 0.01 ? inputState.targetX : nextX
  );
  paddle.vx = (paddle.x - previousX) / Math.max(delta, 1 / 120);
}

function startGame() {
  if (gameState.status === "playing") {
    return;
  }

  const isLoopRunning = gameState.animationFrame !== 0;

  if (gameState.status === "gameover") {
    renderState.score.player = 0;
    renderState.score.ai = 0;
  }

  gameState.status = "playing";
  gameState.lastTime = performance.now();
  resetBall();

  if (!isLoopRunning) {
    gameState.animationFrame = requestAnimationFrame(updateGame);
  }
}

function resetBall() {
  Object.assign(renderState.ball, {
    x: BALL_START_X,
    y: BALL_START_Y,
    z: 1.15,
    vx: 0.74,
    vy: -6.6,
    vz: 3,
    spin: 0,
    hasCourtBounce: false,
    lastHitBy: "player"
  });
  gameState.message = "";
  gameState.ballSide = getBallSide(renderState.ball.y);
  gameState.bouncesOnSide = 0;
  aiState.targetX = renderState.aiPaddle.x;
  aiState.reactionTimer = 0;
  aiState.mistakeOffset = 0;
}

function updateGame(time) {
  const delta = Math.min(MAX_FRAME_DELTA, (time - gameState.lastTime) / 1000);

  gameState.lastTime = time;
  movePlayerPaddleTowardTarget(delta);
  if (gameState.status === "playing") {
    updateAiPaddle(delta);
    updateBall(delta);
  } else if (gameState.status === "point" && time >= gameState.pointResumeTime) {
    gameState.status = "playing";
    resetBall();
  }
  drawShell();
  gameState.animationFrame = requestAnimationFrame(updateGame);
}

function updateBall(delta) {
  const ball = renderState.ball;
  const previousY = ball.y;

  ball.vz -= BALL_GRAVITY * delta;
  ball.vx += ball.spin * BALL_SPIN_ACCELERATION * delta;
  ball.vx = clamp(ball.vx, -BALL_MAX_SIDE_SPEED, BALL_MAX_SIDE_SPEED);
  ball.spin *= BALL_SPIN_DECAY ** (delta * 60);
  ball.x += ball.vx * delta;
  ball.y += ball.vy * delta;
  ball.z += ball.vz * delta;

  trackBallSide(ball);
  handleCourtBounce(ball);
  if (gameState.status !== "playing") {
    return;
  }

  handleSideGlassCollision(ball);
  handleBackGlassCollision(ball);
  handleNetCollision(ball, previousY);
  if (gameState.status !== "playing") {
    return;
  }

  handlePaddleCollision(ball, renderState.playerPaddle, -1, previousY, "player");
  handlePaddleCollision(ball, renderState.aiPaddle, 1, previousY, "ai");
  handleDeadBall(ball);
}

function updateAiPaddle(delta) {
  const ball = renderState.ball;

  aiState.reactionTimer -= delta;
  if (aiState.reactionTimer <= 0) {
    aiState.targetX = getAiTargetX(ball);
    aiState.reactionTimer = AI_REACTION_INTERVAL + Math.abs(ball.vy) * 0.008;
  }

  const paddle = renderState.aiPaddle;
  const previousX = paddle.x;
  const maxStep = AI_MAX_SPEED * delta;
  const nextX = moveToward(paddle.x, aiState.targetX, maxStep);

  paddle.x = clampAiPaddleX(nextX);
  paddle.vx = (paddle.x - previousX) / Math.max(delta, 1 / 120);
}

function getAiTargetX(ball) {
  const ballMovingTowardAi = ball.vy < 0;
  const ballNearAiSide = ball.y < COURT_LENGTH_METERS * 0.68;

  if (!ballMovingTowardAi && !ballNearAiSide) {
    aiState.mistakeOffset = lerp(aiState.mistakeOffset, 0, 0.3);
    return moveToward(renderState.aiPaddle.x, COURT_WIDTH_METERS / 2, AI_CENTERING_SPEED);
  }

  const predictedX = predictBallXAtY(ball, AI_PADDLE_Y);
  const pressure = clamp(Math.abs(ball.vy) / 8.4, 0, 1);

  aiState.mistakeOffset = lerp(
    aiState.mistakeOffset,
    (Math.random() * 2 - 1) * AI_PREDICTION_ERROR * pressure,
    0.24
  );

  return clampAiPaddleX(predictedX + aiState.mistakeOffset);
}

function predictBallXAtY(ball, targetY) {
  if (Math.abs(ball.vy) < 0.01) {
    return ball.x;
  }

  const timeToTarget = Math.max(0, (targetY - ball.y) / ball.vy);
  let predictedX = ball.x + ball.vx * timeToTarget;
  const minX = ball.radius;
  const maxX = COURT_WIDTH_METERS - ball.radius;

  while (predictedX < minX || predictedX > maxX) {
    if (predictedX < minX) {
      predictedX = minX + (minX - predictedX);
    } else if (predictedX > maxX) {
      predictedX = maxX - (predictedX - maxX);
    }
  }

  return predictedX;
}

function handleCourtBounce(ball) {
  if (ball.z > 0) {
    return;
  }

  ball.z = 0;
  ball.hasCourtBounce = true;
  gameState.bouncesOnSide += 1;
  ball.vx *= BALL_FLOOR_FRICTION;
  ball.vy *= BALL_FLOOR_FRICTION;
  ball.vz = Math.max(BALL_MIN_BOUNCE_VELOCITY, Math.abs(ball.vz) * BALL_FLOOR_RESTITUTION);

  if (gameState.bouncesOnSide >= 2) {
    awardPoint(getOpponentSide(gameState.ballSide), "DOUBLE BOUNCE");
  }
}

function handleSideGlassCollision(ball) {
  if (!ball.hasCourtBounce) {
    return;
  }

  const minX = ball.radius;
  const maxX = COURT_WIDTH_METERS - ball.radius;

  if (ball.x < minX) {
    ball.x = minX;
    ball.vx = Math.abs(ball.vx) * BALL_WALL_RESTITUTION;
  } else if (ball.x > maxX) {
    ball.x = maxX;
    ball.vx = -Math.abs(ball.vx) * BALL_WALL_RESTITUTION;
  }
}

function handleBackGlassCollision(ball) {
  if (!ball.hasCourtBounce) {
    return;
  }

  const minY = ball.radius;
  const maxY = COURT_LENGTH_METERS - ball.radius;

  if (ball.y < minY) {
    ball.y = minY;
    ball.vy = Math.abs(ball.vy) * BALL_WALL_RESTITUTION;
  } else if (ball.y > maxY) {
    ball.y = maxY;
    ball.vy = -Math.abs(ball.vy) * BALL_WALL_RESTITUTION;
  }
}

function handleNetCollision(ball, previousY) {
  const crossedNet =
    (previousY < 10 && ball.y >= 10) || (previousY > 10 && ball.y <= 10);

  if (!crossedNet || ball.z > BALL_NET_HEIGHT) {
    return;
  }

  ball.y = previousY < 10 ? 9.7 : 10.3;
  ball.vy = -ball.vy * BALL_NET_RESTITUTION;
  ball.vx *= 0.58;
  ball.vz = Math.max(0.45, ball.vz * 0.42);
  awardPoint(getOpponentSide(ball.lastHitBy), "NET");
}

function handlePaddleCollision(ball, paddle, direction, previousY, hitter) {
  const crossedPaddle =
    direction < 0
      ? previousY < paddle.y && ball.y >= paddle.y
      : previousY > paddle.y && ball.y <= paddle.y;
  const halfWidth = paddle.width / 2;
  const withinPaddle = Math.abs(ball.x - paddle.x) <= halfWidth + ball.radius;
  const hittableHeight = ball.z <= PADDLE_REACH_HEIGHT;

  if (!crossedPaddle || !withinPaddle || !hittableHeight) {
    return;
  }

  const contact = clamp((ball.x - paddle.x) / halfWidth, -1, 1);
  const contactDirection = getPaddleContactDirection(contact);
  const spin = clamp(paddle.vx * PADDLE_SPIN_TRANSFER, -1.8, 1.8);

  ball.y = paddle.y + direction * (ball.radius + 0.06);
  ball.vx = clamp(
    contactDirection * 4.55 + spin * 0.72,
    -BALL_MAX_SIDE_SPEED,
    BALL_MAX_SIDE_SPEED
  );
  ball.vy = direction * (6.7 + Math.abs(contactDirection) * 1.25);
  ball.vz = BALL_PADDLE_LIFT;
  ball.spin = spin;
  ball.hasCourtBounce = false;
  ball.lastHitBy = hitter;
  gameState.ballSide = hitter;
  gameState.bouncesOnSide = 0;
}

function getPaddleContactDirection(contact) {
  const deadZone = 0.16;

  if (Math.abs(contact) < deadZone) {
    return 0;
  }

  const edgeAmount = (Math.abs(contact) - deadZone) / (1 - deadZone);
  return Math.sign(contact) * edgeAmount ** 0.78;
}

function handleDeadBall(ball) {
  const tooSlow =
    Math.hypot(ball.vx, ball.vy) < 0.55 && ball.z < 0.16 && Math.abs(ball.vz) < 1.35;
  const behindPlayer = ball.y > PLAYER_PADDLE_Y + 1.15;
  const behindAi = ball.y < AI_PADDLE_Y - 1.15;

  if (behindPlayer) {
    awardPoint("ai", "OUT");
  } else if (behindAi) {
    awardPoint("player", "OUT");
  } else if (tooSlow) {
    awardPoint(getOpponentSide(ball.lastHitBy), "DEAD BALL");
  }
}

function trackBallSide(ball) {
  const currentSide = getBallSide(ball.y);

  if (currentSide !== gameState.ballSide) {
    gameState.ballSide = currentSide;
    gameState.bouncesOnSide = 0;
  }
}

function getBallSide(yMeters) {
  return yMeters >= COURT_LENGTH_METERS / 2 ? "player" : "ai";
}

function getOpponentSide(side) {
  return side === "player" ? "ai" : "player";
}

function awardPoint(winner, reason) {
  if (gameState.status !== "playing") {
    return;
  }

  renderState.score[winner] += 1;
  gameState.message = winner === "player" ? "POINT" : "AI POINT";

  if (reason === "NET") {
    gameState.message = winner === "player" ? "NET - POINT" : "NET - AI POINT";
  }

  if (hasWinner()) {
    gameState.status = "gameover";
    gameState.message = renderState.score.player > renderState.score.ai ? "YOU WIN" : "AI WINS";
    return;
  }

  gameState.status = "point";
  gameState.pointResumeTime = performance.now() + POINT_RESET_DELAY_MS;
}

function hasWinner() {
  const highScore = Math.max(renderState.score.player, renderState.score.ai);
  const scoreDifference = Math.abs(renderState.score.player - renderState.score.ai);

  return highScore >= WINNING_SCORE && scoreDifference >= WIN_BY;
}

function drawShell() {
  const { width, height } = layout.viewport;

  context.clearRect(0, 0, width, height);
  drawBackground(width, height);
  drawGlassWalls();
  drawCourtSurface();
  drawCourtMarkings();
  drawNet();
  drawPaddle(renderState.aiPaddle);
  drawPaddle(renderState.playerPaddle);
  drawBall(renderState.ball);
  drawScore();
  if (gameState.status !== "playing") {
    drawOverlay();
  }
}

function drawBackground(width, height) {
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, width, height);
}

function drawCourtSurface() {
  const { x, y, width, height } = layout.court;

  context.save();
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(x, y, width, height);
  applyGlow(14, 0.95);
  context.lineWidth = 2.2;
  context.strokeRect(x, y, width, height);
  context.strokeRect(x + width * 0.004, y + height * 0.004, width * 0.992, height * 0.992);
  context.restore();
}

function drawGlassWalls() {
  const walls = getWallSegments();

  context.save();
  context.fillStyle = "rgba(255, 255, 255, 0.16)";
  context.shadowColor = "#fff";
  context.shadowBlur = 12;

  walls.forEach((wall) => {
    context.beginPath();
    context.moveTo(wall.innerStart.x, wall.innerStart.y);
    context.lineTo(wall.innerEnd.x, wall.innerEnd.y);
    context.lineTo(wall.outerEnd.x, wall.outerEnd.y);
    context.lineTo(wall.outerStart.x, wall.outerStart.y);
    context.closePath();
    context.fill();
  });

  applyGlow(16, 0.95);
  context.lineWidth = 1.8;

  walls.forEach((wall) => {
    drawScreenLine(wall.innerStart, wall.innerEnd);
    drawScreenLine(wall.outerStart, wall.outerEnd);
    drawScreenLine(wall.innerStart, wall.outerStart, 0.44);
    drawScreenLine(wall.innerEnd, wall.outerEnd, 0.44);
  });

  context.globalAlpha = 0.52;
  context.lineWidth = 1;
  walls.forEach((wall) => {
    for (let index = 1; index < 5; index += 1) {
      const amount = index / 5;
      drawScreenLine(
        lerpPoint(wall.innerStart, wall.innerEnd, amount),
        lerpPoint(wall.outerStart, wall.outerEnd, amount),
        0.38
      );
    }
  });

  context.restore();
}

function drawCourtMarkings() {
  context.save();
  applyGlow(10, 0.72);
  context.lineWidth = 1.2;

  drawProjectedLine(5, 0, 5, 20);
  drawProjectedLine(0, 6, 10, 6);
  drawProjectedLine(0, 14, 10, 14);
  drawProjectedLine(2.5, 0, 2.5, 20, 0.24);
  drawProjectedLine(7.5, 0, 7.5, 20, 0.24);

  context.restore();
}

function drawNet() {
  context.save();
  applyGlow(16, 0.88);
  context.lineWidth = 1.4;

  drawProjectedLine(0, 9.7, 10, 9.7);
  drawProjectedLine(0, 10.3, 10, 10.3);
  drawProjectedLine(0, 10, 10, 10);

  context.globalAlpha = 0.5;
  for (let x = 0.5; x < 10; x += 0.5) {
    drawProjectedLine(x, 9.7, x, 10.3);
  }

  for (let y = 9.85; y < 10.3; y += 0.15) {
    drawProjectedLine(0, y, 10, y, 0.35);
  }

  context.restore();
}

function drawPaddle(paddle) {
  const halfWidth = paddle.width / 2;
  const center = projectCourtPoint(paddle.x, paddle.y);
  const left = projectCourtPoint(paddle.x - halfWidth, paddle.y);
  const right = projectCourtPoint(paddle.x + halfWidth, paddle.y);
  const ballHeight = Math.max(0, renderState.ball.z);
  const heightOffset = getHeightScreenOffset(ballHeight);
  const paddleWidth = Math.abs(right.x - left.x);
  const paddleThickness = Math.max(7, layout.court.width * 0.028);
  const screenX = center.x - paddleWidth / 2;
  const screenY = center.y - heightOffset - paddleThickness / 2;

  context.save();
  context.globalAlpha = 0.26;
  context.fillStyle = PADDLE_SHADOW_COLOR;
  context.filter = `blur(${Math.max(3, paddleThickness * 0.45)}px)`;
  context.fillRect(
    center.x - paddleWidth / 2,
    center.y + paddleThickness * 0.08,
    paddleWidth,
    paddleThickness
  );
  context.restore();

  context.save();
  applyGlow(18, 1);
  context.fillRect(screenX, screenY, paddleWidth, paddleThickness);
  context.globalAlpha = 0.55;
  context.fillRect(
    screenX + paddleThickness * 0.22,
    screenY + paddleThickness * 0.22,
    paddleWidth - paddleThickness * 0.44,
    Math.max(1.5, paddleThickness * 0.18)
  );
  context.restore();
}

function drawBall(ball) {
  const center = projectCourtPoint(ball.x, ball.y);
  const heightOffset = getHeightScreenOffset(ball.z);
  const edge = projectCourtPoint(ball.x + ball.radius, ball.y);
  const radius = Math.max(4, Math.abs(edge.x - center.x) * (1 + ball.z * 0.08));

  context.save();
  context.globalAlpha = 0.24;
  context.filter = `blur(${Math.max(2.5, radius * 0.55)}px)`;
  context.beginPath();
  context.ellipse(
    center.x,
    center.y + radius * 0.35,
    radius * 1.2,
    radius * 0.42,
    0,
    0,
    Math.PI * 2
  );
  context.fillStyle = "#0b4f78";
  context.fill();
  context.restore();

  context.save();
  applyGlow(18, 1);
  context.beginPath();
  context.arc(center.x, center.y - heightOffset, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function getHeightScreenOffset(heightMeters) {
  return getCourtMeterScale() * heightMeters * BALL_HEIGHT_SCREEN_SCALE;
}

function drawScore() {
  const { width } = layout.viewport;
  const court = layout.court;
  const scoreFontSize = Math.max(
    16,
    Math.min(28, court.width * 0.1, court.y * 0.85)
  );

  context.save();
  applyGlow(10, 0.92);
  context.font = `${scoreFontSize}px monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    `${renderState.score.ai}  ${renderState.score.player}`,
    width / 2,
    Math.max(scoreFontSize / 2 + 2, court.y * 0.5)
  );
  context.restore();
}

function drawOverlay() {
  const court = layout.court;
  const center = projectCourtPoint(5, 16.35);
  const text = gameState.status === "gameover" ? `${gameState.message} / TAP` : gameState.message;

  context.save();
  applyGlow(8, 0.74);
  context.font = `${Math.max(12, Math.min(16, court.width * 0.05))}px monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, center.x, center.y);
  context.restore();
}

function drawReadyOverlay() {
  drawOverlay();
}

function drawProjectedLine(x1, y1, x2, y2, alpha = 1) {
  const start = projectCourtPoint(x1, y1);
  const end = projectCourtPoint(x2, y2);

  context.save();
  context.globalAlpha *= alpha;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.restore();
}

function drawScreenLine(start, end, alpha = 1) {
  context.save();
  context.globalAlpha *= alpha;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.restore();
}

function getWallSegments() {
  const { x, y, width, height } = layout.court;
  const wallDepth = Math.max(12, Math.min(width, height) * WALL_DEPTH_RATIO);

  return [
    {
      innerStart: { x, y },
      innerEnd: { x: x + width, y },
      outerStart: { x: x - wallDepth, y: y - wallDepth },
      outerEnd: { x: x + width + wallDepth, y: y - wallDepth }
    },
    {
      innerStart: { x: x + width, y },
      innerEnd: { x: x + width, y: y + height },
      outerStart: { x: x + width + wallDepth, y: y - wallDepth },
      outerEnd: { x: x + width + wallDepth, y: y + height + wallDepth }
    },
    {
      innerStart: { x: x + width, y: y + height },
      innerEnd: { x, y: y + height },
      outerStart: { x: x + width + wallDepth, y: y + height + wallDepth },
      outerEnd: { x: x - wallDepth, y: y + height + wallDepth }
    },
    {
      innerStart: { x, y: y + height },
      innerEnd: { x, y },
      outerStart: { x: x - wallDepth, y: y + height + wallDepth },
      outerEnd: { x: x - wallDepth, y: y - wallDepth }
    }
  ];
}

function projectCourtPoint(xMeters, yMeters) {
  const court = layout.court;
  const yRatio = yMeters / COURT_LENGTH_METERS;
  const xRatio = xMeters / COURT_WIDTH_METERS;

  return {
    x: court.x + xRatio * court.width,
    y: court.y + yRatio * court.height
  };
}

function getCourtMeterScale() {
  return layout.court.height / COURT_LENGTH_METERS;
}

function screenToCourtPoint(screenX, screenY) {
  const court = layout.court;

  return {
    x: ((screenX - court.x) / court.width) * COURT_WIDTH_METERS,
    y: ((screenY - court.y) / court.height) * COURT_LENGTH_METERS
  };
}

function clampPlayerPaddleX(xMeters) {
  const halfWidth = renderState.playerPaddle.width / 2;

  return clamp(xMeters, halfWidth, COURT_WIDTH_METERS - halfWidth);
}

function clampAiPaddleX(xMeters) {
  const halfWidth = renderState.aiPaddle.width / 2;

  return clamp(xMeters, halfWidth, COURT_WIDTH_METERS - halfWidth);
}

function applyGlow(blur, alpha) {
  context.strokeStyle = "#fff";
  context.fillStyle = "#fff";
  context.shadowColor = "#fff";
  context.shadowBlur = blur;
  context.globalAlpha = alpha;
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function moveToward(current, target, maxStep) {
  if (Math.abs(target - current) <= maxStep) {
    return target;
  }

  return current + Math.sign(target - current) * maxStep;
}

function lerpPoint(start, end, amount) {
  return {
    x: lerp(start.x, end.x, amount),
    y: lerp(start.y, end.y, amount)
  };
}

function preventGameGesture(event) {
  event.preventDefault();
}

function handlePointerInput(event) {
  if (
    inputState.activePointerId !== null &&
    event.pointerId !== inputState.activePointerId
  ) {
    return;
  }

  const courtPoint = screenToCourtPoint(event.clientX, event.clientY);
  inputState.targetX = clampPlayerPaddleX(courtPoint.x);
  queueInputRender();
}

function handlePointerDown(event) {
  event.preventDefault();
  inputState.activePointerId = event.pointerId;
  canvas.setPointerCapture?.(event.pointerId);
  handlePointerInput(event);
  startGame();
}

function handlePointerMove(event) {
  event.preventDefault();
  handlePointerInput(event);
}

function handlePointerEnd(event) {
  if (event.pointerId === inputState.activePointerId) {
    inputState.activePointerId = null;
    canvas.releasePointerCapture?.(event.pointerId);
  }
}

window.addEventListener("resize", queueResize);
window.addEventListener("orientationchange", queueResize);
window.visualViewport?.addEventListener("resize", queueResize);
canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", handlePointerEnd);
canvas.addEventListener("pointercancel", handlePointerEnd);
canvas.addEventListener("touchstart", preventGameGesture, { passive: false });
canvas.addEventListener("touchmove", preventGameGesture, { passive: false });
canvas.addEventListener("contextmenu", preventGameGesture);
window.addEventListener("gesturestart", preventGameGesture, { passive: false });

resizeCanvas();
