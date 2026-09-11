"use strict";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const COURT_WIDTH_METERS = 10;
const COURT_LENGTH_METERS = 20;
const COURT_ASPECT_RATIO = COURT_WIDTH_METERS / COURT_LENGTH_METERS;
const MIN_COURT_MARGIN = 30;
const MAX_DEVICE_PIXEL_RATIO = 3;
const BACKGROUND_COLOR = "#1E8FD5";
const WALL_DEPTH_RATIO = 0.075;
const PLAYER_PADDLE_Y = 18.35;
const PADDLE_SMOOTHING = 0.35;

const renderState = {
  score: {
    player: 0,
    ai: 0
  },
  playerPaddle: {
    x: 5,
    y: PLAYER_PADDLE_Y,
    width: 2.15
  },
  aiPaddle: {
    x: 5,
    y: 1.65,
    width: 1.9
  },
  ball: {
    x: 5.35,
    y: 12.25,
    radius: 0.16
  }
};

const inputState = {
  activePointerId: null,
  targetX: renderState.playerPaddle.x,
  smoothingFrame: 0
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
  if (inputState.smoothingFrame !== 0) {
    return;
  }

  inputState.smoothingFrame = requestAnimationFrame(updatePlayerPaddle);
}

function updatePlayerPaddle() {
  inputState.smoothingFrame = 0;

  const paddle = renderState.playerPaddle;
  const nextX = lerp(paddle.x, inputState.targetX, PADDLE_SMOOTHING);

  paddle.x = clampPlayerPaddleX(
    Math.abs(nextX - inputState.targetX) < 0.01 ? inputState.targetX : nextX
  );
  drawShell();

  if (paddle.x !== inputState.targetX) {
    queueInputRender();
  }
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
  drawReadyOverlay();
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
  const left = projectCourtPoint(paddle.x - halfWidth, paddle.y);
  const right = projectCourtPoint(paddle.x + halfWidth, paddle.y);

  context.save();
  applyGlow(18, 1);
  context.lineCap = "round";
  context.lineWidth = Math.max(5, layout.court.width * 0.024);
  context.beginPath();
  context.moveTo(left.x, left.y);
  context.lineTo(right.x, right.y);
  context.stroke();
  context.restore();
}

function drawBall(ball) {
  const center = projectCourtPoint(ball.x, ball.y);
  const edge = projectCourtPoint(ball.x + ball.radius, ball.y);
  const radius = Math.max(4, Math.abs(edge.x - center.x));

  context.save();
  applyGlow(18, 1);
  context.beginPath();
  context.arc(center.x, center.y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawScore() {
  const { width } = layout.viewport;
  const court = layout.court;

  context.save();
  applyGlow(10, 0.92);
  context.font = `${Math.max(18, Math.min(34, court.width * 0.12))}px monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    `${renderState.score.ai}  ${renderState.score.player}`,
    width / 2,
    court.y * 0.55
  );
  context.restore();
}

function drawReadyOverlay() {
  const court = layout.court;
  const center = projectCourtPoint(5, 16.35);

  context.save();
  applyGlow(8, 0.74);
  context.font = `${Math.max(12, Math.min(16, court.width * 0.05))}px monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("TAP / CLICK", center.x, center.y);
  context.restore();
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

resizeCanvas();
