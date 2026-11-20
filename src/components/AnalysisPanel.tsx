import React, { useState } from 'react';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { OPENING_PRESETS } from '../data/hooglandData';
import type { HistoryEntry, PlayerColor, PositionMetrics } from '../types/draughts';

interface AnalysisPanelProps {
  mode: 'ai' | 'local';
  playerColor: PlayerColor;
  aiDepth: number;
  isThinking: boolean;
  gameOverWinner: PlayerColor | null;
  history: HistoryEntry[];
  viewIndex: number;
  metrics: PositionMetrics;
  activePresetId: string;
  pdnText: string;
  onChangeMode: (mode: 'ai' | 'local') => void;
  onChangePlayerColor: (color: PlayerColor) => void;
  onChangeAiDepth: (depth: number) => void;
  onSelectPreset: (presetId: string) => void;
  onJumpToPly: (plyIndex: number) => void;
  onResetGame: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  mode,
  playerColor,
  aiDepth,
  isThinking,
  gameOverWinner,
  history,
  viewIndex,
  metrics,
  activePresetId,
  pdnText,
  onChangeMode,
  onChangePlayerColor,
  onChangeAiDepth,
  onSelectPreset,
  onJumpToPly,
  onResetGame,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPdn = () => {
    navigator.clipboard?.writeText(pdnText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Group half-moves into full-move rows
  const moveRows: { number: number; white?: HistoryEntry & { idx: number }; black?: HistoryEntry & { idx: number } }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    moveRows.push({
      number: Math.floor(i / 2) + 1,
      white: { ...history[i], idx: i },
      black: history[i + 1] ? { ...history[i + 1], idx: i + 1 } : undefined,
    });
  }

  return (
    <div className="bg-[#262421] border border-[#3c3934] rounded-xl p-5 flex flex-col gap-5">
      {/* Mode & Opponent Settings */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">Échiquier & Moteur</h2>
          {isThinking && (
            <span className="text-xs font-mono text-[#d59120]">Calcul en cours…</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-[#161512] rounded-lg border border-[#3c3934]">
          <button
            type="button"
            onClick={() => onChangeMode('ai')}
            className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'ai'
                ? 'bg-[#302e2c] text-white'
                : 'text-[#9c9890] hover:text-white'
            }`}
          >
            Contre le moteur
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('local')}
            className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'local'
                ? 'bg-[#302e2c] text-white'
                : 'text-[#9c9890] hover:text-white'
            }`}
          >
            Analyse libre (2J)
          </button>
        </div>

        {mode === 'ai' && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs text-[#9c9890] mb-1.5">Votre camp</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#161512] rounded-lg border border-[#3c3934]">
                <button
                  type="button"
                  onClick={() => onChangePlayerColor('W')}
                  className={`py-1 px-2 rounded text-xs font-medium transition-colors ${
                    playerColor === 'W'
                      ? 'bg-[#302e2c] text-white'
                      : 'text-[#9c9890] hover:text-white'
                  }`}
                >
                  Blancs
                </button>
                <button
                  type="button"
                  onClick={() => onChangePlayerColor('B')}
                  className={`py-1 px-2 rounded text-xs font-medium transition-colors ${
                    playerColor === 'B'
                      ? 'bg-[#302e2c] text-white'
                      : 'text-[#9c9890] hover:text-white'
                  }`}
                >
                  Noirs
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="ai-depth" className="block text-xs text-[#9c9890] mb-1.5">
                Niveau moteur
              </label>
              <select
                id="ai-depth"
                value={aiDepth}
                onChange={(e) => onChangeAiDepth(Number(e.target.value))}
                className="w-full bg-[#161512] border border-[#3c3934] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#629924]"
              >
                <option value={2}>Initiation (Prof. 2)</option>
                <option value={4}>Club KNDB (Prof. 4)</option>
                <option value={5}>Hoogland (Prof. 5)</option>
                <option value={6}>Expert (Prof. 6)</option>
                <option value={7}>Maître National (Prof. 7)</option>
                <option value={8}>Grand Maître (Prof. 8)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Game Over Banner */}
      {gameOverWinner && (
        <div className="p-3.5 rounded-lg bg-[#1d2817] border border-[#629924]/50 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              {gameOverWinner === 'W' ? 'Victoire des Blancs' : 'Victoire des Noirs'}
            </p>
            <p className="text-xs text-[#b5c2aa]">Plus aucun coup légal disponible.</p>
          </div>
          <button
            type="button"
            onClick={onResetGame}
            className="px-3.5 py-1.5 rounded-md bg-[#629924] hover:bg-[#75b52c] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Rejouer
          </button>
        </div>
      )}

      {/* Hoogland Telemetry Strip (Hairline separated, zero card nesting) */}
      <div className="border-y border-[#3c3934] py-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#9c9890]">Structure détectée</span>
          <span className="font-medium text-white">{metrics.structureLabel}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
          <div>
            <div className="text-[#8d8980]">Matériel (B / N)</div>
            <div className="font-mono text-sm font-semibold text-white mt-0.5">
              {metrics.whiteMen + metrics.whiteKings} / {metrics.blackMen + metrics.blackKings}
            </div>
          </div>
          <div>
            <div className="text-[#8d8980]">Différence temps</div>
            <div className="font-mono text-sm font-semibold text-white mt-0.5">
              {metrics.tempoDiff > 0 ? `+${metrics.tempoDiff}` : metrics.tempoDiff}
            </div>
          </div>
          <div>
            <div className="text-[#8d8980]">Centre (B / N)</div>
            <div className="font-mono text-sm font-semibold text-white mt-0.5">
              {metrics.whiteCenter} / {metrics.blackCenter}
            </div>
          </div>
        </div>
      </div>

      {/* Opening Structure Presets */}
      <div>
        <label htmlFor="opening-preset" className="block text-xs text-[#9c9890] mb-1.5">
          Ouverture / Position de départ
        </label>
        <select
          id="opening-preset"
          value={activePresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="w-full bg-[#161512] border border-[#3c3934] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#629924]"
        >
          {OPENING_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      {/* PDN Move Sheet */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#c4c1ba]">Feuille de partie (PDN)</span>
          <button
            type="button"
            onClick={handleCopyPdn}
            className="text-xs text-[#9c9890] hover:text-white flex items-center gap-1 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#629924]" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier PDN</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-[#161512] border border-[#3c3934] rounded-lg h-48 overflow-y-auto p-2 font-mono text-xs">
          {moveRows.length === 0 ? (
            <p className="text-[#78746d] p-2">
              Jouez un coup sur le damier pour enregistrer la partie en notation Manoury.
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {moveRows.map((row) => (
                <div key={row.number} className="grid grid-cols-12 items-center py-0.5">
                  <span className="col-span-2 text-[#78746d] pl-1">{row.number}.</span>
                  {row.white && (
                    <button
                      type="button"
                      onClick={() => onJumpToPly(row.white!.idx)}
                      className={`col-span-5 text-left px-2 py-0.5 rounded transition-colors ${
                        viewIndex === row.white.idx
                          ? 'bg-[#629924] text-white font-semibold'
                          : 'text-[#d8d5ce] hover:bg-[#262421]'
                      }`}
                    >
                      {row.white.notation}
                    </button>
                  )}
                  {row.black && (
                    <button
                      type="button"
                      onClick={() => onJumpToPly(row.black!.idx)}
                      className={`col-span-5 text-left px-2 py-0.5 rounded transition-colors ${
                        viewIndex === row.black.idx
                          ? 'bg-[#629924] text-white font-semibold'
                          : 'text-[#d8d5ce] hover:bg-[#262421]'
                      }`}
                    >
                      {row.black.notation}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            disabled={viewIndex < 0}
            onClick={() => onJumpToPly(-1)}
            className="py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-35 border border-[#3c3934] flex items-center justify-center text-[#bababa] transition-colors"
            title="Début de la partie"
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={viewIndex < 0}
            onClick={() => onJumpToPly(viewIndex - 1)}
            className="py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-35 border border-[#3c3934] flex items-center justify-center text-[#bababa] transition-colors"
            title="Coup précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={viewIndex >= history.length - 1}
            onClick={() => onJumpToPly(viewIndex + 1)}
            className="py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-35 border border-[#3c3934] flex items-center justify-center text-[#bababa] transition-colors"
            title="Coup suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={viewIndex >= history.length - 1}
            onClick={() => onJumpToPly(history.length - 1)}
            className="py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-35 border border-[#3c3934] flex items-center justify-center text-[#bababa] transition-colors"
            title="Position actuelle"
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
