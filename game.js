"use strict";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");

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

function drawShell(width, height) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);

  context.save();
  context.strokeStyle = "#fff";
  context.lineWidth = 2;
  context.shadowColor = "#fff";
  context.shadowBlur = 14;

  const inset = Math.max(24, Math.min(width, height) * 0.08);
  context.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  context.beginPath();
  context.moveTo(inset, height / 2);
  context.lineTo(width - inset, height / 2);
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
