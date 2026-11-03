// ---------- Config ----------
const MODES = {
  focus: { minutes: 25, label: "Time to focus" },
  short: { minutes: 5, label: "Take a short break" },
  long: { minutes: 15, label: "Take a long break" },
};
const SESSIONS_BEFORE_LONG_BREAK = 4;

// ---------- DOM references ----------
const timeEl = document.getElementById("time");
const labelEl = document.getElementById("label");
const sessionsEl = document.getElementById("sessions");
const startBtn = document.getElementById("start");
const resetBtn = document.getElementById("reset");
const skipBtn = document.getElementById("skip");
const modeBtns = document.querySelectorAll(".mode-btn");
const ring = document.querySelector(".ring-progress");

// ---------- Ring setup ----------
// A circle's length is 2 * PI * radius. We hide part of the stroke by
// changing stroke-dashoffset, which makes the ring look like it drains.
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
  labelEl.textContent = MODES[mode].label;
  sessionsEl.textContent = completedSessions;
  startBtn.textContent = intervalId ? "Pause" : "Start";

  // Progress: 1 = full ring, 0 = empty ring
  const progress = remainingMs / totalMs;
  ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Theme switches through the data-mode attribute (see style.css)
  document.body.dataset.mode = mode;
  modeBtns.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.mode === mode);
  });
}

// ---------- Timer logic ----------
// We don't subtract 1 second per tick. setInterval can run late (especially
// in background tabs), so we compare against a fixed end time instead.
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
}

function pause() {
  clearInterval(intervalId);
  intervalId = null;
  render();
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
  setMode(nextMode()); // the next mode waits for you to press Start
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
