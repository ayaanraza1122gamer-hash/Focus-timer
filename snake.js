(() => {
  // ---------- Setup ----------
  const canvas = document.getElementById("game");
  // PERF: { alpha: false } tells the browser the canvas is fully opaque,
  // so it can skip extra blending work.
  const ctx = canvas.getContext("2d", { alpha: false });

  const CELL_SIZE = 24;
  const COLS = 22;
  const ROWS = 14;

  canvas.width = COLS * CELL_SIZE; // 528
  canvas.height = ROWS * CELL_SIZE; // 336

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const statusEl = document.getElementById("status");
  const pauseBtn = document.getElementById("pause");

  // Colors from the Figma design
  const COLOR_BOARD = "#0B2926";
  const COLOR_GRID = "rgba(155, 231, 196, 0.07)";
  const COLOR_HEAD = "#d9fbec";
  const COLOR_BODY = "#8fdcb8";
  const COLOR_FOOD = "#ffb86b";
  const COLOR_LEAF = "#9be7c4";

  const TICK_MS = 140;
  const MAX_QUEUED_TURNS = 3;

  const boardLayer = document.createElement("canvas");
  boardLayer.width = canvas.width;
  boardLayer.height = canvas.height;
  buildBoardLayer();

  function buildBoardLayer() {
    const b = boardLayer.getContext("2d");

    b.fillStyle = COLOR_BOARD;
    b.fillRect(0, 0, boardLayer.width, boardLayer.height);

    b.strokeStyle = COLOR_GRID;
    b.lineWidth = 1;
    b.beginPath();
    for (let col = 1; col < COLS; col++) {
      const x = col * CELL_SIZE;
      b.moveTo(x, 0);
      b.lineTo(x, boardLayer.height);
    }
    for (let row = 1; row < ROWS; row++) {
      const y = row * CELL_SIZE;
      b.moveTo(0, y);
      b.lineTo(boardLayer.width, y);
    }
    b.stroke();
  }

  // ---------- State ----------

  let snake;
  let prevSnake;
  let progress;
  let direction;
  let directionQueue;
  let food;
  let score;
  let best = loadBest();
  let started;
  let paused;
  let gameOver;
  let lastTime = 0;

  // ---------- Helpers ----------
  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function lerp(from, to, t) {
    return from + (to - from) * t;
  }

  function isOnSnake(cell) {
    return snake.some((part) => part.x === cell.x && part.y === cell.y);
  }

  function randomFood() {
    while (true) {
      const cell = { x: randomInt(COLS), y: randomInt(ROWS) };
      if (!isOnSnake(cell)) return cell;
    }
  }

  function loadBest() {
    try {
      return Number(localStorage.getItem("snakeBest")) || 0;
    } catch {
      return 0;
    }
  }

  function saveBest() {
    try {
      localStorage.setItem("snakeBest", String(best));
    } catch {}
  }

  function formatScore(n) {
    return String(n).padStart(3, "0"); // 80 -> "080"
  }

  function updateHud() {
    scoreEl.textContent = formatScore(score);
    bestEl.textContent = formatScore(best);

    let text = "In play";
    if (!started) text = "Ready";
    if (paused) text = "Paused";
    if (gameOver) text = "Game over";
    statusEl.textContent = text;

    pauseBtn.textContent = paused ? "Resume" : "Pause";
  }

  // ---------- Game control ----------
  function resetGame() {
    snake = [
      { x: 7, y: 9 }, // head
      { x: 6, y: 9 },
      { x: 5, y: 9 },
    ];
    prevSnake = snake.map((part) => ({ ...part }));
    progress = 1;
    direction = { x: 1, y: 0 }; // moving right
    directionQueue = [];
    score = 0;
    started = false;
    paused = false;
    gameOver = false;
    food = randomFood();
    lastTime = performance.now();
    updateHud();
  }

  function endGame() {
    gameOver = true;
    if (score > best) {
      best = score;
      saveBest();
    }
    updateHud();
  }

  function togglePause() {
    if (!started || gameOver) return;
    paused = !paused;
    if (!paused) {
      lastTime = performance.now() - progress * TICK_MS;
    }
    updateHud();
  }

  // ---------- Update: move the snake ONE step ----------
  function update() {
    prevSnake = snake.map((part) => ({ ...part }));

    if (directionQueue.length > 0) {
      direction = directionQueue.shift();
    }

    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };

    // 1. Did it hit a wall?
    const hitWall =
      newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS;
    if (hitWall) {
      endGame();
      return;
    }

    const ateFood = newHead.x === food.x && newHead.y === food.y;

    const obstacles = ateFood ? snake : snake.slice(0, -1);
    const hitSelf = obstacles.some(
      (part) => part.x === newHead.x && part.y === newHead.y,
    );
    if (hitSelf) {
      endGame();
      return;
    }

    snake.unshift(newHead);

    if (ateFood) {
      score += 10;
      food = randomFood();
      updateHud();
    } else {
      snake.pop();
    }
  }

  // ---------- Draw ----------
  function drawFood() {
    const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = food.y * CELL_SIZE + CELL_SIZE / 2;

    // Soft glow
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = COLOR_FOOD;
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    // The snack
    ctx.fillStyle = COLOR_FOOD;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Little leaf
    ctx.fillStyle = COLOR_LEAF;
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy - 9, 4.5, 3, -0.6, 0, 2 * Math.PI);
    ctx.fill();
  }

  function drawSnake() {
    let headX = 0;
    let headY = 0;

    for (let i = snake.length - 1; i >= 0; i--) {
      const to = snake[i];
      const from = prevSnake[i] || prevSnake[prevSnake.length - 1];

      const gx = lerp(from.x, to.x, progress);
      const gy = lerp(from.y, to.y, progress);

      const x = gx * CELL_SIZE + 1;
      const y = gy * CELL_SIZE + 1;
      const size = CELL_SIZE - 2;

      if (i === 0) {
        ctx.fillStyle = COLOR_HEAD;
        ctx.globalAlpha = 1;
        headX = gx;
        headY = gy;
      } else {
        ctx.fillStyle = COLOR_BODY;
        ctx.globalAlpha = 0.9 - (i / snake.length) * 0.5;
      }

      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 6);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawEyes(headX, headY);
  }

  function drawEyes(gx, gy) {
    const cx = gx * CELL_SIZE + CELL_SIZE / 2;
    const cy = gy * CELL_SIZE + CELL_SIZE / 2;

    const dx = direction.x;
    const dy = direction.y;
    const sideX = -dy;
    const sideY = dx;

    ctx.fillStyle = COLOR_BOARD;
    for (const side of [-1, 1]) {
      const ex = cx + dx * 5 + sideX * side * 4.5;
      const ey = cy + dy * 5 + sideY * side * 4.5;
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  function drawOverlay(title, subtitle) {
    ctx.fillStyle = "rgba(11, 41, 38, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#eafaf3";
    ctx.font = "700 26px system-ui, sans-serif";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 6);

    ctx.fillStyle = "#9fcfc2";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 22);
  }

  function draw() {
    ctx.drawImage(boardLayer, 0, 0);

    drawFood();
    drawSnake();

    if (gameOver) drawOverlay("Game over", "Press Space to play again");
    else if (paused) drawOverlay("Paused", "Press Space to resume");
    else if (!started) drawOverlay("Ready?", "Press an arrow key to start");
  }

  // ---------- Loop ----------
  function loop(time) {
    const canMove = started && !paused && !gameOver;

    if (canMove) {
      if (time - lastTime > TICK_MS * 2) lastTime = time - TICK_MS;

      if (time - lastTime >= TICK_MS) {
        lastTime += TICK_MS;
        update();
      }

      progress = Math.min(1, Math.max(0, (time - lastTime) / TICK_MS));
    }

    draw();
    requestAnimationFrame(loop);
  }

  // ---------- Input ----------
  const KEY_DIRECTIONS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
  };

  function snakeIsVisible() {
    return (
      !document.getElementById("view-activities").hidden &&
      !document.getElementById("panel-snake").hidden
    );
  }

  function pauseSnake() {
    if (started && !paused && !gameOver) {
      paused = true;
      updateHud();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (!snakeIsVisible()) return;
    if (e.code === "Space") {
      e.preventDefault();
      if (gameOver) resetGame();
      else togglePause();
      return;
    }

    const wanted = KEY_DIRECTIONS[e.key];
    if (!wanted) return;

    e.preventDefault();

    const planned =
      directionQueue.length > 0
        ? directionQueue[directionQueue.length - 1]
        : direction;

    const isReverse = wanted.x === -planned.x && wanted.y === -planned.y;
    const isSame = wanted.x === planned.x && wanted.y === planned.y;

    if (isReverse) return;

    if (!started && !gameOver) {
      started = true;
      lastTime = performance.now();
      updateHud();
    }

    if (isSame) return;
    if (directionQueue.length < MAX_QUEUED_TURNS) {
      directionQueue.push(wanted);
    }
  });

  pauseBtn.addEventListener("click", () => {
    togglePause();
    pauseBtn.blur();
  });

  // Pause automatically if you switch to another tab.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && started && !paused && !gameOver) {
      paused = true;
      updateHud();
    }
  });

  // ---------- Start ----------
  resetGame();
  requestAnimationFrame(loop);

  window.pauseSnake = pauseSnake;
})();
