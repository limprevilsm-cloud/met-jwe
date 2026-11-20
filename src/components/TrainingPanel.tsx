import React, { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, ExternalLink, HelpCircle, RotateCcw } from 'lucide-react';
import { TAXATION_EXERCISES } from '../data/hooglandData';
import { PDF_CHAPTERS } from '../data/pdfCuratedData';
import type { BoardState, PlayerColor, TacticalPuzzle, TaxationExercise } from '../types/draughts';

export type PuzzleSourceFilter = 'all' | 'hoogland' | 'dubois-combinaisons' | 'dubois-tome3';

interface TrainingPanelProps {
  subMode: 'puzzles' | 'taxation';
  allPuzzles: TacticalPuzzle[];
  sourceFilter: PuzzleSourceFilter;
  chapterFilter: string;
  selectedPuzzle: TacticalPuzzle;
  puzzleStep: number;
  puzzleStatus: 'playing' | 'wrong' | 'solved';
  showHint: boolean;
  solvedPuzzleIds: string[];
  selectedTaxation: TaxationExercise;
  completedTaxationIds: string[];
  onChangeSubMode: (mode: 'puzzles' | 'taxation') => void;
  onChangeSourceFilter: (source: PuzzleSourceFilter) => void;
  onChangeChapterFilter: (chapterId: string) => void;
  onSelectPuzzle: (id: string) => void;
  onToggleHint: () => void;
  onResetPuzzle: () => void;
  onSelectTaxation: (id: string) => void;
  onCompleteTaxation: (id: string) => void;
  onSendToAnalysis: (board: BoardState, turn: PlayerColor) => void;
}

export const TrainingPanel: React.FC<TrainingPanelProps> = ({
  subMode,
  allPuzzles,
  sourceFilter,
  chapterFilter,
  selectedPuzzle,
  puzzleStep,
  puzzleStatus,
  showHint,
  solvedPuzzleIds,
  selectedTaxation,
  completedTaxationIds,
  onChangeSubMode,
  onChangeSourceFilter,
  onChangeChapterFilter,
  onSelectPuzzle,
  onToggleHint,
  onResetPuzzle,
  onSelectTaxation,
  onCompleteTaxation,
  onSendToAnalysis,
}) => {
  const [evalChoice, setEvalChoice] = useState<'white' | 'equal' | 'black' | null>(null);
  const [structChoice, setStructChoice] = useState<string>('');
  const [planChoice, setPlanChoice] = useState<string>('');
  const [taxSubmitted, setTaxSubmitted] = useState(false);

  const availableChapters = useMemo(() => {
    if (sourceFilter === 'hoogland') return [];
    if (sourceFilter === 'all') return PDF_CHAPTERS;
    return PDF_CHAPTERS.filter((c) => c.book === sourceFilter);
  }, [sourceFilter]);

  const filteredPuzzles = useMemo(() => {
    return allPuzzles.filter((p) => {
      const book = p.sourceBook ?? 'hoogland';
      if (sourceFilter !== 'all' && book !== sourceFilter) return false;
      if (chapterFilter !== 'all' && p.chapterId !== chapterFilter) return false;
      return true;
    });
  }, [allPuzzles, sourceFilter, chapterFilter]);

  const filteredSolvedCount = useMemo(
    () => filteredPuzzles.filter((p) => solvedPuzzleIds.includes(p.id)).length,
    [filteredPuzzles, solvedPuzzleIds]
  );

  const handleSelectTaxationItem = (id: string) => {
    setEvalChoice(null);
    setStructChoice('');
    setPlanChoice('');
    setTaxSubmitted(false);
    onSelectTaxation(id);
  };

  const handleValidateTaxation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalChoice || !structChoice || !planChoice) return;
    setTaxSubmitted(true);
    const score =
      (evalChoice === selectedTaxation.correctEval ? 1 : 0) +
      (structChoice === selectedTaxation.correctStructure ? 1 : 0) +
      (planChoice === selectedTaxation.correctPlan ? 1 : 0);
    if (score >= 2) {
      onCompleteTaxation(selectedTaxation.id);
    }
  };

  const taxScore = taxSubmitted
    ? (evalChoice === selectedTaxation.correctEval ? 1 : 0) +
      (structChoice === selectedTaxation.correctStructure ? 1 : 0) +
      (planChoice === selectedTaxation.correctPlan ? 1 : 0)
    : 0;

  const activeList = filteredPuzzles.length > 0 ? filteredPuzzles : allPuzzles;
  const currentFilteredIdx = activeList.findIndex((p) => p.id === selectedPuzzle.id);
  const nextPuzzleIdx = (currentFilteredIdx + 1) % activeList.length;

  const pdfHref =
    selectedPuzzle.sourceBook === 'dubois-combinaisons' && selectedPuzzle.pageNumber
      ? `/assets/aistudio/jpdubois_expert_combinaisons_V2_copie_693d0be6.pdf#page=${selectedPuzzle.pageNumber}`
      : selectedPuzzle.sourceBook === 'dubois-tome3' && selectedPuzzle.pageNumber
      ? `/assets/aistudio/jpdubois-perfectionnement-sens-du-jeu-tome-3-V1_copie_ef0089f8.pdf#page=${selectedPuzzle.pageNumber}`
      : null;

  return (
    <div className="bg-[#262421] border border-[#3c3934] rounded-xl p-5 flex flex-col gap-5">
      {/* Segmented Submode Selector */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#161512] rounded-lg border border-[#3c3934]">
        <button
          type="button"
          onClick={() => onChangeSubMode('puzzles')}
          className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            subMode === 'puzzles' ? 'bg-[#302e2c] text-white' : 'text-[#9c9890] hover:text-white'
          }`}
        >
          Combinaisons ({solvedPuzzleIds.length}/{allPuzzles.length})
        </button>
        <button
          type="button"
          onClick={() => onChangeSubMode('taxation')}
          className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            subMode === 'taxation' ? 'bg-[#302e2c] text-white' : 'text-[#9c9890] hover:text-white'
          }`}
        >
          Taxation ({completedTaxationIds.length}/{TAXATION_EXERCISES.length})
        </button>
      </div>

      {subMode === 'puzzles' ? (
        <div className="flex flex-col gap-4">
          {/* Source & Chapter Filters */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#161512] rounded-lg border border-[#3c3934]">
              {(
                [
                  { id: 'all', label: 'Tous' },
                  { id: 'hoogland', label: 'Hoogland' },
                  { id: 'dubois-combinaisons', label: 'PDF Experts' },
                  { id: 'dubois-tome3', label: 'Tome 3' },
                ] as const
              ).map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => onChangeSourceFilter(src.id)}
                  className={`py-1 px-1.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                    sourceFilter === src.id
                      ? 'bg-[#302e2c] text-white'
                      : 'text-[#9c9890] hover:text-white'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            {availableChapters.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                <select
                  aria-label="Filtrer par chapitre PDF"
                  value={chapterFilter}
                  onChange={(e) => onChangeChapterFilter(e.target.value)}
                  className="flex-1 min-w-0 bg-[#161512] border border-[#3c3934] rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#629924]"
                >
                  <option value="all">
                    Tous les chapitres ({filteredPuzzles.length} diagrammes)
                  </option>
                  {availableChapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.label} ({ch.pageRange})
                    </option>
                  ))}
                </select>
                <span className="text-xs font-mono text-[#9c9890] shrink-0">
                  {filteredSolvedCount}/{filteredPuzzles.length}
                </span>
              </div>
            )}
          </div>

          {/* Puzzle List */}
          <div className="flex flex-col divide-y divide-[#3c3934] border-y border-[#3c3934] max-h-52 overflow-y-auto">
            {filteredPuzzles.map((puz) => {
              const active = puz.id === selectedPuzzle.id;
              const solved = solvedPuzzleIds.includes(puz.id);
              return (
                <button
                  key={puz.id}
                  type="button"
                  onClick={() => onSelectPuzzle(puz.id)}
                  className={`text-left py-2.5 px-2 transition-colors flex items-center justify-between gap-3 ${
                    active ? 'bg-[#302e2c]' : 'hover:bg-[#2c2a27]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#9c9890] truncate">
                      <span>{puz.difficulty}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{puz.chapterLabel ?? puz.motif}</span>
                      {puz.pageNumber && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono">p. {puz.pageNumber}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm font-medium text-white truncate">{puz.title}</div>
                  </div>
                  {solved && (
                    <span className="text-xs text-[#75b52c] font-medium flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Résolu
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Puzzle Details */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-xs text-[#9c9890]">
              <span className={selectedPuzzle.playerColor === 'B' ? 'text-[#d59120] font-medium' : ''}>
                {selectedPuzzle.playerColor === 'W'
                  ? 'Trait aux Blancs (31→5)'
                  : 'Trait aux Noirs (1→50)'}
              </span>
              <div className="flex items-center gap-3">
                {pdfHref && (
                  <a
                    href={pdfHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3692e7] hover:underline flex items-center gap-1"
                  >
                    <span>PDF p. {selectedPuzzle.pageNumber}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <span className="font-mono">
                  Coup {Math.floor(puzzleStep / 2) + 1}/{Math.ceil(selectedPuzzle.solution.length / 2)}
                </span>
              </div>
            </div>
            <h3 className="text-base font-semibold text-white">{selectedPuzzle.title}</h3>
            <p className="text-xs text-[#9c9890]">
              {selectedPuzzle.motif}
              {selectedPuzzle.author ? ` · ${selectedPuzzle.author}` : ''}
            </p>
            <p className="text-sm leading-relaxed text-[#d8d5ce]">{selectedPuzzle.description}</p>
          </div>

          {/* Feedback States (Non-hue-only: explicit icon + text) */}
          {puzzleStatus === 'wrong' && (
            <div className="p-3 rounded-lg bg-[#2e1a18] border border-[#dc2626]/50 text-xs text-[#f3b3ae]">
              Coup incorrect pour cette combinaison. Essayez un autre sacrifice ou demandez un indice.
            </div>
          )}

          {puzzleStatus === 'solved' && (
            <div className="p-3.5 rounded-lg bg-[#1d2817] border border-[#629924]/50 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <CheckCircle2 className="w-4 h-4 text-[#75b52c]" />
                <span>Combinaison réussie</span>
              </div>
              <p className="text-xs leading-relaxed text-[#d2dec7]">{selectedPuzzle.explanation}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectPuzzle(activeList[nextPuzzleIdx].id)}
                  className="px-3 py-1.5 rounded-md bg-[#629924] hover:bg-[#75b52c] text-white text-xs font-semibold transition-colors"
                >
                  Problème suivant
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSendToAnalysis(selectedPuzzle.initialBoard, selectedPuzzle.playerColor)
                  }
                  className="px-3 py-1.5 rounded-md bg-[#302e2c] hover:bg-[#3c3934] text-white text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <span>Analyser</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {showHint && puzzleStatus !== 'solved' && (
            <div className="p-3 rounded-lg bg-[#2c2619] border border-[#d59120]/40 text-xs text-[#f0d8a8] leading-relaxed">
              Indice : {selectedPuzzle.hint}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onToggleHint}
              disabled={puzzleStatus === 'solved'}
              className="px-3.5 py-2 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-40 border border-[#3c3934] text-xs font-medium text-[#e0ddd6] transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#d59120]" />
              <span>{showHint ? 'Masquer l’indice' : 'Indice'}</span>
            </button>
            <button
              type="button"
              onClick={onResetPuzzle}
              className="px-3.5 py-2 rounded-md bg-[#161512] hover:bg-[#302e2c] border border-[#3c3934] text-xs font-medium text-[#e0ddd6] transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recommencer</span>
            </button>
          </div>
        </div>
      ) : (
        /* Taxation Positionnelle */
        <form onSubmit={handleValidateTaxation} className="flex flex-col gap-4">
          <div className="flex flex-col divide-y divide-[#3c3934] border-y border-[#3c3934]">
            {TAXATION_EXERCISES.map((ex) => {
              const active = ex.id === selectedTaxation.id;
              const done = completedTaxationIds.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleSelectTaxationItem(ex.id)}
                  className={`text-left py-2.5 px-2 transition-colors flex items-center justify-between gap-3 ${
                    active ? 'bg-[#302e2c]' : 'hover:bg-[#2c2a27]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#9c9890] truncate">{ex.source}</div>
                    <div className="text-sm font-medium text-white truncate">{ex.title}</div>
                  </div>
                  {done && (
                    <span className="text-xs text-[#75b52c] font-medium flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Validé
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-sm leading-relaxed text-[#d8d5ce]">{selectedTaxation.questionContext}</p>

          {/* Q1: Evaluation */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[#bababa]">1. Qui possède l’avantage ?</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'white', label: 'Blancs mieux' },
                  { id: 'equal', label: 'Égalité' },
                  { id: 'black', label: 'Noirs mieux' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={taxSubmitted}
                  onClick={() => setEvalChoice(opt.id)}
                  className={`py-2 px-2 rounded-md border text-xs font-medium transition-colors ${
                    evalChoice === opt.id
                      ? 'bg-[#302e2c] border-[#629924] text-white'
                      : 'bg-[#161512] border-[#3c3934] text-[#9c9890] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Structure */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tax-struct" className="text-xs font-medium text-[#bababa]">
              2. Type de structure Hoogland
            </label>
            <select
              id="tax-struct"
              disabled={taxSubmitted}
              value={structChoice}
              onChange={(e) => setStructChoice(e.target.value)}
              className="w-full bg-[#161512] border border-[#3c3934] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#629924]"
            >
              <option value="">Sélectionner une structure…</option>
              {selectedTaxation.structureOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Q3: Plan */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tax-plan" className="text-xs font-medium text-[#bababa]">
              3. Plan stratégique prioritaire
            </label>
            <select
              id="tax-plan"
              disabled={taxSubmitted}
              value={planChoice}
              onChange={(e) => setPlanChoice(e.target.value)}
              className="w-full bg-[#161512] border border-[#3c3934] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#629924]"
            >
              <option value="">Sélectionner le plan juste…</option>
              {selectedTaxation.planOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {!taxSubmitted ? (
            <button
              type="submit"
              disabled={!evalChoice || !structChoice || !planChoice}
              className="py-2 px-4 rounded-md bg-[#629924] hover:bg-[#75b52c] disabled:opacity-40 text-white text-xs font-semibold transition-colors self-start"
            >
              Valider ma taxation
            </button>
          ) : (
            <div className="p-3.5 rounded-lg bg-[#1d2817] border border-[#629924]/50 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span>Résultat de la taxation : {taxScore} / 3</span>
                <button
                  type="button"
                  onClick={() => handleSelectTaxationItem(selectedTaxation.id)}
                  className="text-[#bababa] hover:text-white underline font-normal"
                >
                  Réessayer
                </button>
              </div>
              {taxScore < 3 && (
                <div className="text-xs text-[#e0a840] space-y-1">
                  <p>Structure attendue : {selectedTaxation.correctStructure}</p>
                  <p>Plan attendu : {selectedTaxation.correctPlan}</p>
                </div>
              )}
              <p className="text-xs leading-relaxed text-[#d2dec7]">
                {selectedTaxation.expertAnalysis}
              </p>
              <button
                type="button"
                onClick={() =>
                  onSendToAnalysis(selectedTaxation.initialBoard, selectedTaxation.turn)
                }
                className="self-start mt-1 px-3 py-1.5 rounded-md bg-[#302e2c] hover:bg-[#3c3934] text-white text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span>Tester sur l’échiquier</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
