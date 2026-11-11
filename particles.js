// ---------- Setup ----------
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const STAR_COUNT = 120;
const stars = [];

let targetSpeed = 0.15;
let currentSpeed = 0.15;

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// ---------- Creating stars ----------
function createStar() {
  const depth = Math.random() ** 2;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 0.5 + depth * 2,
    speed: 0.2 + depth * 0.8,
    opacity: 0.3 + depth * 0.6,
    twinkleSpeed: 0.5 + Math.random() * 2,
    twinkleOffset: Math.random() * Math.PI * 2, // so stars don't twinkle
    useAccent: Math.random() < 0.2,
  };
}

for (let i = 0; i < STAR_COUNT; i++) {
  stars.push(createStar());
}

// ---------- Resize ----------
window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

// ---------- Called by pomodoro.js ----------
function setStarsMoving(isMoving) {
  targetSpeed = isMoving ? 1 : 0.15;
}

// ---------- Animation loop ----------
function animate(time) {
  ctx.clearRect(0, 0, width, height);

  currentSpeed += (targetSpeed - currentSpeed) * 0.05;

  const accent =
    getComputedStyle(document.body).getPropertyValue("--accent").trim() ||
    "#ffb86b";

  for (const star of stars) {
    const twinkle = Math.sin(
      (time / 1000) * star.twinkleSpeed + star.twinkleOffset,
    );
    const alpha = star.opacity + twinkle * 0.25;
    ctx.globalAlpha = Math.min(1, Math.max(0, alpha));

    const color = star.useAccent ? accent : "#ffffff";
    ctx.fillStyle = color;

    if (star.radius > 1.8) {
      ctx.shadowBlur = star.radius * 4;
      ctx.shadowColor = color;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
    ctx.fill();

    if (!reduceMotion) {
      star.y += star.speed * currentSpeed;
    }

    if (star.y > height + star.radius) {
      star.y = -star.radius;
      star.x = Math.random() * width;
    }
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
