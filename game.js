"use strict";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const COURT_WIDTH_METERS = 10;
const COURT_LENGTH_METERS = 20;
const SERVICE_BOX_LENGTH = 6.95;
const SERVICE_LINE_TOP = COURT_LENGTH_METERS / 2 - SERVICE_BOX_LENGTH;
const SERVICE_LINE_BOTTOM = COURT_LENGTH_METERS / 2 + SERVICE_BOX_LENGTH;
const COURT_ASPECT_RATIO = COURT_WIDTH_METERS / COURT_LENGTH_METERS;
const MIN_COURT_MARGIN = 30;
const MAX_DEVICE_PIXEL_RATIO = 3;
const BACKGROUND_COLOR = "#1E8FD5";
const SIDE_WALL_LENGTH = COURT_LENGTH_METERS / 2 * 0.4;
const PLAYER_PADDLE_Y = 18.35;
const AI_PADDLE_Y = 1.65;
const PADDLE_HALF_COURT_MARGIN = 0.55;
const PLAYER_PADDLE_WIDTH = 2.2;
const PLAYER_MOBILE_PADDLE_WIDTH = 2.58;
const AI_PADDLE_WIDTH = 1.95;
const PADDLE_SMOOTHING = 0.35;
const BALL_START_X = 5;
const BALL_RADIUS = 0.16;
const BALL_GRAVITY = 9.81;
const BALL_FLOOR_RESTITUTION = 0.72;
const BALL_FLOOR_FRICTION = 0.985;
const SHOT_TARGET_Y = 4;
const BALL_MIN_BOUNCE_VELOCITY = 1.25;
const BALL_NET_HEIGHT = 0.42;
const BALL_NET_RESTITUTION = 0.36;
const BALL_WALL_RESTITUTION = 0.84;
const BALL_AIR_WALL_RESTITUTION = 0.42;
const BALL_PADDLE_STROKE_ACCELERATION = 0.58;
const BALL_MAX_SIDE_SPEED = 5.4;
const BALL_SPEED_RAMP_PER_HIT = 0.22;
const BALL_MAX_RALLY_SPEED_BONUS = 2.2;
const BALL_SPIN_ACCELERATION = 1.45;
const BALL_SPIN_DECAY = 0.92;
const PADDLE_REACH_HEIGHT = 6.25;
const PADDLE_COLLISION_DEPTH = 0.42;
const BALL_START_Y = PLAYER_PADDLE_Y - PADDLE_COLLISION_DEPTH - BALL_RADIUS - 0.03;
const PADDLE_SPIN_TRANSFER = 0.34;
const SHADOW_HEIGHT_OFFSET_SCALE = 0.3;
const BALL_TRAIL_MAX_POINTS = 12;
const BALL_TRAIL_LIFETIME = 0.28;
const HIT_FLASH_LIFETIME = 0.24;
const HIT_PARTICLE_LIFETIME = 0.36;
const HIT_PARTICLE_COUNT = 8;
const SOUND_MASTER_VOLUME = 0.18;
const MAX_FRAME_DELTA = 1 / 30;
const POINT_RESET_DELAY_MS = 900;
const WINNING_SCORE = 4;
const WIN_BY = 2;
const AI_MAX_SPEED = 6.25;
const AI_REACTION_INTERVAL = 0.14;
const AI_CENTERING_SPEED = 1.25;
const AI_PREDICTION_ERROR = 0.42;

const renderState = {
  score: {
    player: 0,
    ai: 0
  },
  games: { player: 0, ai: 0 },
  playerPaddle: {
    x: 5,
    y: PLAYER_PADDLE_Y,
    width: PLAYER_PADDLE_WIDTH,
    vx: 0,
    vy: 0
  },
  aiPaddle: {
    x: 5,
    y: AI_PADDLE_Y,
    width: AI_PADDLE_WIDTH,
    vx: 0,
    vy: 0
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
    isServe: true,
    lastHitBy: "player"
  },
  ballTrail: [],
  hitEffects: []
};

const inputState = {
  activePointerId: null,
  targetX: renderState.playerPaddle.x,
  targetY: renderState.playerPaddle.y,
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
  bouncesOnSide: 0,
  rallyHits: 0,
  server: "player",
  serveAttempt: 1
};

const audioState = {
  context: null,
  masterGain: null,
  unlocked: false
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
  const paddleSpaceRatio = 1 + 2 * PLAYER_MOBILE_PADDLE_WIDTH / COURT_WIDTH_METERS;
  const safeWidth = Math.max(0, Math.min(width - courtMargin * 2, (width - 16) / paddleSpaceRatio));
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
  inputState.targetY = clampPlayerPaddleY(inputState.targetY);
  renderState.playerPaddle.x = clampPlayerPaddleX(renderState.playerPaddle.x);
  renderState.playerPaddle.y = clampPlayerPaddleY(renderState.playerPaddle.y);
  renderState.aiPaddle.x = clampAiPaddleX(renderState.aiPaddle.x);
  renderState.aiPaddle.y = clampAiPaddleY(renderState.aiPaddle.y);
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

  if (
    renderState.playerPaddle.x !== inputState.targetX ||
    renderState.playerPaddle.y !== inputState.targetY
  ) {
    queueInputRender();
  }
}

function movePlayerPaddleTowardTarget(delta = 1 / 60) {
  const paddle = renderState.playerPaddle;
  const previousX = paddle.x;
  const previousY = paddle.y;
  const nextX = lerp(paddle.x, inputState.targetX, PADDLE_SMOOTHING);
  const nextY = lerp(paddle.y, inputState.targetY, PADDLE_SMOOTHING);

  paddle.x = clampPlayerPaddleX(
    Math.abs(nextX - inputState.targetX) < 0.01 ? inputState.targetX : nextX
  );
  paddle.y = clampPlayerPaddleY(
    Math.abs(nextY - inputState.targetY) < 0.01 ? inputState.targetY : nextY
  );
  paddle.vx = (paddle.x - previousX) / Math.max(delta, 1 / 120);
  paddle.vy = (paddle.y - previousY) / Math.max(delta, 1 / 120);
}

function startGame() {
  if (gameState.status === "playing" || gameState.status === "point") {
    return;
  }

  const isLoopRunning = gameState.animationFrame !== 0;

  if (gameState.status === "gameover") {
    renderState.score.player = 0;
    renderState.score.ai = 0;
    gameState.server = getOpponentSide(gameState.server);
    gameState.serveAttempt = 1;
  }

  gameState.status = "playing";
  gameState.lastTime = performance.now();
  resetBall();

  if (!isLoopRunning) {
    gameState.animationFrame = requestAnimationFrame(updateGame);
  }
}

function getServiceSetup() {
  const fromRight = (renderState.score.player + renderState.score.ai) % 2 === 0;
  const direction = gameState.server === "player" ? -1 : 1;
  const x = (fromRight === (direction === -1)) ? 7.5 : 2.5;
  return {
    x,
    y: direction === -1 ? PLAYER_PADDLE_Y : AI_PADDLE_Y,
    targetX: COURT_WIDTH_METERS - x,
    targetY: direction === -1 ? 6 : 14,
    direction
  };
}

function isInServiceBox(ball) {
  const { targetX, direction } = getServiceSetup();
  const lineTolerance = 0.025;
  const minX = targetX < 5 ? 0 : 5;
  const maxX = targetX < 5 ? 5 : 10;
  const minY = direction < 0 ? SERVICE_LINE_TOP : 10;
  const maxY = direction < 0 ? 10 : SERVICE_LINE_BOTTOM;
  return ball.x >= minX - lineTolerance && ball.x <= maxX + lineTolerance &&
    ball.y >= minY - lineTolerance && ball.y <= maxY + lineTolerance;
}

function resetBall() {
  const setup = getServiceSetup();
  const paddle = gameState.server === "player" ? renderState.playerPaddle : renderState.aiPaddle;
  Object.assign(paddle, { x: setup.x, y: setup.y, vx: 0, vy: 0 });
  if (gameState.server === "player") {
    inputState.targetX = setup.x;
    inputState.targetY = setup.y;
  }
  Object.assign(renderState.ball, {
    x: paddle.x,
    y: paddle.y + setup.direction * (PADDLE_COLLISION_DEPTH + BALL_RADIUS + 0.03),
    z: 0.85,
    vx: 0,
    vy: setup.direction * 6.6,
    vz: 0,
    spin: 0,
    hasCourtBounce: false,
    isServe: true,
    lastHitBy: gameState.server
  });
  const ball = renderState.ball;
  const flightTime = Math.abs((setup.targetY - ball.y) / ball.vy);
  ball.vx = (setup.targetX - ball.x) / flightTime;
  ball.vz = (0.5 * BALL_GRAVITY * flightTime ** 2 - ball.z) / flightTime;
  gameState.message = "";
  gameState.ballSide = getBallSide(renderState.ball.y);
  gameState.bouncesOnSide = 0;
  gameState.rallyHits = 0;
  renderState.ballTrail = [];
  renderState.hitEffects = [];
  addHitFlash(renderState.ball.x, renderState.ball.y, renderState.ball.z, 1);
  addHitParticles(renderState.ball.x, renderState.ball.y, renderState.ball.z, setup.direction, 0);
  playSound("paddle", 0.65);
  aiState.targetX = renderState.aiPaddle.x;
  aiState.reactionTimer = 0;
  aiState.mistakeOffset = 0;
}

function updateGame(time) {
  const delta = clamp((time - gameState.lastTime) / 1000, 0, MAX_FRAME_DELTA);

  gameState.lastTime = time;
  movePlayerPaddleTowardTarget(delta);
  if (gameState.status === "playing") {
    updateAiPaddle(delta);
    updateBall(delta);
  } else if (gameState.status === "point" && time >= gameState.pointResumeTime) {
    gameState.status = "playing";
    resetBall();
  }
  updateVisualEffects(delta);
  drawShell();
  gameState.animationFrame = requestAnimationFrame(updateGame);
}

function updateBall(delta) {
  const ball = renderState.ball;
  const previousX = ball.x;
  const previousY = ball.y;

  ball.z += ball.vz * delta - 0.5 * BALL_GRAVITY * delta * delta;
  ball.vz -= BALL_GRAVITY * delta;
  ball.vx += ball.spin * BALL_SPIN_ACCELERATION * delta;
  ball.vx = clamp(ball.vx, -BALL_MAX_SIDE_SPEED, BALL_MAX_SIDE_SPEED);
  ball.spin *= BALL_SPIN_DECAY ** (delta * 60);
  ball.x += ball.vx * delta;
  ball.y += ball.vy * delta;

  trackBallSide(ball);
  handleCourtBounce(ball);
  if (gameState.status !== "playing") {
    return;
  }

  handleSideGlassCollision(ball);
  if (gameState.status !== "playing") return;
  handleBackGlassCollision(ball);
  if (gameState.status !== "playing") return;
  handleNetCollision(ball, previousY);
  if (gameState.status !== "playing") {
    return;
  }

  handlePaddleCollision(ball, renderState.playerPaddle, -1, previousX, previousY, "player");
  handlePaddleCollision(ball, renderState.aiPaddle, 1, previousX, previousY, "ai");
  recordBallTrail(ball);
  handleDeadBall(ball);
}

function updateVisualEffects(delta) {
  renderState.ballTrail.forEach((trailPoint) => {
    trailPoint.age += delta;
  });
  renderState.hitEffects.forEach((effect) => {
    effect.age += delta;
    effect.x += effect.vx * delta;
    effect.y += effect.vy * delta;
    effect.z = Math.max(0, effect.z + effect.vz * delta);
    effect.vz -= BALL_GRAVITY * delta * 0.34;
  });

  renderState.ballTrail = renderState.ballTrail.filter(
    (trailPoint) => trailPoint.age < trailPoint.life
  );
  renderState.hitEffects = renderState.hitEffects.filter((effect) => effect.age < effect.life);
}

function recordBallTrail(ball) {
  const previousPoint = renderState.ballTrail[renderState.ballTrail.length - 1];
  const hasMovedEnough =
    !previousPoint || Math.hypot(ball.x - previousPoint.x, ball.y - previousPoint.y) > 0.18;

  if (!hasMovedEnough) {
    return;
  }

  renderState.ballTrail.push({
    x: ball.x,
    y: ball.y,
    z: ball.z,
    radius: ball.radius,
    age: 0,
    life: BALL_TRAIL_LIFETIME
  });

  if (renderState.ballTrail.length > BALL_TRAIL_MAX_POINTS) {
    renderState.ballTrail.shift();
  }
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
  const previousY = paddle.y;
  const maxStep = AI_MAX_SPEED * delta;
  const nextX = moveToward(paddle.x, aiState.targetX, maxStep);
  const waitingForServeBounce = ball.isServe && !ball.hasCourtBounce && gameState.server === "player";
  const targetY = waitingForServeBounce ? 4.8 : ball.vy < 0 ? clampAiPaddleY(ball.y + 0.45) : AI_PADDLE_Y;
  const nextY = moveToward(paddle.y, targetY, maxStep * 0.46);

  paddle.x = clampAiPaddleX(nextX);
  paddle.y = clampAiPaddleY(nextY);
  paddle.vx = (paddle.x - previousX) / Math.max(delta, 1 / 120);
  paddle.vy = (paddle.y - previousY) / Math.max(delta, 1 / 120);
}

function getAiTargetX(ball) {
  const ballMovingTowardAi = ball.vy < 0;
  const ballNearAiSide = ball.y < COURT_LENGTH_METERS * 0.68;

  if (!ballMovingTowardAi && !ballNearAiSide) {
    aiState.mistakeOffset = lerp(aiState.mistakeOffset, 0, 0.3);
    return moveToward(renderState.aiPaddle.x, COURT_WIDTH_METERS / 2, AI_CENTERING_SPEED);
  }

  // Aim where the paddle is intercepting, including its forward movement.
  const predictedX = predictBallXAtY(ball, renderState.aiPaddle.y);
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
  if (ball.isServe && !ball.hasCourtBounce && !isInServiceBox(ball)) {
    awardPoint(getOpponentSide(ball.lastHitBy), "SERVICE BOX");
    return;
  }
  if (getBallSide(ball.y) === ball.lastHitBy && !ball.hasCourtBounce) {
    awardPoint(getOpponentSide(ball.lastHitBy), "OWN COURT");
    return;
  }
  ball.hasCourtBounce = true;
  gameState.bouncesOnSide += 1;
  ball.vx *= BALL_FLOOR_FRICTION;
  ball.vy *= BALL_FLOOR_FRICTION;
  ball.vz = Math.max(BALL_MIN_BOUNCE_VELOCITY, Math.abs(ball.vz) * BALL_FLOOR_RESTITUTION);
  addHitFlash(ball.x, ball.y, 0, 0.72);
  playSound("bounce", clamp(Math.abs(ball.vz) / 8, 0.35, 1));

  if (gameState.bouncesOnSide >= 2) {
    awardPoint(ball.lastHitBy, "DOUBLE BOUNCE");
  }
}

function handleSideGlassCollision(ball) {
  const minX = ball.radius;
  const maxX = COURT_WIDTH_METERS - ball.radius;
  const restitution = getWallRestitution(ball);
  if (ball.x < minX || ball.x > maxX) {
    ball.x = clamp(ball.x, minX, maxX);
    const isFence = ball.y > SIDE_WALL_LENGTH && ball.y < COURT_LENGTH_METERS - SIDE_WALL_LENGTH;
    if (handleBoundaryFault(ball, isFence)) return;
    ball.vx = (ball.x === minX ? 1 : -1) * Math.abs(ball.vx) * restitution;
    ball.spin *= 0.42;
    addHitFlash(ball.x, ball.y, ball.z, 0.58);
    playSound("wall", clamp(Math.abs(ball.vx) / 5, 0.32, 1));
  }
}

function handleBackGlassCollision(ball) {
  const minY = ball.radius;
  const maxY = COURT_LENGTH_METERS - ball.radius;
  const restitution = getWallRestitution(ball);

  if (ball.y < minY) {
    ball.y = minY;
    if (handleBoundaryFault(ball, false)) return;
    ball.vy = Math.abs(ball.vy) * restitution;
    ball.vx *= 0.78;
    addHitFlash(ball.x, ball.y, ball.z, 0.62);
    playSound("wall", clamp(Math.abs(ball.vy) / 7, 0.36, 1));
  } else if (ball.y > maxY) {
    ball.y = maxY;
    if (handleBoundaryFault(ball, false)) return;
    ball.vy = -Math.abs(ball.vy) * restitution;
    ball.vx *= 0.78;
    addHitFlash(ball.x, ball.y, ball.z, 0.62);
    playSound("wall", clamp(Math.abs(ball.vy) / 7, 0.36, 1));
  }
}

function handleBoundaryFault(ball, isFence) {
  // FIP: mesh is legal after the opposing floor bounce, except on serve.
  if (isFence && (ball.isServe || !ball.hasCourtBounce)) {
    awardPoint(getOpponentSide(ball.lastHitBy), "FENCE");
    return true;
  }
  if (getBallSide(ball.y) !== ball.lastHitBy && !ball.hasCourtBounce) {
    awardPoint(getOpponentSide(ball.lastHitBy), "WALL BEFORE BOUNCE");
    return true;
  }
  return false;
}

function getWallRestitution(ball) {
  return ball.hasCourtBounce ? BALL_WALL_RESTITUTION : BALL_AIR_WALL_RESTITUTION;
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
  ball.vz = Math.max(0.68, Math.abs(ball.vz) * 0.36);
  addHitFlash(ball.x, ball.y, BALL_NET_HEIGHT, 0.9);
  playSound("net", 0.9);
  awardPoint(getOpponentSide(ball.lastHitBy), "NET");
}

function handlePaddleCollision(ball, paddle, direction, previousX, previousY, hitter) {
  const pathMinY = Math.min(previousY, ball.y) - ball.radius;
  const pathMaxY = Math.max(previousY, ball.y) + ball.radius;
  const paddleBand = PADDLE_COLLISION_DEPTH + ball.radius;
  const crossedPaddle =
    paddle.y >= pathMinY - paddleBand && paddle.y <= pathMaxY + paddleBand;
  const ballMovingIntoPaddle = ball.vy * direction < 0;
  const impactAmount =
    Math.abs(ball.y - previousY) < 0.001
      ? 1
      : clamp((paddle.y - previousY) / (ball.y - previousY), 0, 1);
  const impactX = lerp(previousX, ball.x, impactAmount);
  const halfWidth = paddle.width / 2;
  // Paddles automatically follow ball height; only court position determines reach.
  const withinPaddle = Math.abs(impactX - paddle.x) <= halfWidth + ball.radius;

  if (!crossedPaddle || !withinPaddle || !ballMovingIntoPaddle || ball.lastHitBy === hitter) {
    return;
  }

  if (ball.isServe && !ball.hasCourtBounce) {
    awardPoint(ball.lastHitBy, "SERVE VOLLEY");
    return;
  }

  const contact = clamp((impactX - paddle.x) / halfWidth, -1, 1);
  const contactDirection = getPaddleContactDirection(contact);
  const spin = clamp(paddle.vx * PADDLE_SPIN_TRANSFER, -1.8, 1.8);
  const rallySpeedBonus = getRallySpeedBonus();
  const strokeSpeedBonus = getPaddleStrokeSpeedBonus(paddle, direction);

  ball.x = impactX;
  ball.y = paddle.y + direction * (paddleBand + 0.03);
  ball.vx = clamp(
    contactDirection * (4.55 + rallySpeedBonus * 0.22) + spin * 0.72,
    -BALL_MAX_SIDE_SPEED,
    BALL_MAX_SIDE_SPEED
  );
  ball.vy =
    direction *
    Math.max(4.25, 6.7 + rallySpeedBonus + strokeSpeedBonus + Math.abs(contactDirection) * 1.25);
  ball.vz = getShotLift(ball, direction);
  ball.spin = spin;
  ball.hasCourtBounce = false;
  ball.isServe = false;
  ball.lastHitBy = hitter;
  gameState.ballSide = hitter;
  gameState.bouncesOnSide = 0;
  gameState.rallyHits += 1;
  addHitFlash(ball.x, paddle.y, Math.max(0.5, ball.z), 1);
  addHitParticles(ball.x, paddle.y, Math.max(0.5, ball.z), direction, contact);
  playSound("paddle", clamp(Math.abs(ball.vy) / 9, 0.45, 1));
}

function getRallySpeedBonus() {
  return Math.min(
    BALL_MAX_RALLY_SPEED_BONUS,
    gameState.rallyHits * BALL_SPEED_RAMP_PER_HIT
  );
}

// Aim for a floor bounce in the opposing rear court under constant gravity.
function getShotLift(ball, direction) {
  const targetY = direction < 0 ? SHOT_TARGET_Y : COURT_LENGTH_METERS - SHOT_TARGET_Y;
  const flightTime = Math.max(0.35, Math.abs(targetY - ball.y) / Math.abs(ball.vy));
  return (0.5 * BALL_GRAVITY * flightTime * flightTime - ball.z) / flightTime;
}

function getPaddleStrokeSpeedBonus(paddle, direction) {
  return clamp(
    paddle.vy * direction * BALL_PADDLE_STROKE_ACCELERATION,
    -1.8,
    1.8
  );
}

function addHitFlash(x, y, z, intensity) {
  renderState.hitEffects.push({
    type: "flash",
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    intensity,
    age: 0,
    life: HIT_FLASH_LIFETIME
  });
}

function addHitParticles(x, y, z, direction, contact) {
  for (let index = 0; index < HIT_PARTICLE_COUNT; index += 1) {
    const spread = (index / (HIT_PARTICLE_COUNT - 1) - 0.5) * 2;
    const speed = 1.3 + Math.random() * 1.9;

    renderState.hitEffects.push({
      type: "particle",
      x,
      y,
      z,
      vx: (spread + contact * 0.8) * speed,
      vy: direction * (0.9 + Math.random() * 1.35),
      vz: 1.4 + Math.random() * 1.9,
      intensity: 0.75 + Math.random() * 0.25,
      age: 0,
      life: HIT_PARTICLE_LIFETIME
    });
  }
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

  if (tooSlow) {
    awardPoint(getOpponentSide(ball.lastHitBy), "DEAD BALL");
  }
}

function trackBallSide(ball) {
  const currentSide = getBallSide(ball.y);

  if (currentSide !== gameState.ballSide) {
    gameState.ballSide = currentSide;
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

  if (renderState.ball.isServe && winner !== gameState.server &&
      ["SERVICE BOX", "FENCE", "WALL BEFORE BOUNCE", "OWN COURT", "NET"].includes(reason) &&
      gameState.serveAttempt === 1) {
    gameState.serveAttempt = 2;
    gameState.status = "point";
    gameState.message = "SECOND SERVE";
    gameState.pointResumeTime = performance.now() + POINT_RESET_DELAY_MS;
    return;
  }
  gameState.serveAttempt = 1;
  renderState.score[winner] += 1;
  gameState.message = winner === "player" ? "POINT" : "AI POINT";
  playSound(winner === "player" ? "point" : "miss", 0.9);

  if (reason === "NET") {
    gameState.message = winner === "player" ? "NET - POINT" : "NET - AI POINT";
  }

  if (hasWinner()) {
    renderState.games[winner] += 1;
    gameState.status = "gameover";
    gameState.message = winner === "player" ? "GAME - YOU" : "GAME - AI";
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

function unlockAudio() {
  if (audioState.unlocked) {
    return;
  }

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    audioState.unlocked = true;
    return;
  }

  if (!audioState.context) {
    audioState.context = new AudioContextConstructor();
    audioState.masterGain = audioState.context.createGain();
    audioState.masterGain.gain.value = SOUND_MASTER_VOLUME;
    audioState.masterGain.connect(audioState.context.destination);
  }

  audioState.context.resume?.();
  audioState.unlocked = true;
  playSound("start", 0.45);
}

function playSound(name, intensity = 1) {
  const audioContext = audioState.context;
  if (!audioState.unlocked || !audioContext || !audioState.masterGain) {
    return;
  }

  if (audioContext.state === "suspended") {
    audioContext.resume?.();
  }

  const sound = getSoundCue(name, intensity);
  if (!sound) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = sound.type;
  oscillator.frequency.setValueAtTime(sound.frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(sound.endFrequency, now + sound.duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(sound.volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + sound.duration);
  oscillator.connect(gain);
  gain.connect(audioState.masterGain);
  oscillator.start(now);
  oscillator.stop(now + sound.duration + 0.02);
}

function getSoundCue(name, intensity) {
  const amount = clamp(intensity, 0, 1);
  const cues = {
    start: { type: "sine", frequency: 520, endFrequency: 780, duration: 0.08, volume: 0.24 },
    paddle: {
      type: "triangle",
      frequency: 360 + amount * 170,
      endFrequency: 760 + amount * 240,
      duration: 0.075,
      volume: 0.34 + amount * 0.2
    },
    bounce: {
      type: "sine",
      frequency: 250 + amount * 70,
      endFrequency: 120 + amount * 50,
      duration: 0.055,
      volume: 0.2 + amount * 0.12
    },
    wall: {
      type: "square",
      frequency: 170 + amount * 55,
      endFrequency: 90 + amount * 30,
      duration: 0.045,
      volume: 0.14 + amount * 0.1
    },
    net: { type: "sawtooth", frequency: 130, endFrequency: 70, duration: 0.12, volume: 0.22 },
    point: { type: "sine", frequency: 640, endFrequency: 980, duration: 0.16, volume: 0.28 },
    miss: { type: "triangle", frequency: 220, endFrequency: 120, duration: 0.18, volume: 0.2 }
  };

  return cues[name];
}

function drawShell() {
  const { width, height } = layout.viewport;

  context.clearRect(0, 0, width, height);
  drawBackground(width, height);
  drawCourtSurface();
  drawGlassWalls();
  drawCourtMarkings();
  drawNet();
  drawPaddle(renderState.aiPaddle);
  drawPaddle(renderState.playerPaddle);
  drawBallTrail();
  drawBall(renderState.ball);
  drawHitEffects();
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
  context.restore();
}

function drawGlassWalls() {
  context.save();
  applyGlow(16, 0.95);
  context.lineWidth = 2;
  drawProjectedLine(0, 0, COURT_WIDTH_METERS, 0);
  drawProjectedLine(0, COURT_LENGTH_METERS, COURT_WIDTH_METERS, COURT_LENGTH_METERS);

  for (const x of [0, COURT_WIDTH_METERS]) {
    drawProjectedLine(x, 0, x, SIDE_WALL_LENGTH);
    drawProjectedLine(x, COURT_LENGTH_METERS - SIDE_WALL_LENGTH, x, COURT_LENGTH_METERS);
    context.save();
    context.lineCap = "round";
    context.setLineDash([1, 6]);
    drawProjectedLine(x, SIDE_WALL_LENGTH, x, COURT_LENGTH_METERS - SIDE_WALL_LENGTH);
    context.restore();
  }
  context.restore();
}

function drawCourtMarkings() {
  context.save();
  applyGlow(10, 0.72);
  context.lineWidth = Math.max(1, getCourtMeterScale() * 0.05);
  drawProjectedLine(0, SERVICE_LINE_TOP, 10, SERVICE_LINE_TOP);
  drawProjectedLine(0, SERVICE_LINE_BOTTOM, 10, SERVICE_LINE_BOTTOM);
  drawProjectedLine(5, SERVICE_LINE_TOP - 0.2, 5, SERVICE_LINE_BOTTOM + 0.2);
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
  const paddleWidth = Math.abs(right.x - left.x);
  const paddleThickness = Math.max(7, layout.court.width * 0.028);
  const screenX = center.x - paddleWidth / 2;
  const screenY = center.y - paddleThickness / 2;
  context.save();
  applyGlow(20, 0.78);
  context.fillRect(screenX, screenY, paddleWidth, paddleThickness);
  context.shadowBlur = 4;
  context.globalAlpha = 1;
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

function drawBallTrail() {
  renderState.ballTrail.forEach((trailPoint) => {
    const center = projectCourtPoint(trailPoint.x, trailPoint.y);
    const edge = projectCourtPoint(trailPoint.x + trailPoint.radius, trailPoint.y);
    const progress = trailPoint.age / trailPoint.life;
    const radius = Math.max(3, Math.abs(edge.x - center.x));

    context.save();
    applyGlow(16, (1 - progress) * 0.34);
    context.beginPath();
    context.arc(
      center.x,
      center.y,
      radius * (1.45 - progress * 0.35),
      0,
      Math.PI * 2
    );
    context.fill();
    context.restore();
  });
}

function drawBall(ball) {
  const center = projectCourtPoint(ball.x, ball.y);
  const edge = projectCourtPoint(ball.x + ball.radius, ball.y);
  const radius = Math.max(4, Math.abs(edge.x - center.x));
  const heightRatio = clamp(ball.z / PADDLE_REACH_HEIGHT, 0, 1);
  const shadowBlur = Math.max(2.5, radius * (0.45 + heightRatio * 1.8));
  const shadowScale = 1.05 + heightRatio * 1.35;
  const shadowOffset = getHeightShadowOffset(ball.z);

  context.save();
  context.globalAlpha = 0.58 - heightRatio * 0.24;
  context.filter = `blur(${shadowBlur}px)`;
  context.beginPath();
  context.ellipse(
    center.x + shadowOffset.x,
    center.y + shadowOffset.y,
    radius * shadowScale,
    radius * (0.48 + heightRatio * 0.32),
    0,
    0,
    Math.PI * 2
  );
  context.fillStyle = "#052d46";
  context.fill();
  context.restore();

  context.save();
  applyGlow(24, 0.82);
  context.beginPath();
  context.arc(center.x, center.y, radius * 1.14, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 5;
  context.globalAlpha = 1;
  context.beginPath();
  context.arc(center.x, center.y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawHitEffects() {
  renderState.hitEffects.forEach((effect) => {
    if (effect.type === "flash") {
      drawHitFlash(effect);
    } else {
      drawHitParticle(effect);
    }
  });
}

function drawHitFlash(effect) {
  const center = projectCourtPoint(effect.x, effect.y);
  const progress = effect.age / effect.life;
  const radius = getCourtMeterScale() * (0.2 + progress * 0.7) * effect.intensity;

  context.save();
  applyGlow(18, (1 - progress) * 0.62 * effect.intensity);
  context.lineWidth = Math.max(1.2, getCourtMeterScale() * 0.035);
  context.beginPath();
  context.arc(center.x, center.y, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawHitParticle(effect) {
  const center = projectCourtPoint(effect.x, effect.y);
  const progress = effect.age / effect.life;
  const radius = Math.max(1.2, getCourtMeterScale() * 0.045 * (1 - progress));

  context.save();
  applyGlow(12, (1 - progress) * 0.72 * effect.intensity);
  context.beginPath();
  context.arc(center.x, center.y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function getScoreLabel(side) {
  const own = renderState.score[side];
  const other = renderState.score[getOpponentSide(side)];
  if (hasWinner() && own > other) return "GAME";
  if (own >= 3 && other >= 3) return own > other ? "AD" : "40";
  return ["0", "15", "30", "40"][Math.min(own, 3)];
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
    `${getScoreLabel("ai")} : ${getScoreLabel("player")}${renderState.score.ai >= 3 && renderState.score.ai === renderState.score.player ? " DEUCE" : ""}`,
    width / 2,
    Math.max(scoreFontSize / 2 + 2, court.y * 0.5)
  );
  context.font = `${Math.max(12, scoreFontSize * 0.55)}px monospace`;
  context.fillText(`AI ${renderState.games.ai} : ${renderState.games.player} YOU · GAMES`,
    width / 2, court.y + court.height + 20);
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

function getHeightShadowOffset(heightMeters) {
  const offset = getCourtMeterScale() * Math.max(0, heightMeters) * SHADOW_HEIGHT_OFFSET_SCALE;

  return {
    x: offset,
    y: offset
  };
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

  return clamp(xMeters, -halfWidth + BALL_RADIUS, COURT_WIDTH_METERS + halfWidth - BALL_RADIUS);
}

function clampPlayerPaddleY(yMeters) {
  return clamp(
    yMeters,
    COURT_LENGTH_METERS / 2 + PADDLE_HALF_COURT_MARGIN,
    COURT_LENGTH_METERS - PADDLE_HALF_COURT_MARGIN
  );
}

function clampAiPaddleX(xMeters) {
  const halfWidth = renderState.aiPaddle.width / 2;

  return clamp(xMeters, -halfWidth + BALL_RADIUS, COURT_WIDTH_METERS + halfWidth - BALL_RADIUS);
}

function clampAiPaddleY(yMeters) {
  return clamp(
    yMeters,
    PADDLE_HALF_COURT_MARGIN,
    COURT_LENGTH_METERS / 2 - PADDLE_HALF_COURT_MARGIN
  );
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
  inputState.targetY = clampPlayerPaddleY(courtPoint.y);
  queueInputRender();
}

function handlePointerDown(event) {
  event.preventDefault();
  unlockAudio();
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
