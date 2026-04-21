const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

function checkWinner(board) {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function validateBoard(board) {
  if (!Array.isArray(board) || board.length !== 9) return false;
  return board.every(v => v === null || v === 'X' || v === 'O');
}

async function askGroqForMove(board, aiSymbol, apiKey) {
  const legalMoves = board
    .map((v, i) => (v ? null : i))
    .filter(v => v !== null);

  const prompt = [
    'You play Tic Tac Toe.',
    `Board indices are 0-8 in row-major order: [0,1,2,3,4,5,6,7,8].`,
    `Board state: ${JSON.stringify(board)}.`,
    `Your symbol: ${aiSymbol}.`,
    `Legal moves: ${JSON.stringify(legalMoves)}.`,
    'Return ONLY a single integer from legal moves, no text.'
  ].join(' ');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      max_tokens: 8,
      messages: [
        { role: 'system', content: 'You are a strict game move generator.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  const match = String(text).match(/-?\d+/);
  if (!match) {
    throw new Error('No numeric move in Groq response');
  }

  const move = Number(match[0]);
  if (!Number.isInteger(move) || move < 0 || move > 8 || board[move]) {
    throw new Error(`Invalid move from Groq: ${move}`);
  }

  return move;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return json({ ok: true }, 200);

    const { pathname } = new URL(request.url);
    if (pathname !== '/move') return json({ error: 'Not found' }, 404);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    if (!env.GROQ_API_KEY) {
      return json({ error: 'Proxy secret GROQ_API_KEY is not configured' }, 500);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const board = payload?.board;
    const aiSymbol = payload?.aiSymbol === 'X' ? 'X' : 'O';

    if (!validateBoard(board)) {
      return json({ error: 'Invalid board payload' }, 400);
    }

    if (checkWinner(board) || board.every(Boolean)) {
      return json({ error: 'Game is already finished' }, 400);
    }

    try {
      const move = await askGroqForMove(board, aiSymbol, env.GROQ_API_KEY);
      return json({ move }, 200);
    } catch (err) {
      console.error('askGroqForMove failed:', err);
      return json({ error: 'Groq request failed' }, 502);
    }
  },
};
