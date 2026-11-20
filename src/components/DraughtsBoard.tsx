import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Crown, Eraser, Hash, Volume2, VolumeX } from 'lucide-react';
import { coordsToSquare, squareToCoords } from '../engine/draughtsEngine';
import type { BoardArrow, BoardState, Move, PlayerColor, PositionMetrics } from '../types/draughts';

interface DraughtsBoardProps {
  board: BoardState;
  turn: PlayerColor;
  metrics: PositionMetrics;
  legalMoves: Move[];
  interactive: boolean;
  flipped: boolean;
  showNumbers: boolean;
  muted: boolean;
  lastMove?: { from: number; to: number } | null;
  arrows?: BoardArrow[];
  userArrows?: BoardArrow[];
  topLabel: string;
  topSublabel: string;
  bottomLabel: string;
  bottomSublabel: string;
  onMove: (move: Move) => void;
  onToggleFlip: () => void;
  onToggleNumbers: () => void;
  onToggleMute: () => void;
  onAddUserArrow?: (arrow: BoardArrow) => void;
  onClearUserArrows?: () => void;
}

const ARROW_COLORS: Record<NonNullable<BoardArrow['color']>, string> = {
  green: '#629924',
  gold: '#d59120',
  blue: '#3692e7',
  red: '#dc2626',
};

function getSquareCenter(sq: number, flipped: boolean): { x: number; y: number } {
  const { r, c } = squareToCoords(sq);
  const vr = flipped ? 9 - r : r;
  const vc = flipped ? 9 - c : c;
  return {
    x: vc * 100 + 50,
    y: vr * 100 + 50,
  };
}

export const DraughtsBoard: React.FC<DraughtsBoardProps> = ({
  board,
  turn,
  metrics,
  legalMoves,
  interactive,
  flipped,
  showNumbers,
  muted,
  lastMove,
  arrows = [],
  userArrows = [],
  topLabel,
  topSublabel,
  bottomLabel,
  bottomSublabel,
  onMove,
  onToggleFlip,
  onToggleNumbers,
  onToggleMute,
  onAddUserArrow,
  onClearUserArrows,
}) => {
  const [selectedSq, setSelectedSq] = useState<number | null>(null);
  const [rightDragStart, setRightDragStart] = useState<number | null>(null);

  useEffect(() => {
    setSelectedSq(null);
  }, [board, turn]);

  // Reset selection when board or turn changes externally
  const mandatoryPieces = useMemo(() => {
    const set = new Set<number>();
    if (!interactive || legalMoves.length === 0) return set;
    if (legalMoves[0].captures.length > 0) {
      for (const m of legalMoves) set.add(m.from);
    }
    return set;
  }, [interactive, legalMoves]);

  const legalTargetsForSelected = useMemo(() => {
    const map = new Map<number, Move>();
    if (selectedSq === null) return map;
    for (const m of legalMoves) {
      if (m.from === selectedSq) {
        map.set(m.to, m);
      }
    }
    return map;
  }, [selectedSq, legalMoves]);

  const handleSquareClick = (sq: number | null) => {
    if (!interactive || sq === null) {
      setSelectedSq(null);
      return;
    }

    if (selectedSq !== null) {
      const targetMove = legalTargetsForSelected.get(sq);
      if (targetMove) {
        setSelectedSq(null);
        onMove(targetMove);
        return;
      }
    }

    const piece = board[sq];
    if (piece && piece.color === turn) {
      const hasMoveFromSq = legalMoves.some((m) => m.from === sq);
      if (hasMoveFromSq) {
        setSelectedSq(sq === selectedSq ? null : sq);
        return;
      }
    }

    setSelectedSq(null);
  };

  const handleRightMouseDown = (e: React.MouseEvent, sq: number | null) => {
    if (e.button === 2 && sq !== null) {
      setRightDragStart(sq);
    }
  };

  const handleRightMouseUp = (e: React.MouseEvent, sq: number | null) => {
    if (e.button === 2 && rightDragStart !== null && sq !== null && rightDragStart !== sq) {
      onAddUserArrow?.({ from: rightDragStart, to: sq, color: 'green' });
    }
    setRightDragStart(null);
  };

  // Clamp evaluation bar between 8% and 92%
  const clampedEval = Math.max(-8, Math.min(8, metrics.evalScore));
  const whitePct = Math.round(((clampedEval + 8) / 16) * 100);
  const blackPct = 100 - whitePct;

  const topIsBlack = !flipped;
  const topPiecesLabel = topIsBlack
    ? `${metrics.blackMen + metrics.blackKings} p.${metrics.blackKings > 0 ? ` (${metrics.blackKings} D)` : ''}`
    : `${metrics.whiteMen + metrics.whiteKings} p.${metrics.whiteKings > 0 ? ` (${metrics.whiteKings} D)` : ''}`;
  const bottomPiecesLabel = topIsBlack
    ? `${metrics.whiteMen + metrics.whiteKings} p.${metrics.whiteKings > 0 ? ` (${metrics.whiteKings} D)` : ''}`
    : `${metrics.blackMen + metrics.blackKings} p.${metrics.blackKings > 0 ? ` (${metrics.blackKings} D)` : ''}`;
  const topTempo = topIsBlack ? metrics.blackTempo : metrics.whiteTempo;
  const bottomTempo = topIsBlack ? metrics.whiteTempo : metrics.blackTempo;
  const topActive = (topIsBlack && turn === 'B') || (!topIsBlack && turn === 'W');
  const bottomActive = !topActive;

  const allArrows = [...arrows, ...userArrows];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Compact Board Utility Toolbar */}
      <div className="w-full max-w-[640px] flex items-center justify-between gap-2 pb-2.5 text-xs">
        <div className="flex items-center gap-2 text-[#a39f96]">
          <span className="font-medium text-white">
            {turn === 'W' ? 'Trait aux Blancs' : 'Trait aux Noirs'}
          </span>
          {mandatoryPieces.size > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#e0a840] font-medium">
                Prise obligatoire ({legalMoves[0].captures.length}{' '}
                {legalMoves[0].captures.length > 1 ? 'pièces' : 'pièce'})
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {userArrows.length > 0 && onClearUserArrows && (
            <button
              type="button"
              onClick={onClearUserArrows}
              className="px-2.5 py-1.5 rounded-md bg-[#262421] hover:bg-[#302e2c] border border-[#3c3934] text-[#bababa] hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Effacer les flèches tracées"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flèches</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleNumbers}
            className={`px-2.5 py-1.5 rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              showNumbers
                ? 'bg-[#302e2c] border-[#629924]/60 text-white'
                : 'bg-[#262421] border-[#3c3934] text-[#a39f96] hover:text-white'
            }`}
            title="Afficher / masquer la numérotation Manoury (1-50)"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>1–50</span>
          </button>
          <button
            type="button"
            onClick={onToggleFlip}
            className="px-2.5 py-1.5 rounded-md bg-[#262421] hover:bg-[#302e2c] border border-[#3c3934] text-[#bababa] hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Retourner le damier"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pivoter</span>
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            className="p-1.5 rounded-md bg-[#262421] hover:bg-[#302e2c] border border-[#3c3934] text-[#bababa] hover:text-white transition-colors shrink-0"
            title={muted ? 'Activer le son' : 'Couper le son'}
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Top Player Bar */}
      <div
        className={`w-full max-w-[640px] flex items-center justify-between bg-[#262421] px-4 py-2 rounded-t-lg border border-b-0 transition-colors ${
          topActive ? 'border-[#629924]/70' : 'border-[#3c3934]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-3.5 h-3.5 rounded-full shrink-0 border ${
              topIsBlack
                ? 'bg-[#1c1a18] border-[#6e6a63]'
                : 'bg-[#f1efe9] border-[#a8a295]'
            }`}
          />
          <span className="font-semibold text-sm text-white truncate">{topLabel}</span>
          <span className="text-xs text-[#9c9890] truncate hidden sm:inline">· {topSublabel}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-[#bababa] shrink-0">
          <span>{topPiecesLabel}</span>
          <span className="text-[#8d8980]">Temps {topTempo}</span>
        </div>
      </div>

      {/* Board + Evaluation Bar */}
      <div className="w-full max-w-[640px] flex items-stretch shadow-2xl">
        {/* Evaluation Bar */}
        <div
          className="w-7 bg-[#1d1b18] border-y border-l border-[#3c3934] flex flex-col justify-between relative overflow-hidden shrink-0"
          title={`Évaluation : ${metrics.evalScore > 0 ? '+' : ''}${metrics.evalScore.toFixed(1)} pions`}
        >
          <div
            className="bg-[#2a2724] w-full transition-all duration-300 ease-out"
            style={{ height: `${flipped ? whitePct : blackPct}%` }}
          />
          <div
            className="bg-[#e8e4da] w-full flex-1 transition-all duration-300 ease-out"
          />
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[10px] font-mono font-bold text-[#d59120] bg-[#161512]/90 py-0.5 border-y border-[#3c3934]/80">
            {metrics.evalScore > 0 ? `+${metrics.evalScore.toFixed(1)}` : metrics.evalScore.toFixed(1)}
          </span>
        </div>

        {/* 10x10 Grid */}
        <div
          className="relative flex-1 aspect-square bg-[#2b2620] border border-[#3c3934] overflow-hidden"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="w-full h-full grid grid-cols-10 grid-rows-10">
            {Array.from({ length: 100 }).map((_, idx) => {
              const vr = Math.floor(idx / 10);
              const vc = idx % 10;
              const r = flipped ? 9 - vr : vr;
              const c = flipped ? 9 - vc : vc;
              const sq = coordsToSquare(r, c);
              const isDark = sq !== null;
              const piece = sq ? board[sq] : null;

              const isSelected = sq !== null && sq === selectedSq;
              const isLastMove =
                sq !== null && lastMove && (lastMove.from === sq || lastMove.to === sq);
              const isMandatory = sq !== null && mandatoryPieces.has(sq);
              const targetMove = sq !== null ? legalTargetsForSelected.get(sq) : undefined;

              let bgClass = isDark ? 'bg-[#b58863]' : 'bg-[#f0d9b5]';
              if (isSelected) bgClass = 'bg-[#3b6e28]';
              else if (isLastMove && isDark) bgClass = 'bg-[#94a846]';

              return (
                <div
                  key={idx}
                  onClick={() => handleSquareClick(sq)}
                  onMouseDown={(e) => handleRightMouseDown(e, sq)}
                  onMouseUp={(e) => handleRightMouseUp(e, sq)}
                  className={`relative flex items-center justify-center ${bgClass} ${
                    isDark && interactive ? 'cursor-pointer' : 'cursor-default'
                  } transition-colors duration-100`}
                  style={
                    isMandatory && !isSelected
                      ? { boxShadow: 'inset 0 0 0 2.5px rgba(213, 145, 32, 0.9)' }
                      : undefined
                  }
                >
                  {/* Manoury Square Number */}
                  {showNumbers && sq !== null && (
                    <span
                      className={`absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-mono leading-none pointer-events-none ${
                        isSelected || isLastMove ? 'text-white/90' : 'text-[#2c2116]/70 font-semibold'
                      }`}
                    >
                      {sq}
                    </span>
                  )}

                  {/* Piece */}
                  {piece && (
                    <div
                      className={`relative w-[76%] h-[76%] rounded-full flex items-center justify-center transition-transform duration-150 ${
                        piece.color === 'W' ? 'piece-white' : 'piece-black'
                      } ${isSelected ? 'scale-105' : ''}`}
                    >
                      {piece.isKing && (
                        <Crown
                          className={`w-[54%] h-[54%] relative z-10 ${
                            piece.color === 'W'
                              ? 'text-[#b87914] fill-[#d59120]/35'
                              : 'text-[#e3a83b] fill-[#d59120]/30'
                          }`}
                          strokeWidth={2.2}
                        />
                      )}
                    </div>
                  )}

                  {/* Legal Move Target Indicator */}
                  {targetMove && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      {targetMove.captures.length > 0 ? (
                        <span className="w-[72%] h-[72%] rounded-full border-[3px] border-[#1f4d18]/80 bg-[#629924]/25" />
                      ) : (
                        <span className="w-[30%] h-[30%] rounded-full bg-[#1f4d18]/65" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SVG Tactical Arrows Overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            viewBox="0 0 1000 1000"
          >
            <defs>
              {(Object.keys(ARROW_COLORS) as NonNullable<BoardArrow['color']>[]).map((col) => (
                <marker
                  key={col}
                  id={`arrow-${col}`}
                  markerWidth="4"
                  markerHeight="4"
                  refX="2.7"
                  refY="2"
                  orient="auto"
                >
                  <path d="M 0 0.4 L 3.4 2 L 0 3.6 z" fill={ARROW_COLORS[col]} opacity="0.88" />
                </marker>
              ))}
            </defs>
            {allArrows.map((arrow, i) => {
              const p1 = getSquareCenter(arrow.from, flipped);
              const p2 = getSquareCenter(arrow.to, flipped);
              const col = arrow.color ?? 'green';
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const len = Math.hypot(dx, dy) || 1;
              const shorten = 22;
              const x2 = p2.x - (dx / len) * shorten;
              const y2 = p2.y - (dy / len) * shorten;
              return (
                <line
                  key={`${arrow.from}-${arrow.to}-${i}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={x2}
                  y2={y2}
                  stroke={ARROW_COLORS[col]}
                  strokeWidth="14"
                  strokeLinecap="round"
                  opacity="0.82"
                  markerEnd={`url(#arrow-${col})`}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Player Bar */}
      <div
        className={`w-full max-w-[640px] flex items-center justify-between bg-[#262421] px-4 py-2 rounded-b-lg border border-t-0 transition-colors ${
          bottomActive ? 'border-[#629924]/70' : 'border-[#3c3934]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-3.5 h-3.5 rounded-full shrink-0 border ${
              topIsBlack
                ? 'bg-[#f1efe9] border-[#a8a295]'
                : 'bg-[#1c1a18] border-[#6e6a63]'
            }`}
          />
          <span className="font-semibold text-sm text-white truncate">{bottomLabel}</span>
          <span className="text-xs text-[#9c9890] truncate hidden sm:inline">· {bottomSublabel}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-[#bababa] shrink-0">
          <span>{bottomPiecesLabel}</span>
          <span className="text-[#8d8980]">Temps {bottomTempo}</span>
        </div>
      </div>

      <p className="w-full max-w-[640px] mt-1.5 text-[11px] text-[#7e7a72] text-right">
        Astuce : glisser-déposer avec le bouton droit pour tracer des flèches d’analyse.
      </p>
    </div>
  );
};
