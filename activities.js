// =====================================================
// BREAK ACTIVITIES: views, game picker, Memory, Breathing
// (Snake lives in snake.js)
// =====================================================

// ---------- Switching between the timer and the games ----------
const viewTimer = document.getElementById("view-timer");
const viewActivities = document.getElementById("view-activities");

function showView(name) {
  const showGames = name === "activities";
  viewTimer.hidden = showGames;
  viewActivities.hidden = !showGames;

  if (showGames) {
    selectGame(currentGame);
  } else {
    pauseSnake();
    stopBreathing();
  }
}

document.querySelector(".activity-link").addEventListener("click", (e) => {
  e.preventDefault();
  showView("activities");
});

document.getElementById("back").addEventListener("click", () => {
  showView("timer");
});

// ---------- Game picker ----------
const pickBtns = document.querySelectorAll(".pick-btn");
const panels = {
  snake: document.getElementById("panel-snake"),
  memory: document.getElementById("panel-memory"),
  breathing: document.getElementById("panel-breathing"),
};
let currentGame = "snake";

function selectGame(name) {
  currentGame = name;

  pickBtns.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.game === name);
  });
  for (const [key, panel] of Object.entries(panels)) {
    panel.hidden = key !== name;
  }

  if (name !== "snake") pauseSnake();
  if (name === "breathing") startBreathing();
  else stopBreathing();
  if (name === "memory" && cards.length === 0) newMemoryGame();
}

pickBtns.forEach((btn) => {
  btn.addEventListener("click", () => selectGame(btn.dataset.game));
});

// MEMORY
function svgIcon(paths, size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

const ICONS = {
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />',
  coffee:
    '<path d="M10 2v2" /><path d="M14 2v2" /><path d="M6 2v2" /><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />',
  sprout:
    '<path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />',
  sun: '<circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />',
};
const SPARKLES =
  '<path d="M9.9 15.5A2 2 0 0 0 8.5 14.1l-6.1-1.6a.5.5 0 0 1 0-1L8.5 9.9A2 2 0 0 0 9.9 8.5l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z" />';

const memGrid = document.getElementById("memory-grid");
const memPairsEl = document.getElementById("mem-pairs");
const memMovesEl = document.getElementById("mem-moves");
const memStatusEl = document.getElementById("mem-status");

let cards = [];
let deck = [];
let revealed = [];
let matched = new Set();
let moves = 0;
let locked = false;

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function newMemoryGame() {
  const names = Object.keys(ICONS);
  deck = shuffle([...names, ...names]);
  revealed = [];
  matched = new Set();
  moves = 0;
  locked = false;

  memGrid.innerHTML = "";
  cards = deck.map((_, i) => {
    const btn = document.createElement("button");
    btn.className = "card";
    btn.addEventListener("click", () => flipCard(i));
    memGrid.appendChild(btn);
    return btn;
  });
  renderMemory();
}

function flipCard(i) {
  if (locked || matched.has(i) || revealed.includes(i)) return;

  revealed.push(i);

  if (revealed.length === 2) {
    moves++;
    const [a, b] = revealed;
    if (deck[a] === deck[b]) {
      matched.add(a);
      matched.add(b);
      revealed = [];
    } else {
      locked = true;
      setTimeout(() => {
        revealed = [];
        locked = false;
        renderMemory();
      }, 800);
    }
  }
  renderMemory();
}

function renderMemory() {
  cards.forEach((btn, i) => {
    const isMatched = matched.has(i);
    const isRevealed = revealed.includes(i);
    const faceUp = isMatched || isRevealed;

    btn.classList.toggle("is-matched", isMatched);
    btn.classList.toggle("is-revealed", isRevealed && !isMatched);
    btn.innerHTML = faceUp
      ? svgIcon(ICONS[deck[i]], 32)
      : svgIcon(SPARKLES, 24);
    btn.setAttribute("aria-label", faceUp ? deck[i] : "Hidden card");
  });

  memPairsEl.textContent = `Pairs ${matched.size / 2} / ${deck.length / 2}`;
  memMovesEl.textContent = `Moves ${moves}`;
  memStatusEl.textContent =
    matched.size === deck.length ? "Complete" : "In play";
}

document.getElementById("mem-new").addEventListener("click", newMemoryGame);

// =====================================================
// BREATHING
// =====================================================
const PHASES = [
  {
    title: "Breathe in",
    seconds: 4,
    scale: 1.12,
    cue: "Slowly, through your nose",
  },
  { title: "Hold", seconds: 4, scale: 1.12, cue: "Gently, no strain" },
  {
    title: "Breathe out",
    seconds: 6,
    scale: 0.85,
    cue: "Let it go, nice and slow",
  },
];
const TOTAL_CYCLES = 5;
const ARC_LENGTH = 2 * Math.PI * 129;

const orbEl = document.getElementById("breath-orb");
const arcEl = document.getElementById("breath-arc");
const phaseEl = document.getElementById("breath-phase");
const countEl = document.getElementById("breath-count");
const cueEl = document.getElementById("breath-cue");
const cycleEl = document.getElementById("breath-cycle");
const toggleBtn = document.getElementById("breath-toggle");
const rhythmEls = document.querySelectorAll(".breath-rhythm li");

let breathState = "idle";
let breathCycle = 1;
let phaseIndex = 0;
let phaseStart = 0;
let pausedElapsed = 0;
let breathFrame = null;

function beginPhase() {
  const phase = PHASES[phaseIndex];
  phaseStart = performance.now();

  orbEl.style.transition = `transform ${phase.seconds}s ease-in-out`;
  orbEl.style.transform = "";
  orbEl.style.setProperty("--scale", phase.scale);

  phaseEl.textContent = phase.title;
  cueEl.textContent = phase.cue;
  rhythmEls.forEach((li, i) => {
    li.classList.toggle("is-current", i === phaseIndex);
  });
}

function breathLoop(now) {
  const phase = PHASES[phaseIndex];
  const elapsed = (now - phaseStart) / 1000;

  if (elapsed >= phase.seconds) {
    phaseIndex++;
    if (phaseIndex >= PHASES.length) {
      phaseIndex = 0;
      breathCycle++;
      if (breathCycle > TOTAL_CYCLES) {
        finishBreathing();
        return;
      }
      cycleEl.textContent = `Cycle ${breathCycle} / ${TOTAL_CYCLES}`;
    }
    beginPhase();
    breathFrame = requestAnimationFrame(breathLoop);
    return;
  }

  countEl.textContent = Math.ceil(phase.seconds - elapsed);
  arcEl.style.strokeDashoffset = ARC_LENGTH * (1 - elapsed / phase.seconds);
  breathFrame = requestAnimationFrame(breathLoop);
}

function startBreathing() {
  cancelAnimationFrame(breathFrame);
  breathState = "running";
  breathCycle = 1;
  phaseIndex = 0;
  cycleEl.textContent = `Cycle 1 / ${TOTAL_CYCLES}`;
  toggleBtn.textContent = "Pause breathing";
  arcEl.style.strokeDasharray = ARC_LENGTH;
  orbEl.style.transition = "none";
  orbEl.style.setProperty("--scale", 0.85);
  void orbEl.offsetWidth;
  beginPhase();
  breathFrame = requestAnimationFrame(breathLoop);
}

function stopBreathing() {
  cancelAnimationFrame(breathFrame);
  breathState = "idle";
}

function finishBreathing() {
  breathState = "done";
  phaseEl.textContent = "Well done";
  countEl.textContent = "";
  cueEl.textContent = "Take a moment before you head back.";
  rhythmEls.forEach((li) => li.classList.remove("is-current"));
  toggleBtn.textContent = "Start again";
}

function pauseBreathing() {
  cancelAnimationFrame(breathFrame);
  breathState = "paused";
  pausedElapsed = performance.now() - phaseStart;

  const frozen = getComputedStyle(orbEl).transform;
  orbEl.style.transition = "none";
  orbEl.style.transform = frozen;
  toggleBtn.textContent = "Resume breathing";
}

function resumeBreathing() {
  breathState = "running";
  const phase = PHASES[phaseIndex];
  phaseStart = performance.now() - pausedElapsed;

  const remaining = Math.max(0, phase.seconds - pausedElapsed / 1000);
  orbEl.style.transition = `transform ${remaining}s ease-in-out`;
  void orbEl.offsetWidth;
  orbEl.style.transform = "";

  toggleBtn.textContent = "Pause breathing";
  breathFrame = requestAnimationFrame(breathLoop);
}

toggleBtn.addEventListener("click", () => {
  if (breathState === "running") pauseBreathing();
  else if (breathState === "paused") resumeBreathing();
  else startBreathing(); // idle or done
});
