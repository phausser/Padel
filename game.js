"use strict";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const COURT_WIDTH_METERS = 10;
const COURT_LENGTH_METERS = 20;
const COURT_ASPECT_RATIO = COURT_WIDTH_METERS / COURT_LENGTH_METERS;
const COURT_MARGIN = 24;

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawShell(width, height);
}

function getCourtBounds(width, height) {
  const safeWidth = Math.max(0, width - COURT_MARGIN * 2);
  const safeHeight = Math.max(0, height - COURT_MARGIN * 2);
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

function drawShell(width, height) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);

  const court = getCourtBounds(width, height);

  context.save();
  context.strokeStyle = "#fff";
  context.lineWidth = 2;
  context.shadowColor = "#fff";
  context.shadowBlur = 14;

  context.strokeRect(court.x, court.y, court.width, court.height);

  context.beginPath();
  context.moveTo(court.x, court.y + court.height / 2);
  context.lineTo(court.x + court.width, court.y + court.height / 2);
  context.stroke();
  context.restore();
}

function preventGameGesture(event) {
  event.preventDefault();
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
canvas.addEventListener("touchstart", preventGameGesture, { passive: false });
canvas.addEventListener("touchmove", preventGameGesture, { passive: false });
canvas.addEventListener("contextmenu", preventGameGesture);

resizeCanvas();
