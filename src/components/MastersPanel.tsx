import React from 'react';
import {
  ArrowUpRight,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MASTER_LESSONS } from '../data/hooglandData';
import type { BoardState, MasterLesson, PlayerColor } from '../types/draughts';

interface MastersPanelProps {
  selectedLesson: MasterLesson;
  stepIndex: number; // -1 = initial position, 0..N-1 = after move i
  currentBoard: BoardState;
  currentTurn: PlayerColor;
  notations: string[];
  onSelectLesson: (lessonId: string) => void;
  onChangeStep: (step: number) => void;
  onSendToAnalysis: (board: BoardState, turn: PlayerColor) => void;
}

export const MastersPanel: React.FC<MastersPanelProps> = ({
  selectedLesson,
  stepIndex,
  currentBoard,
  currentTurn,
  notations,
  onSelectLesson,
  onChangeStep,
  onSendToAnalysis,
}) => {
  const activeComment =
    stepIndex >= 0 && selectedLesson.moves[stepIndex]
      ? selectedLesson.moves[stepIndex].comment
      : selectedLesson.summary;

  return (
    <div className="bg-[#262421] border border-[#3c3934] rounded-xl p-5 flex flex-col gap-5">
      {/* Lesson Selector List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Thèmes & Parties de Maîtres</h2>
          <span className="text-xs font-mono text-[#9c9890]">
            {MASTER_LESSONS.length} leçons
          </span>
        </div>

        <div className="flex flex-col divide-y divide-[#3c3934] border-y border-[#3c3934]">
          {MASTER_LESSONS.map((lesson) => {
            const active = lesson.id === selectedLesson.id;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => onSelectLesson(lesson.id)}
                className={`text-left py-2.5 px-2 transition-colors flex flex-col gap-0.5 ${
                  active ? 'bg-[#302e2c]' : 'hover:bg-[#2c2a27]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-[#9c9890]">
                  <span className={active ? 'text-[#75b52c] font-semibold' : ''}>
                    {lesson.themeCode}
                  </span>
                  <span className="truncate">{lesson.keyConcept}</span>
                </div>
                <span className="text-sm font-medium text-white">{lesson.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Lesson Header & Metadata */}
      <div className="flex flex-col gap-1.5">
        <div className="text-xs text-[#9c9890]">
          <span>{selectedLesson.themeCode}</span>
          <span aria-hidden="true"> · </span>
          <span>{selectedLesson.players}</span>
        </div>
        <h3 className="text-base font-semibold text-white">{selectedLesson.subtitle}</h3>
      </div>

      {/* Navigable Variation Moves */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5 bg-[#161512] border border-[#3c3934] rounded-lg p-2.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => onChangeStep(-1)}
            className={`px-2 py-1 rounded transition-colors ${
              stepIndex === -1
                ? 'bg-[#629924] text-white font-semibold'
                : 'text-[#9c9890] hover:text-white hover:bg-[#262421]'
            }`}
          >
            Départ
          </button>
          {notations.map((note, idx) => {
            const moveNum = Math.floor(idx / 2) + 1;
            const isFirstOfPair =
              idx === 0 || (selectedLesson.initialTurn === 'W' ? idx % 2 === 0 : idx % 2 === 1);
            const prefix =
              idx === 0 && selectedLesson.initialTurn === 'B'
                ? '1… '
                : isFirstOfPair
                ? `${moveNum}. `
                : '';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChangeStep(idx)}
                className={`px-2 py-1 rounded transition-colors ${
                  stepIndex === idx
                    ? 'bg-[#629924] text-white font-semibold'
                    : 'text-[#d8d5ce] hover:bg-[#262421]'
                }`}
              >
                {prefix}
                {note}
              </button>
            );
          })}
        </div>

        {/* Step Controls */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            disabled={stepIndex < 0}
            onClick={() => onChangeStep(-1)}
            className="py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-35 border border-[#3c3934] flex items-center justify-center text-[#bababa] transition-colors"
            title="Position initiale"
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={stepIndex < 0}
            onClick={() => onChangeStep(stepIndex - 1)}
            className="py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-35 border border-[#3c3934] flex items-center justify-center text-[#bababa] transition-colors"
            title="Coup précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={stepIndex >= selectedLesson.moves.length - 1}
            onClick={() => onChangeStep(stepIndex + 1)}
            className="py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-35 border border-[#3c3934] flex items-center justify-center text-[#bababa] transition-colors"
            title="Coup suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={stepIndex >= selectedLesson.moves.length - 1}
            onClick={() => onChangeStep(selectedLesson.moves.length - 1)}
            className="py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-35 border border-[#3c3934] flex items-center justify-center text-[#bababa] transition-colors"
            title="Fin de la séquence"
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pedagogical Commentary */}
      <div className="border-t border-[#3c3934] pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-[#9c9890]">
          <span className="font-medium text-[#d59120]">
            {stepIndex < 0
              ? 'Introduction stratégique'
              : `Commentaire · Coup ${stepIndex + 1}/${selectedLesson.moves.length}`}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[#e0ddd6]">{activeComment}</p>

        <button
          type="button"
          onClick={() => onSendToAnalysis(currentBoard, currentTurn)}
          className="mt-1 self-start px-3.5 py-2 rounded-md bg-[#302e2c] hover:bg-[#3c3934] border border-[#4a4640] text-xs font-medium text-white transition-colors flex items-center gap-1.5"
        >
          <span>Explorer cette position avec le moteur</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
