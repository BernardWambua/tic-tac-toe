'use strict';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],             // diagonals
];

const state = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  scores: { X: 0, O: 0, draw: 0 },
  players: { X: 'Player 1', O: 'Player 2' },
  gameOver: false,
};

// DOM refs
const playerSetup = document.getElementById('playerSetup');
const gameArea    = document.getElementById('gameArea');
const statusEl    = document.getElementById('status');
const cells       = document.querySelectorAll('.cell');
const scoreEl1    = document.getElementById('score1');
const scoreEl2    = document.getElementById('score2');
const scoreElDraw = document.getElementById('scoreDraw');
const scoreLabel1 = document.getElementById('scoreLabel1');
const scoreLabel2 = document.getElementById('scoreLabel2');
const scoreCard1  = document.getElementById('scoreCard1');
const scoreCard2  = document.getElementById('scoreCard2');

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', resetRound);
document.getElementById('newGameBtn').addEventListener('click', newGame);
cells.forEach(cell => cell.addEventListener('click', onCellClick));

// ---- Speech ----
function speak(text, onEnd) {
  if (!window.speechSynthesis) return onEnd && onEnd();
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
}

function startGame() {
  const name1 = document.getElementById('player1Name').value.trim() || 'Player 1';
  const name2 = document.getElementById('player2Name').value.trim() || 'Player 2';
  state.players.X = sanitize(name1);
  state.players.O = sanitize(name2);

  scoreLabel1.textContent = state.players.X;
  scoreLabel2.textContent = state.players.O;

  state.scores = { X: 0, O: 0, draw: 0 };
  updateScoreboard();

  playerSetup.classList.add('hidden');
  gameArea.classList.remove('hidden');
  resetRound();

  const introText = `Welcome to Tic Tac Toe! ` +
    `Player one is ${state.players.X}, playing as X. ` +
    `Player two is ${state.players.O}, playing as O. ` +
    `${state.players.X} goes first. Good luck!`;
  speak(introText);
}

function onCellClick(event) {
  const index = parseInt(event.currentTarget.dataset.index, 10);
  if (state.board[index] || state.gameOver) return;

  state.board[index] = state.currentPlayer;
  renderCell(event.currentTarget, state.currentPlayer);

  const winner = checkWinner();
  if (winner) {
    highlightWinningCells(winner.combo);
    state.scores[state.currentPlayer]++;
    updateScoreboard();
    setStatus(`${state.players[state.currentPlayer]} wins! 🎉`);
    state.gameOver = true;
    speak(`Congratulations ${state.players[state.currentPlayer]}! You won! Well played!`);
    return;
  }

  if (state.board.every(Boolean)) {
    state.scores.draw++;
    updateScoreboard();
    setStatus("It's a draw!");
    state.gameOver = true;
    speak("It's a draw! Great game, both players!");
    return;
  }

  state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
  setStatus(`${state.players[state.currentPlayer]}'s turn (${state.currentPlayer})`);
  updateActiveCard();
}

function checkWinner() {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (
      state.board[a] &&
      state.board[a] === state.board[b] &&
      state.board[a] === state.board[c]
    ) {
      return { player: state.board[a], combo };
    }
  }
  return null;
}

function highlightWinningCells(combo) {
  combo.forEach(i => cells[i].classList.add('winning'));
}

function renderCell(cell, player) {
  cell.textContent = player;
  cell.classList.add('taken', player.toLowerCase());
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

function updateScoreboard() {
  scoreEl1.textContent    = state.scores.X;
  scoreEl2.textContent    = state.scores.O;
  scoreElDraw.textContent = state.scores.draw;
}

function updateActiveCard() {
  scoreCard1.classList.toggle('active-turn', state.currentPlayer === 'X');
  scoreCard2.classList.toggle('active-turn', state.currentPlayer === 'O');
}

function resetRound() {
  state.board.fill(null);
  state.currentPlayer = 'X';
  state.gameOver = false;

  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
  });

  setStatus(`${state.players.X}'s turn (X)`);
  updateActiveCard();
}

function newGame() {
  playerSetup.classList.remove('hidden');
  gameArea.classList.add('hidden');
}

function sanitize(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
