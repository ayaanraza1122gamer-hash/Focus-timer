// ---------- Config ----------
const MODES = {
  focus: {
    minutes: 25,
    eyebrow: "One thing at a time",
    label: "Time to focus",
    tagline: "A little focus. A little closer.",
  },
  short: {
    minutes: 5,
    eyebrow: "Make room to recharge",
    label: "Take a little breather",
    tagline: "Step back. Come back brighter.",
  },
  long: {
    minutes: 15,
    eyebrow: "You've earned this pause",
    label: "Rest a little longer",
    tagline: "Good work begins with good rest.",
  },
};
const SESSIONS_BEFORE_LONG_BREAK = 4;

// ---------- DOM references ----------
const timeEl = document.getElementById("time");
const labelEl = document.getElementById("label");
const eyebrowEl = document.getElementById("eyebrow");
const taglineEl = document.getElementById("tagline");
const sessionsEl = document.getElementById("sessions");
const startBtn = document.getElementById("start");
const startLabel = document.getElementById("start-label");
const resetBtn = document.getElementById("reset");
const skipBtn = document.getElementById("skip");
const modeBtns = document.querySelectorAll(".mode-btn");
const ring = document.querySelector(".ring-progress");
const dotOrbit = document.getElementById("dot-orbit");
const dots = document.querySelectorAll(".dot");

// ---------- Ring setup ----------

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
ring.style.strokeDasharray = CIRCUMFERENCE;

// ---------- State ----------
let mode = "focus";
let totalMs = MODES[mode].minutes * 60 * 1000;
let remainingMs = totalMs;
let endTime = null; // timestamp (ms) when the timer should hit 0
let intervalId = null;
let completedSessions = 0;

// ---------- Rendering ----------
function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function render() {
  const text = formatTime(remainingMs);
  timeEl.textContent = text;
  document.title = `${text} - Focus Timer`;

  eyebrowEl.textContent = MODES[mode].eyebrow;
  labelEl.textContent = MODES[mode].label;
  taglineEl.textContent = MODES[mode].tagline;

  startLabel.textContent = intervalId ? "Pause" : "Start";
  sessionsEl.textContent = completedSessions;

  const progress = remainingMs / totalMs;
  ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  dotOrbit.style.transform = `rotate(${progress * 360}deg)`;

  const filled =
    completedSessions > 0 &&
    completedSessions % SESSIONS_BEFORE_LONG_BREAK === 0
      ? SESSIONS_BEFORE_LONG_BREAK
      : completedSessions % SESSIONS_BEFORE_LONG_BREAK;
  dots.forEach((dot, i) => dot.classList.toggle("is-done", i < filled));

  // Theme switches through the data-mode attribute (see the CSS)
  document.body.dataset.mode = mode;
  modeBtns.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.mode === mode);
  });
}

// ---------- Timer logic ----------

function tick() {
  remainingMs = Math.max(0, endTime - Date.now());
  if (remainingMs === 0) {
    finishSession();
    return;
  }
  render();
}

function start() {
  if (intervalId) return;
  endTime = Date.now() + remainingMs;
  intervalId = setInterval(tick, 200);
  render();
  setStarsMoving(true);
}

function pause() {
  clearInterval(intervalId);
  intervalId = null;
  render();
  setStarsMoving(false);
}

function toggle() {
  intervalId ? pause() : start();
}

function setMode(newMode) {
  pause();
  mode = newMode;
  totalMs = MODES[mode].minutes * 60 * 1000;
  remainingMs = totalMs;
  render();
}

function reset() {
  setMode(mode);
}

function nextMode() {
  if (mode === "focus") {
    const earnedLongBreak =
      completedSessions > 0 &&
      completedSessions % SESSIONS_BEFORE_LONG_BREAK === 0;
    return earnedLongBreak ? "long" : "short";
  }
  return "focus";
}

function finishSession() {
  if (mode === "focus") completedSessions++;
  setMode(nextMode());
}

// ---------- Events ----------
startBtn.addEventListener("click", toggle);
resetBtn.addEventListener("click", reset);
skipBtn.addEventListener("click", () => setMode(nextMode()));

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target.tagName !== "BUTTON") {
    e.preventDefault();
    toggle();
  }
});

// First paint
render();
