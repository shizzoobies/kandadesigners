// ── Game state ────────────────────────────────────────────────────────────────
let board, selected, turn, flipped, legalMoves, lastMove;
let moveHistory, gameOver, enPassant, castling, hintMove;
let halfmove, fullmove;
let stockfish = null;
let sfReady = false;
let commentaryEnabled = true;

// Sprite sheet: 6 columns x 2 rows
// Top row (white): King, Queen, Bishop, Knight, Rook, Pawn
// Bottom row (black): Pawn, Rook, Knight, Bishop, Queen, King
// background-position as [x%, y%]
const SPRITE_POS = {
  wK: [0, 0],    wQ: [20, 0],   wB: [40, 0],   wN: [60, 0],   wR: [80, 0],   wP: [100, 0],
  bP: [0, 100],  bR: [20, 100], bN: [40, 100],  bB: [60, 100], bQ: [80, 100], bK: [100, 100],
};

// Difficulty presets: [skillLevel 0-20, moveTimeMs, label, eloApprox]
const DIFFICULTY = {
  casual: [5,  600,  'Casual',  '~1100'],
  ultra:  [20, 2000, 'Ultra',   '3500+'],
};
let currentDifficulty = 'ultra';

// ── Boot ──────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  initDifficultyButtons();
  resetGame();
  await loadStockfish();
});

async function loadStockfish() {
  setSFStatus('Loading...');
  stockfish = new StockfishEngine();
  stockfish.onReady = () => {
    sfReady = true;
    const [skill] = DIFFICULTY[currentDifficulty];
    stockfish.setSkillLevel(skill);
    setSFStatus('');
    setStatus('Your turn — play as White');
  };
  try {
    await stockfish.load();
  } catch (err) {
    console.error('Stockfish failed to load:', err);
    setSFStatus('AI unavailable');
    sfReady = false;
    setStatus('Your turn — play as White');
  }
}

// ── Difficulty ────────────────────────────────────────────────────────────────
function initDifficultyButtons() {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDifficulty = btn.dataset.diff;
      if (stockfish && sfReady) {
        const [skill] = DIFFICULTY[currentDifficulty];
        stockfish.setSkillLevel(skill);
      }
      const [,, label, elo] = DIFFICULTY[currentDifficulty];
      showCommentary(`${label} mode (${elo} ELO). New game started.`, true);
      resetGame();
    });
  });
  document.querySelector('[data-diff="ultra"]').classList.add('active');
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetGame() {
  board       = deepCopy(INIT_BOARD);
  selected    = null; turn = 'w'; flipped = false;
  legalMoves  = []; lastMove = null; moveHistory = [];
  gameOver    = false; enPassant = null; hintMove = null;
  halfmove    = 0; fullmove = 1;
  castling    = {wK:true,wQ:true,bK:true,bQ:true};

  document.getElementById('result-overlay').classList.remove('show');
  document.getElementById('move-log').innerHTML = '';
  document.getElementById('analysis-wrap').classList.remove('show');

  // Restore normal controls
  const controls = document.getElementById('controls');
  controls.innerHTML = `
    <button class="ctrl" id="btn-undo" onclick="undoMove()">Undo</button>
    <button class="ctrl accent" id="btn-hint" onclick="requestHint()">Hint</button>
    <button class="ctrl" onclick="flipBoard()">Flip</button>
    <button class="ctrl" onclick="resetGame()">New Game</button>
  `;

  if (!gameOver) setStatus('Your turn — play as White');
  render();
}

// ── Render ────────────────────────────────────────────────────────────────────
function setStatus(t)   { document.getElementById('status-bar').textContent = t; }
function setSFStatus(t) { document.getElementById('sf-status').textContent = t; }

function render() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  for (let dR=0; dR<8; dR++) {
    for (let dC=0; dC<8; dC++) {
      const r = flipped ? 7-dR : dR;
      const c = flipped ? 7-dC : dC;
      const isLight = (r+c)%2===0;
      const sq = document.createElement('div');
      sq.className = 'sq ' + (isLight ? 'light' : 'dark');

      if (lastMove && ((r===lastMove.fr&&c===lastMove.fc)||(r===lastMove.tr&&c===lastMove.tc)))
        sq.classList.add(isLight ? 'last-move-l' : 'last-move-d');
      if (selected && selected[0]===r && selected[1]===c) sq.classList.add('selected');

      const isLegal = legalMoves.find(m => m.tr===r && m.tc===c);
      if (isLegal) sq.classList.add(board[r][c] ? 'legal-capture' : 'legal-move');

      if (hintMove) {
        if (r===hintMove.fr && c===hintMove.fc) sq.classList.add('hint-from');
        if (r===hintMove.tr && c===hintMove.tc) sq.classList.add('hint-to');
      }

      // Render piece from sprite sheet
      if (board[r][c] && SPRITE_POS[board[r][c]]) {
        const piece = document.createElement('div');
        piece.className = 'piece-sprite';
        const [px, py] = SPRITE_POS[board[r][c]];
        piece.style.backgroundPosition = `${px}% ${py}%`;
        sq.appendChild(piece);
      }

      if (dR===7) {
        const lbl = document.createElement('span');
        lbl.className = 'coord-label coord-file ' + (isLight ? 'on-light' : 'on-dark');
        lbl.textContent = String.fromCharCode(flipped ? 104-c : 97+c);
        sq.appendChild(lbl);
      }
      if (dC===0) {
        const lbl = document.createElement('span');
        lbl.className = 'coord-label coord-rank ' + (isLight ? 'on-light' : 'on-dark');
        lbl.textContent = flipped ? r+1 : 8-r;
        sq.appendChild(lbl);
      }

      sq.addEventListener('click', () => handleClick(r, c));
      boardEl.appendChild(sq);
    }
  }
}

// ── Click handling ────────────────────────────────────────────────────────────
function handleClick(r, c) {
  if (gameOver || turn !== 'w') return;
  hintMove = null;

  if (selected) {
    const move = legalMoves.find(m => m.tr===r && m.tc===c);
    if (move) {
      executeMove({fr:selected[0], fc:selected[1], ...move}, true);
      selected = null; legalMoves = [];
      return;
    }
  }
  if (board[r][c] && pieceCol(board[r][c]) === 'w') {
    selected   = [r, c];
    legalMoves = legalMovesFor(board, r, c, enPassant, castling);
  } else {
    selected = null; legalMoves = [];
  }
  render();
}

// ── Execute move ──────────────────────────────────────────────────────────────
function executeMove(move, isHuman) {
  const san = moveToSAN(board, move);
  const prevBoard = deepCopy(board);
  const res = applyMove(board, move, enPassant, castling);
  lastMove = move;
  board = res.board; enPassant = res.ep; castling = res.castling;
  moveHistory.push({move, san, board:prevBoard, ep:enPassant, castling:{...castling}, turn});
  if (turn === 'b') fullmove++;
  turn = turn==='w' ? 'b' : 'w';
  appendMoveLog(san, moveHistory.length);
  render();
  checkGameState(isHuman, san);
}

function appendMoveLog(san, histLen) {
  const log = document.getElementById('move-log');
  const isW = histLen % 2 === 1;
  if (isW) {
    const n = document.createElement('span');
    n.className = 'move-num';
    n.textContent = `${Math.ceil(histLen/2)}. `;
    log.appendChild(n);
  }
  const s = document.createElement('span');
  s.className = isW ? 'move-w' : 'move-b';
  s.textContent = san + ' ';
  log.appendChild(s);
  document.getElementById('move-log-wrap').scrollTop = 9999;
}

// ── Game state ────────────────────────────────────────────────────────────────
function checkGameState(isHuman, lastSAN) {
  const moves = allLegalMoves(board, turn, enPassant, castling);
  if (moves.length === 0) {
    gameOver = true;
    if (inCheck(board, turn)) {
      const winner = turn==='w' ? 'You lose\nCheckmate' : 'You win!\nCheckmate';
      showResult(winner);
    } else {
      showResult('Stalemate\nDraw!');
    }
    return;
  }
  if (inCheck(board, turn))
    setStatus(turn==='w' ? 'Your king is in check!' : "Enemy king is in check!");
  else if (isHuman)
    setStatus('Thinking...');
  else
    setStatus('Your turn');

  if (isHuman && !gameOver) setTimeout(() => sfMove(lastSAN), 300);
}

// ── Stockfish move ────────────────────────────────────────────────────────────
async function sfMove(prevSAN) {
  if (gameOver) return;
  const [, moveTime] = DIFFICULTY[currentDifficulty];
  const fen = boardToFEN(board, turn, castling, enPassant, halfmove, fullmove);

  let uciStr = null;
  if (sfReady && stockfish) {
    uciStr = await stockfish.getBestMove(fen, moveTime);
  }

  if (!uciStr) {
    const moves = allLegalMoves(board, 'b', enPassant, castling);
    if (moves.length === 0) return;
    const m = moves[Math.floor(Math.random() * moves.length)];
    executeMove(m, false);
    return;
  }

  const move = uciToMove(uciStr, board, enPassant, castling);
  if (!move) {
    const moves = allLegalMoves(board, 'b', enPassant, castling);
    if (moves.length > 0) executeMove(moves[0], false);
    return;
  }

  const san = moveToSAN(board, move);
  executeMove(move, false);

  if (commentaryEnabled) {
    fetchCommentary(fen, uciStr, san, Math.ceil(moveHistory.length / 2));
  }
}

// ── Commentary ────────────────────────────────────────────────────────────────
function showCommentary(text, muted = false) {
  const el = document.getElementById('commentary-text');
  el.textContent = text;
  el.className = muted ? 'muted' : '';
}

async function fetchCommentary(fen, move, moveSAN, moveNumber) {
  const el = document.getElementById('commentary-text');
  el.className = 'loading-dots';
  el.textContent = 'Analyzing';
  try {
    const resp = await fetch('/api/commentary', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({fen, move, moveSAN, moveNumber})
    });
    const data = await resp.json();
    if (data.commentary) showCommentary(data.commentary);
    else showCommentary('', true);
  } catch (e) {
    showCommentary('', true);
  }
}

// ── Hint ──────────────────────────────────────────────────────────────────────
async function requestHint() {
  if (gameOver || turn !== 'w') return;
  document.getElementById('btn-hint').disabled = true;
  hintMove = null;
  showCommentary('Finding best move...', true);

  const fen = boardToFEN(board, turn, castling, enPassant, halfmove, fullmove);

  let uciStr = null;
  if (sfReady && stockfish) {
    uciStr = await stockfish.getBestMoveFullStrength(fen, 2000);
  }

  if (!uciStr) {
    showCommentary('No hint available.', true);
    document.getElementById('btn-hint').disabled = false;
    return;
  }

  const move = uciToMove(uciStr, board, enPassant, castling);
  if (!move) {
    document.getElementById('btn-hint').disabled = false;
    return;
  }

  const san = moveToSAN(board, move);
  hintMove = move;
  selected = [move.fr, move.fc];
  legalMoves = legalMovesFor(board, move.fr, move.fc, enPassant, castling);
  render();

  try {
    const resp = await fetch('/api/hint', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({fen, bestMove: uciStr, bestMoveSAN: san})
    });
    const data = await resp.json();
    if (data.explanation) showCommentary(`Hint (${san}): ${data.explanation}`);
    else showCommentary(`Best move: ${san}`, false);
  } catch(e) {
    showCommentary(`Best move: ${san}`, false);
  }

  setStatus(`Hint: ${toAlg(move.fr,move.fc)} \u2192 ${toAlg(move.tr,move.tc)}`);
  document.getElementById('btn-hint').disabled = false;
}

// ── Undo ──────────────────────────────────────────────────────────────────────
function undoMove() {
  if (moveHistory.length === 0) return;
  const undoCount = turn==='w' ? 2 : 1;
  for (let i=0; i<undoCount && moveHistory.length>0; i++) {
    const prev = moveHistory.pop();
    board = prev.board; enPassant = prev.ep; castling = prev.castling; turn = prev.turn;
  }
  if (moveHistory.length === 0) turn = 'w';
  lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length-1].move : null;
  selected = null; legalMoves = []; hintMove = null; gameOver = false;

  const log = document.getElementById('move-log');
  for (let i=0; i<undoCount; i++) {
    if (log.lastChild && log.lastChild !== log.firstChild) log.removeChild(log.lastChild);
    if (log.lastChild && log.lastChild.className==='move-num') log.removeChild(log.lastChild);
  }
  showCommentary('Move undone. Your turn.', true);
  setStatus('Your turn');
  render();
}

// ── Flip ──────────────────────────────────────────────────────────────────────
function flipBoard() {
  flipped = !flipped; selected = null; legalMoves = []; hintMove = null; render();
}

// ── Result / Post-game analysis ───────────────────────────────────────────────
function showResult(msg) {
  const lines = msg.split('\n');
  setStatus(lines.join(' — '));
  showCommentary(lines.join(' — ') + '  ·  Click Analyze or New Game below.');

  // Swap controls to show endgame actions
  const controls = document.getElementById('controls');
  controls.innerHTML = '';
  const analyzeBtn = document.createElement('button');
  analyzeBtn.className = 'ctrl';
  analyzeBtn.textContent = 'Analyze';
  analyzeBtn.onclick = requestAnalysis;
  const rematchBtn = document.createElement('button');
  rematchBtn.className = 'ctrl accent';
  rematchBtn.textContent = 'Rematch';
  rematchBtn.onclick = resetGame;
  controls.appendChild(analyzeBtn);
  controls.appendChild(rematchBtn);

  // Store result for analysis
  document.getElementById('result-text').textContent = msg;
}

async function requestAnalysis() {
  const wrap = document.getElementById('analysis-wrap');
  wrap.classList.add('show');
  document.getElementById('analysis-text').textContent = 'Analyzing your game...';

  const pgn = buildPGN(moveHistory);
  const result = gameOver ? document.getElementById('result-text').textContent : 'Game in progress';

  try {
    const resp = await fetch('/api/analysis', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        pgn,
        result,
        playerColor: 'White',
        moveCount: moveHistory.length
      })
    });
    const data = await resp.json();
    if (data.analysis) {
      document.getElementById('analysis-text').innerHTML =
        data.analysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
  } catch(e) {
    document.getElementById('analysis-text').textContent = 'Analysis unavailable.';
  }
}
