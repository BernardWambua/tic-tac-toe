'use strict';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// ---- Firebase refs ----
const auth = firebase.auth();
const db   = firebase.firestore();

let currentUser  = null;
let currentRoom  = null;
let mySymbol     = null;
let introSpoken  = false;
let unsubscribe  = null;

// ---- Screen helpers ----
const screens = {
  auth:  document.getElementById('authScreen'),
  lobby: document.getElementById('lobbyScreen'),
  game:  document.getElementById('gameArea'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[name].classList.remove('hidden');
}

// ==================================================
// AUTH
// ==================================================
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    document.getElementById('lobbyUserName').textContent =
      user.displayName || user.email;
    showScreen('lobby');
  } else {
    currentUser = null;
    showScreen('auth');
  }
});

let authMode = 'login';

document.getElementById('authSubmit').addEventListener('click', handleAuth);
document.getElementById('authToggle').addEventListener('click', toggleAuthMode);
document.getElementById('signOutBtn').addEventListener('click', () => auth.signOut());

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  const isReg = authMode === 'register';
  document.getElementById('authTitle').textContent    = isReg ? 'Create Account' : 'Sign In';
  document.getElementById('authSubmit').textContent   = isReg ? 'Register' : 'Sign In';
  document.getElementById('authToggle').textContent   = isReg
    ? 'Already have an account? Sign In'
    : "Don't have an account? Register";
  document.getElementById('displayNameGroup').classList.toggle('hidden', !isReg);
  document.getElementById('authError').textContent = '';
}

async function handleAuth() {
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errorEl  = document.getElementById('authError');
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Please fill in all fields.';
    return;
  }

  try {
    if (authMode === 'register') {
      const rawName    = document.getElementById('displayNameInput').value.trim();
      const displayName = rawName || email.split('@')[0];
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName });
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
  } catch (err) {
    errorEl.textContent = friendlyAuthError(err.code);
  }
}

function friendlyAuthError(code) {
  const map = {
    'auth/email-already-in-use': 'That email is already registered.',
    'auth/invalid-email':        'Invalid email address.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/invalid-credential':   'Invalid email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// ==================================================
// LOBBY
// ==================================================
document.getElementById('createRoomBtn').addEventListener('click', createRoom);
document.getElementById('joinRoomBtn').addEventListener('click', joinRoom);

async function createRoom() {
  const lobbyError = document.getElementById('lobbyError');
  const createBtn  = document.getElementById('createRoomBtn');
  lobbyError.textContent = '';
  createBtn.disabled = true;
  createBtn.textContent = 'Creating...';

  try {
    const playerName = currentUser.displayName || currentUser.email;
    const roomId = generateRoomCode();

    await db.collection('rooms').doc(roomId).set({
      board:         Array(9).fill(null),
      currentPlayer: 'X',
      players:       { X: { uid: currentUser.uid, name: playerName }, O: null },
      status:        'waiting',
      winner:        null,
      scores:        { X: 0, O: 0, draw: 0 },
      createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
    });

    currentRoom = roomId;
    mySymbol    = 'X';
    enterGame(roomId);
  } catch (err) {
    console.error('createRoom error:', err);
    lobbyError.textContent = `Failed to create room: ${err.message}`;
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = 'Create Room';
  }
}

async function joinRoom() {
  const lobbyError = document.getElementById('lobbyError');
  lobbyError.textContent = '';
  const roomId = document.getElementById('roomCodeInput').value.trim().toUpperCase();

  if (roomId.length !== 6) {
    lobbyError.textContent = 'Please enter a valid 6-character room code.';
    return;
  }

  const roomRef = db.collection('rooms').doc(roomId);
  const snap    = await roomRef.get();

  if (!snap.exists) {
    lobbyError.textContent = 'Room not found. Check the code and try again.';
    return;
  }

  const data = snap.data();

  if (data.status !== 'waiting') {
    lobbyError.textContent = 'This room is already full or the game has ended.';
    return;
  }

  if (data.players.X && data.players.X.uid === currentUser.uid) {
    lobbyError.textContent = "You can't join your own room with the same account.";
    return;
  }

  try {
    const playerName = currentUser.displayName || currentUser.email;
    await roomRef.update({
      'players.O': { uid: currentUser.uid, name: playerName },
      status:      'playing',
    });

    currentRoom = roomId;
    mySymbol    = 'O';
    enterGame(roomId);
  } catch (err) {
    console.error('joinRoom error:', err);
    lobbyError.textContent = `Failed to join room: ${err.message}`;
  }
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// ==================================================
// GAME
// ==================================================
const cells      = document.querySelectorAll('.cell');
const statusEl   = document.getElementById('status');
const scoreCard1 = document.getElementById('scoreCard1');
const scoreCard2 = document.getElementById('scoreCard2');

cells.forEach(cell => cell.addEventListener('click', onCellClick));
document.getElementById('restartBtn').addEventListener('click', restartRound);
document.getElementById('leaveRoomBtn').addEventListener('click', leaveRoom);

function enterGame(roomId) {
  introSpoken = false;
  showScreen('game');
  document.getElementById('roomCodeDisplay').textContent = `Room: ${roomId}`;

  if (unsubscribe) unsubscribe();
  unsubscribe = db.collection('rooms').doc(roomId).onSnapshot(snap => {
    if (!snap.exists) { leaveRoom(); return; }
    renderGameState(snap.data());
  });
}

function renderGameState(data) {
  const nameX = data.players.X?.name || 'Player X';
  const nameO = data.players.O?.name || 'Waiting...';

  document.getElementById('scoreLabel1').textContent = nameX;
  document.getElementById('scoreLabel2').textContent = nameO;
  document.getElementById('score1').textContent      = data.scores.X;
  document.getElementById('score2').textContent      = data.scores.O;
  document.getElementById('scoreDraw').textContent   = data.scores.draw;

  cells.forEach((cell, i) => {
    const val = data.board[i];
    cell.textContent = val || '';
    cell.className   = 'cell';
    if (val) cell.classList.add('taken', val.toLowerCase());
  });

  scoreCard1.classList.remove('active-turn');
  scoreCard2.classList.remove('active-turn');

  if (data.winner && data.winner !== 'draw') {
    const combo = findWinningCombo(data.board);
    if (combo) combo.forEach(i => cells[i].classList.add('winning'));
  }

  if (data.status === 'waiting') {
    setStatus('Waiting for opponent to join\u2026');
    return;
  }

  if (data.winner === 'draw') {
    setStatus("It's a draw!");
    speak("It's a draw! Great game, both players!");
  } else if (data.winner) {
    const winnerName = data.players[data.winner]?.name || data.winner;
    setStatus(`${winnerName} wins! \ud83c\udf89`);
    if (data.winner === mySymbol) speak(`Congratulations ${winnerName}! You won! Well played!`);
    else speak(`${winnerName} wins! Better luck next time!`);
  } else {
    const turnName = data.players[data.currentPlayer]?.name || data.currentPlayer;
    setStatus(`${turnName}'s turn (${data.currentPlayer})`);
    if (data.currentPlayer === 'X') scoreCard1.classList.add('active-turn');
    else scoreCard2.classList.add('active-turn');

    if (!introSpoken) {
      introSpoken = true;
      speak(
        `Welcome to Tic Tac Toe! ${nameX} plays X, ${nameO} plays O. ` +
        `${nameX} goes first. Good luck!`
      );
    }
  }
}

async function onCellClick(event) {
  if (!currentRoom || !mySymbol) return;

  const roomRef = db.collection('rooms').doc(currentRoom);
  const snap    = await roomRef.get();
  const data    = snap.data();

  const index = parseInt(event.currentTarget.dataset.index, 10);
  if (data.board[index] || data.winner || data.status !== 'playing') return;
  if (data.currentPlayer !== mySymbol) return;

  const newBoard = [...data.board];
  newBoard[index] = mySymbol;

  const winner = checkWinner(newBoard);
  const isDraw = !winner && newBoard.every(Boolean);

  const newScores = { ...data.scores };
  if (winner) newScores[winner]++;
  else if (isDraw) newScores.draw++;

  await roomRef.update({
    board:         newBoard,
    currentPlayer: mySymbol === 'X' ? 'O' : 'X',
    winner:        winner || (isDraw ? 'draw' : null),
    scores:        newScores,
  });
}

async function restartRound() {
  if (!currentRoom) return;
  introSpoken = false;
  await db.collection('rooms').doc(currentRoom).update({
    board:         Array(9).fill(null),
    currentPlayer: 'X',
    winner:        null,
    status:        'playing',
  });
}

function leaveRoom() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  currentRoom = null;
  mySymbol    = null;
  introSpoken = false;
  document.getElementById('roomCodeInput').value = '';
  showScreen('lobby');
}

// ==================================================
// HELPERS
// ==================================================
function checkWinner(board) {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function findWinningCombo(board) {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return combo;
  }
  return null;
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate  = 0.95;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

function setStatus(msg) {
  statusEl.textContent = msg;
}
