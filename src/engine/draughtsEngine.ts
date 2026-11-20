import type { BoardState, Move, Piece, PlayerColor, PositionMetrics } from '../types/draughts';

const DIRS: readonly [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export function squareToCoords(sq: number): { r: number; c: number } {
  const idx = sq - 1;
  const r = Math.floor(idx / 5);
  const c = (idx % 5) * 2 + (r % 2 === 0 ? 1 : 0);
  return { r, c };
}

export function coordsToSquare(r: number, c: number): number | null {
  if (r < 0 || r > 9 || c < 0 || c > 9) return null;
  if ((r + c) % 2 === 0) return null;
  return r * 5 + Math.floor(c / 2) + 1;
}

export function createEmptyBoard(): BoardState {
  return Array<Piece | null>(51).fill(null);
}

export function createInitialBoard(): BoardState {
  const board = createEmptyBoard();
  for (let sq = 1; sq <= 20; sq++) {
    board[sq] = { color: 'B', isKing: false };
  }
  for (let sq = 31; sq <= 50; sq++) {
    board[sq] = { color: 'W', isKing: false };
  }
  return board;
}

export function buildBoard(spec: {
  whiteMen?: number[];
  whiteKings?: number[];
  blackMen?: number[];
  blackKings?: number[];
}): BoardState {
  const board = createEmptyBoard();
  for (const sq of spec.whiteMen ?? []) board[sq] = { color: 'W', isKing: false };
  for (const sq of spec.whiteKings ?? []) board[sq] = { color: 'W', isKing: true };
  for (const sq of spec.blackMen ?? []) board[sq] = { color: 'B', isKing: false };
  for (const sq of spec.blackKings ?? []) board[sq] = { color: 'B', isKing: true };
  return board;
}

export function cloneBoard(board: BoardState): BoardState {
  return board.map((p) => (p ? { ...p } : null));
}

function isPromotionSquare(sq: number, color: PlayerColor): boolean {
  return color === 'W' ? sq >= 1 && sq <= 5 : sq >= 46 && sq <= 50;
}

/**
 * Generates all capture sequences for a single piece starting at `startSq`.
 * Uses FMJD Turkish Strike rule: captured pieces stay on the board until the end
 * of the capture sequence (blocking re-jumps and landings), while `startSq` is vacated.
 */
function findCapturesForPiece(
  board: BoardState,
  startSq: number,
  piece: Piece
): Move[] {
  const tempBoard = cloneBoard(board);
  tempBoard[startSq] = null;

  const results: Move[] = [];
  const enemy: PlayerColor = piece.color === 'W' ? 'B' : 'W';

  function dfsMan(curSq: number, captured: number[], path: number[]) {
    const { r, c } = squareToCoords(curSq);
    let extended = false;

    for (const [dr, dc] of DIRS) {
      const midSq = coordsToSquare(r + dr, c + dc);
      const landSq = coordsToSquare(r + 2 * dr, c + 2 * dc);
      if (!midSq || !landSq) continue;
      if (captured.includes(midSq) || captured.includes(landSq)) continue;

      const midPiece = tempBoard[midSq];
      if (midPiece && midPiece.color === enemy && tempBoard[landSq] === null) {
        extended = true;
        dfsMan(landSq, [...captured, midSq], [...path, landSq]);
      }
    }

    if (!extended && captured.length > 0) {
      results.push({
        from: startSq,
        to: curSq,
        captures: captured,
        path,
        promotes: !piece.isKing && isPromotionSquare(curSq, piece.color),
      });
    }
  }

  function dfsKing(curSq: number, captured: number[], path: number[]) {
    const { r, c } = squareToCoords(curSq);
    let extended = false;

    for (const [dr, dc] of DIRS) {
      let step = 1;
      let enemySq: number | null = null;

      while (true) {
        const nextSq = coordsToSquare(r + step * dr, c + step * dc);
        if (!nextSq) break;

        if (captured.includes(nextSq)) {
          // Already captured piece acts as a hard barrier
          break;
        }

        const occ = tempBoard[nextSq];
        if (occ === null) {
          if (enemySq !== null) {
            extended = true;
            dfsKing(nextSq, [...captured, enemySq], [...path, nextSq]);
          }
          step++;
        } else if (occ.color === enemy && enemySq === null) {
          enemySq = nextSq;
          step++;
        } else {
          // Friendly piece or second opponent piece blocks further travel
          break;
        }
      }
    }

    if (!extended && captured.length > 0) {
      results.push({
        from: startSq,
        to: curSq,
        captures: captured,
        path,
        promotes: false,
      });
    }
  }

  if (piece.isKing) {
    dfsKing(startSq, [], [startSq]);
  } else {
    dfsMan(startSq, [], [startSq]);
  }

  return results;
}

/**
 * Generates all legal moves for `turn` according to FMJD/KNDB rules,
 * strictly enforcing the Majority Capture rule (Prise majoritaire).
 */
export function getLegalMoves(board: BoardState, turn: PlayerColor): Move[] {
  const allCaptures: Move[] = [];

  for (let sq = 1; sq <= 50; sq++) {
    const piece = board[sq];
    if (piece && piece.color === turn) {
      const caps = findCapturesForPiece(board, sq, piece);
      if (caps.length > 0) {
        allCaptures.push(...caps);
      }
    }
  }

  if (allCaptures.length > 0) {
    let maxLen = 0;
    for (const m of allCaptures) {
      if (m.captures.length > maxLen) maxLen = m.captures.length;
    }
    return allCaptures.filter((m) => m.captures.length === maxLen);
  }

  // Non-capturing moves
  const quietMoves: Move[] = [];
  const forwardDr = turn === 'W' ? -1 : 1;

  for (let sq = 1; sq <= 50; sq++) {
    const piece = board[sq];
    if (!piece || piece.color !== turn) continue;
    const { r, c } = squareToCoords(sq);

    if (!piece.isKing) {
      for (const dc of [-1, 1]) {
        const nextSq = coordsToSquare(r + forwardDr, c + dc);
        if (nextSq && board[nextSq] === null) {
          quietMoves.push({
            from: sq,
            to: nextSq,
            captures: [],
            path: [sq, nextSq],
            promotes: isPromotionSquare(nextSq, turn),
          });
        }
      }
    } else {
      for (const [dr, dc] of DIRS) {
        let step = 1;
        while (true) {
          const nextSq = coordsToSquare(r + step * dr, c + step * dc);
          if (!nextSq || board[nextSq] !== null) break;
          quietMoves.push({
            from: sq,
            to: nextSq,
            captures: [],
            path: [sq, nextSq],
            promotes: false,
          });
          step++;
        }
      }
    }
  }

  return quietMoves;
}

export function applyMove(board: BoardState, move: Move): BoardState {
  const next = cloneBoard(board);
  const moving = next[move.from];
  if (!moving) return next;

  next[move.from] = null;
  for (const capSq of move.captures) {
    next[capSq] = null;
  }

  next[move.to] = {
    color: moving.color,
    isKing: moving.isKing || move.promotes,
  };

  return next;
}

export function formatMoveNotation(move: Move): string {
  const sep = move.captures.length > 0 ? 'x' : '-';
  return `${move.from}${sep}${move.to}`;
}

export function boardToPdnFen(board: BoardState, turn: PlayerColor): string {
  const whites: string[] = [];
  const blacks: string[] = [];
  for (let sq = 1; sq <= 50; sq++) {
    const p = board[sq];
    if (!p) continue;
    const tok = `${p.isKing ? 'K' : ''}${sq}`;
    if (p.color === 'W') whites.push(tok);
    else blacks.push(tok);
  }
  return `[FEN "${turn}:W${whites.join(',')}:B${blacks.join(',')}"]`;
}

// Center squares (the classical 10x10 center)
const CENTER_SQUARES = new Set([22, 23, 27, 28, 32, 33, 18, 19]);
const CORE_CENTER = new Set([22, 23, 27, 28]);

/**
 * Computes authentic Hoogland / KNDB position metrics including exact Tempo,
 * material balance, center presence, and structural classification.
 */
export function analyzePosition(board: BoardState): PositionMetrics {
  let whiteMen = 0;
  let whiteKings = 0;
  let blackMen = 0;
  let blackKings = 0;
  let whiteTempo = 0;
  let blackTempo = 0;
  let whiteCenter = 0;
  let blackCenter = 0;
  let scoreCentipawns = 0;

  let whiteLeft = 0;
  let whiteRight = 0;
  let blackLeft = 0;
  let blackRight = 0;

  for (let sq = 1; sq <= 50; sq++) {
    const p = board[sq];
    if (!p) continue;
    const { r, c } = squareToCoords(sq);

    if (p.color === 'W') {
      if (p.isKing) {
        whiteKings++;
        scoreCentipawns += 340;
      } else {
        whiteMen++;
        const rankFromBottom = 10 - r; // row 9 -> 1, row 0 -> 10
        whiteTempo += rankFromBottom;
        scoreCentipawns += 100;
        // Advancement bonus (controlled)
        scoreCentipawns += (rankFromBottom - 1) * 3;
        // Baseline defense (46..50)
        if (sq === 48 || sq === 49) scoreCentipawns += 8;
        if (sq === 46 || sq === 47 || sq === 50) scoreCentipawns += 4;
        // Outpost on 24 or 27
        if (sq === 24 || sq === 27) scoreCentipawns += 12;
      }

      if (CORE_CENTER.has(sq)) {
        whiteCenter++;
        scoreCentipawns += 14;
      } else if (CENTER_SQUARES.has(sq)) {
        whiteCenter++;
        scoreCentipawns += 7;
      }

      if (c < 5) whiteLeft++;
      else whiteRight++;
    } else {
      if (p.isKing) {
        blackKings++;
        scoreCentipawns -= 340;
      } else {
        blackMen++;
        const rankFromTop = r + 1; // row 0 -> 1, row 9 -> 10
        blackTempo += rankFromTop;
        scoreCentipawns -= 100;
        scoreCentipawns -= (rankFromTop - 1) * 3;
        if (sq === 2 || sq === 3) scoreCentipawns -= 8;
        if (sq === 1 || sq === 4 || sq === 5) scoreCentipawns -= 4;
        if (sq === 24 || sq === 27) scoreCentipawns -= 12;
      }

      if (CORE_CENTER.has(sq)) {
        blackCenter++;
        scoreCentipawns -= 14;
      } else if (CENTER_SQUARES.has(sq)) {
        blackCenter++;
        scoreCentipawns -= 7;
      }

      if (c < 5) blackLeft++;
      else blackRight++;
    }
  }

  // Wing imbalance penalty (Hoogland Thème 1: équilibre des ailes)
  const whiteImbalance = Math.abs(whiteLeft - whiteRight);
  const blackImbalance = Math.abs(blackLeft - blackRight);
  if (whiteImbalance > 3) scoreCentipawns -= (whiteImbalance - 3) * 6;
  if (blackImbalance > 3) scoreCentipawns += (blackImbalance - 3) * 6;

  // Classic Hoogland structural detection
  let structureLabel = 'Position équilibrée';
  const hasWhite27 = board[27]?.color === 'W' && !board[27].isKing;
  const hasBlack24 = board[24]?.color === 'B' && !board[24].isKing;
  const hasWhite24 = board[24]?.color === 'W' && !board[24].isKing;
  const hasBlack27 = board[27]?.color === 'B' && !board[27].isKing;

  if (whiteKings + blackKings > 0 && whiteMen + blackMen <= 8) {
    structureLabel = 'Finale de dames';
  } else if (hasWhite27 && hasBlack24) {
    structureLabel = 'Structure Classique (27 / 24)';
  } else if (hasWhite24 && !hasBlack24) {
    structureLabel = 'Avant-poste blanc en 24';
  } else if (hasBlack27 && !hasWhite27) {
    structureLabel = 'Avant-poste noir en 27';
  } else if (Math.abs(whiteTempo - blackTempo) >= 6) {
    structureLabel =
      whiteTempo > blackTempo ? 'Forte avance de temps (Blancs)' : 'Forte avance de temps (Noirs)';
  } else if (whiteCenter > blackCenter + 1) {
    structureLabel = 'Contrôle du centre (Blancs)';
  } else if (blackCenter > whiteCenter + 1) {
    structureLabel = 'Contrôle du centre (Noirs)';
  }

  return {
    whiteMen,
    whiteKings,
    blackMen,
    blackKings,
    whiteTempo,
    blackTempo,
    tempoDiff: whiteTempo - blackTempo,
    whiteCenter,
    blackCenter,
    evalScore: Math.round((scoreCentipawns / 100) * 10) / 10,
    structureLabel,
  };
}

const LONG_DIAGONAL_SQUARES = new Set([5, 10, 14, 19, 23, 28, 32, 37, 41, 46]);
const EDGE_SQUARES = new Set([6, 15, 16, 25, 26, 35, 36, 45]);

function evaluateForSearch(board: BoardState, turn: PlayerColor): number {
  const metrics = analyzePosition(board);
  let score = metrics.evalScore * 100;

  // Additional experienced-level positional heuristics (supported outposts, bridge defense, king diagonals, mobility)
  let whiteActive = 0;
  let blackActive = 0;

  // Golden bridge squares (2 & 4 for Black, 47 & 49 for White guard against cheap breakthroughs)
  if (board[47]?.color === 'W' && board[49]?.color === 'W') score += 10;
  if (board[2]?.color === 'B' && board[4]?.color === 'B') score -= 10;

  // Supported outposts (Hoogland / Roozenburg / Utrecht patterns)
  if (board[24]?.color === 'W' && !board[24].isKing && (board[29]?.color === 'W' || board[30]?.color === 'W')) {
    score += 12;
  }
  if (board[22]?.color === 'W' && !board[22].isKing && (board[27]?.color === 'W' || board[28]?.color === 'W')) {
    score += 12;
  }
  if (board[27]?.color === 'B' && !board[27].isKing && (board[21]?.color === 'B' || board[22]?.color === 'B')) {
    score -= 12;
  }
  if (board[29]?.color === 'B' && !board[29].isKing && (board[23]?.color === 'B' || board[24]?.color === 'B')) {
    score -= 12;
  }

  for (let sq = 1; sq <= 50; sq++) {
    const p = board[sq];
    if (!p) continue;
    if (p.isKing) {
      const diagBonus = LONG_DIAGONAL_SQUARES.has(sq) ? 24 : CENTER_SQUARES.has(sq) ? 18 : 0;
      score += p.color === 'W' ? diagBonus : -diagBonus;
    } else {
      if (EDGE_SQUARES.has(sq)) {
        score += p.color === 'W' ? -4 : 4;
      }
      if (p.color === 'W' && sq >= 16 && sq <= 35) whiteActive++;
      if (p.color === 'B' && sq >= 16 && sq <= 35) blackActive++;
    }
  }

  score += (whiteActive - blackActive) * 3;

  // Tempo bonus for side to move
  score += turn === 'W' ? 6 : -6;
  return score;
}

function hashPosition(board: BoardState, turn: PlayerColor): string {
  let key = turn;
  for (let sq = 1; sq <= 50; sq++) {
    const p = board[sq];
    if (p) {
      key += p.color === 'W' ? (p.isKing ? 'W' : 'w') : p.isKing ? 'B' : 'b';
      key += sq;
    }
  }
  return key;
}

function moveKey(m: Move): number {
  return m.from * 100 + m.to;
}

function orderMoves(moves: Move[], ttMoveKey?: number): Move[] {
  if (moves.length <= 1) return moves;
  return [...moves].sort((a, b) => {
    const aTT = ttMoveKey !== undefined && moveKey(a) === ttMoveKey ? 10000 : 0;
    const bTT = ttMoveKey !== undefined && moveKey(b) === ttMoveKey ? 10000 : 0;
    const scoreA =
      aTT + a.captures.length * 200 + (a.promotes ? 120 : 0) + (CORE_CENTER.has(a.to) ? 18 : CENTER_SQUARES.has(a.to) ? 10 : 0);
    const scoreB =
      bTT + b.captures.length * 200 + (b.promotes ? 120 : 0) + (CORE_CENTER.has(b.to) ? 18 : CENTER_SQUARES.has(b.to) ? 10 : 0);
    return scoreB - scoreA;
  });
}

const enum TTFlag {
  EXACT = 0,
  LOWER = 1,
  UPPER = 2,
}

interface TTEntry {
  depth: number;
  flag: TTFlag;
  value: number;
  bestMoveKey: number;
}

interface SearchContext {
  tt: Map<string, TTEntry>;
  deadline: number;
  nodes: number;
  aborted: boolean;
  maxQDepth: number;
}

function checkTimeout(ctx: SearchContext): boolean {
  ctx.nodes++;
  if ((ctx.nodes & 1023) === 0 && performance.now() >= ctx.deadline) {
    ctx.aborted = true;
  }
  return ctx.aborted;
}

function quiescence(
  board: BoardState,
  turn: PlayerColor,
  alpha: number,
  beta: number,
  qDepth: number,
  ctx: SearchContext
): number {
  if (checkTimeout(ctx)) return 0;

  const moves = getLegalMoves(board, turn);
  if (moves.length === 0) {
    return turn === 'W' ? -10000 : 10000;
  }

  // Continue searching while forced captures exist
  const isForcedCapture = moves[0].captures.length > 0;
  if (!isForcedCapture || qDepth <= 0) {
    return evaluateForSearch(board, turn);
  }

  const ordered = orderMoves(moves);
  const nextTurn: PlayerColor = turn === 'W' ? 'B' : 'W';
  if (turn === 'W') {
    let best = -Infinity;
    for (const move of ordered) {
      const val = quiescence(applyMove(board, move), nextTurn, alpha, beta, qDepth - 1, ctx);
      if (ctx.aborted) return 0;
      if (val > best) best = val;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of ordered) {
      const val = quiescence(applyMove(board, move), nextTurn, alpha, beta, qDepth - 1, ctx);
      if (ctx.aborted) return 0;
      if (val < best) best = val;
      if (best < beta) beta = best;
      if (alpha >= beta) break;
    }
    return best;
  }
}

function alphabeta(
  board: BoardState,
  turn: PlayerColor,
  depth: number,
  alpha: number,
  beta: number,
  ctx: SearchContext
): number {
  if (checkTimeout(ctx)) return 0;

  const moves = getLegalMoves(board, turn);
  if (moves.length === 0) {
    return turn === 'W' ? -10000 - depth * 10 : 10000 + depth * 10;
  }

  if (depth <= 0) {
    return quiescence(board, turn, alpha, beta, ctx.maxQDepth, ctx);
  }

  const origAlpha = alpha;
  const origBeta = beta;
  const hash = hashPosition(board, turn);
  const cached = ctx.tt.get(hash);
  if (cached && cached.depth >= depth) {
    if (cached.flag === TTFlag.EXACT) return cached.value;
    if (cached.flag === TTFlag.LOWER && cached.value > alpha) alpha = cached.value;
    else if (cached.flag === TTFlag.UPPER && cached.value < beta) beta = cached.value;
    if (alpha >= beta) return cached.value;
  }

  const ordered = orderMoves(moves, cached?.bestMoveKey);
  const nextTurn: PlayerColor = turn === 'W' ? 'B' : 'W';

  let bestMove = ordered[0];
  let bestVal = turn === 'W' ? -Infinity : Infinity;

  if (turn === 'W') {
    for (const move of ordered) {
      const val = alphabeta(applyMove(board, move), nextTurn, depth - 1, alpha, beta, ctx);
      if (ctx.aborted) return 0;
      if (val > bestVal) {
        bestVal = val;
        bestMove = move;
      }
      if (bestVal > alpha) alpha = bestVal;
      if (alpha >= beta) break;
    }
  } else {
    for (const move of ordered) {
      const val = alphabeta(applyMove(board, move), nextTurn, depth - 1, alpha, beta, ctx);
      if (ctx.aborted) return 0;
      if (val < bestVal) {
        bestVal = val;
        bestMove = move;
      }
      if (bestVal < beta) beta = bestVal;
      if (alpha >= beta) break;
    }
  }

  let flag = TTFlag.EXACT;
  if (bestVal <= origAlpha) flag = TTFlag.UPPER;
  else if (bestVal >= origBeta) flag = TTFlag.LOWER;

  if (ctx.tt.size < 45000) {
    ctx.tt.set(hash, {
      depth,
      flag,
      value: bestVal,
      bestMoveKey: moveKey(bestMove),
    });
  }

  return bestVal;
}

function getTimeBudgetMs(depth: number): number {
  if (depth <= 2) return 250;
  if (depth <= 4) return 600;
  if (depth === 5) return 900;
  if (depth === 6) return 1400;
  if (depth === 7) return 2100;
  return 2900;
}

export function findBestMove(
  board: BoardState,
  turn: PlayerColor,
  depth: number
): { move: Move | null; evalScore: number } {
  const moves = getLegalMoves(board, turn);
  if (moves.length === 0) {
    return { move: null, evalScore: turn === 'W' ? -99 : 99 };
  }

  // If forced single move, return quickly with quick eval
  if (moves.length === 1) {
    const nextBoard = applyMove(board, moves[0]);
    const evalCp = evaluateForSearch(nextBoard, turn === 'W' ? 'B' : 'W');
    return { move: moves[0], evalScore: Math.round((evalCp / 100) * 10) / 10 };
  }

  const targetDepth = Math.max(1, depth);
  const ctx: SearchContext = {
    tt: new Map<string, TTEntry>(),
    deadline: performance.now() + getTimeBudgetMs(targetDepth),
    nodes: 0,
    aborted: false,
    maxQDepth: targetDepth >= 6 ? 8 : 4,
  };

  let completedMove = orderMoves(moves)[0];
  let completedVal = evaluateForSearch(applyMove(board, completedMove), turn === 'W' ? 'B' : 'W');
  let prevBestKey = moveKey(completedMove);
  const nextTurn: PlayerColor = turn === 'W' ? 'B' : 'W';

  // Iterative deepening: depth 1 up to targetDepth, keeping last fully completed iteration
  for (let d = 1; d <= targetDepth; d++) {
    const ordered = orderMoves(moves, prevBestKey);
    let iterBestMove = ordered[0];
    let iterBestVal = turn === 'W' ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of ordered) {
      const val = alphabeta(applyMove(board, move), nextTurn, Math.max(0, d - 1), alpha, beta, ctx);
      if (ctx.aborted) break;

      if (turn === 'W') {
        if (val > iterBestVal) {
          iterBestVal = val;
          iterBestMove = move;
        }
        if (iterBestVal > alpha) alpha = iterBestVal;
      } else {
        if (val < iterBestVal) {
          iterBestVal = val;
          iterBestMove = move;
        }
        if (iterBestVal < beta) beta = iterBestVal;
      }
    }

    if (ctx.aborted) break;

    completedMove = iterBestMove;
    completedVal = iterBestVal;
    prevBestKey = moveKey(iterBestMove);

    // Stop early if forced win already found
    if (Math.abs(completedVal) >= 9000) break;
  }

  return {
    move: completedMove,
    evalScore: Math.round((completedVal / 100) * 10) / 10,
  };
}
