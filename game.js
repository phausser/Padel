"use strict";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const COURT_WIDTH_METERS = 10;
const COURT_LENGTH_METERS = 20;
const COURT_ASPECT_RATIO = COURT_WIDTH_METERS / COURT_LENGTH_METERS;
const MIN_COURT_MARGIN = 18;
const MAX_DEVICE_PIXEL_RATIO = 3;
const FAR_WIDTH_SCALE = 0.68;
const BACKGROUND_COLOR = "#1E8FD5";

const renderState = {
  score: {
    player: 0,
    ai: 0
  },
  playerPaddle: {
    x: 5,
    y: 18.35,
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
  drawBall(renderState.ball);
  drawScore();
  drawReadyOverlay();
}

function drawBackground(width, height) {
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, width, height);
}

function drawCourtSurface() {
  const corners = getCourtCorners();

  context.save();
  context.fillStyle = "#020202";
  context.beginPath();
  corners.forEach((corner, index) => {
    if (index === 0) {
      context.moveTo(corner.x, corner.y);
    } else {
      context.lineTo(corner.x, corner.y);
    }
  });
  context.closePath();
  context.fill();
  context.restore();
}

function drawGlassWalls() {
  const corners = getCourtCorners();

  context.save();
  applyGlow(18, 0.95);
  context.lineWidth = 2.2;
  context.beginPath();
  corners.forEach((corner, index) => {
    if (index === 0) {
      context.moveTo(corner.x, corner.y);
    } else {
      context.lineTo(corner.x, corner.y);
    }
  });
  context.closePath();
  context.stroke();

  context.globalAlpha = 0.52;
  context.lineWidth = 1;
  [2.5, 5, 7.5].forEach((x) => {
    drawProjectedLine(x, 0, x, 20);
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

function getCourtCorners() {
  return [
    projectCourtPoint(0, 0),
    projectCourtPoint(10, 0),
    projectCourtPoint(10, 20),
    projectCourtPoint(0, 20)
  ];
}

function projectCourtPoint(xMeters, yMeters) {
  const court = layout.court;
  const yRatio = yMeters / COURT_LENGTH_METERS;
  const xRatio = xMeters / COURT_WIDTH_METERS;
  const perspectiveWidth = court.width * lerp(FAR_WIDTH_SCALE, 1, yRatio);
  const centerX = court.x + court.width / 2;

  return {
    x: centerX + (xRatio - 0.5) * perspectiveWidth,
    y: court.y + yRatio * court.height
  };
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

function preventGameGesture(event) {
  event.preventDefault();
}

window.addEventListener("resize", queueResize);
window.addEventListener("orientationchange", queueResize);
window.visualViewport?.addEventListener("resize", queueResize);
canvas.addEventListener("touchstart", preventGameGesture, { passive: false });
canvas.addEventListener("touchmove", preventGameGesture, { passive: false });
canvas.addEventListener("contextmenu", preventGameGesture);

resizeCanvas();
