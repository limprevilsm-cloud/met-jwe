import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  HelpCircle,
  RotateCcw,
  Target,
  Zap,
} from 'lucide-react';
import { PDF_GLOSSARY, PDF_LEARNING_MODULES } from '../data/pdfCuratedData';
import type { BoardState, PdfBookId, PdfLearningModule, PlayerColor } from '../types/draughts';
import type { PdfQuizExercise } from '../utils/pdfQuizGenerator';

export type PdfSectionTab = 'tome3' | 'experts' | 'quiz' | 'glossary';
export type PdfQuizStatus = 'playing' | 'wrong' | 'solved' | 'revealed';

interface PdfLearningPanelProps {
  sectionTab: PdfSectionTab;
  selectedModule: PdfLearningModule;
  stepIndex: number;
  currentBoard: BoardState;
  currentTurn: PlayerColor;
  notations: string[];
  completedCheckIds: string[];
  quizExercisesByModule: Record<string, PdfQuizExercise[]>;
  activeQuizExerciseIndex: number;
  quizStatus: PdfQuizStatus;
  quizAttemptNotation: string | null;
  quizReplayPly: number;
  quizNotations: string[];
  quizShowHint: boolean;
  solvedQuizIds: string[];
  onChangeSectionTab: (tab: PdfSectionTab) => void;
  onSelectModule: (moduleId: string) => void;
  onChangeStep: (step: number) => void;
  onCompleteCheck: (moduleId: string) => void;
  onPracticeChapter: (chapterFilterKey: string) => void;
  onSendToAnalysis: (board: BoardState, turn: PlayerColor) => void;
  onStartChapterQuiz: (moduleId: string) => void;
  onSelectQuizExercise: (index: number) => void;
  onChangeQuizReplayPly: (ply: number) => void;
  onToggleQuizHint: () => void;
  onRevealQuizAnswer: () => void;
  onResetQuizExercise: () => void;
}

export const PdfLearningPanel: React.FC<PdfLearningPanelProps> = ({
  sectionTab,
  selectedModule,
  stepIndex,
  currentBoard,
  currentTurn,
  notations,
  completedCheckIds,
  quizExercisesByModule,
  activeQuizExerciseIndex,
  quizStatus,
  quizAttemptNotation,
  quizReplayPly,
  quizNotations,
  quizShowHint,
  solvedQuizIds,
  onChangeSectionTab,
  onSelectModule,
  onChangeStep,
  onCompleteCheck,
  onPracticeChapter,
  onSendToAnalysis,
  onStartChapterQuiz,
  onSelectQuizExercise,
  onChangeQuizReplayPly,
  onToggleQuizHint,
  onRevealQuizAnswer,
  onResetQuizExercise,
}) => {
  const [glossaryCategory, setGlossaryCategory] = useState<string>('Tous');
  const [quizBookFilter, setQuizBookFilter] = useState<'all' | 'tome3' | 'experts'>('all');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  const tome3Modules = useMemo(
    () =>
      PDF_LEARNING_MODULES.filter(
        (m) => m.bookId === 'tome3-offensif' || m.bookId === 'tome3-encerclements'
      ),
    []
  );

  const expertsModules = useMemo(
    () => PDF_LEARNING_MODULES.filter((m) => m.bookId === 'combinaisons-experts'),
    []
  );

  const visibleModules = sectionTab === 'experts' ? expertsModules : tome3Modules;

  const quizChapterList = useMemo(() => {
    if (quizBookFilter === 'tome3') return tome3Modules;
    if (quizBookFilter === 'experts') return expertsModules;
    return PDF_LEARNING_MODULES;
  }, [quizBookFilter, tome3Modules, expertsModules]);

  const handleSwitchSection = (next: PdfSectionTab) => {
    onChangeSectionTab(next);
    if (next === 'tome3' && selectedModule.bookId === 'combinaisons-experts') {
      onSelectModule(tome3Modules[0].id);
    } else if (next === 'experts' && selectedModule.bookId !== 'combinaisons-experts') {
      onSelectModule(expertsModules[0].id);
    }
  };

  const filteredGlossary = useMemo(() => {
    if (glossaryCategory === 'Tous') return PDF_GLOSSARY;
    return PDF_GLOSSARY.filter((g) => g.category === glossaryCategory);
  }, [glossaryCategory]);

  const activeComment =
    stepIndex >= 0 && selectedModule.moves[stepIndex]
      ? selectedModule.moves[stepIndex].comment
      : selectedModule.strategicGoal;

  const chosenAnswer = selectedAnswers[selectedModule.id];
  const isAnswered = chosenAnswer !== undefined;
  const isCorrect = chosenAnswer === selectedModule.checkQuestion.correctIndex;

  const handleChooseOption = (idx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [selectedModule.id]: idx }));
    if (idx === selectedModule.checkQuestion.correctIndex) {
      onCompleteCheck(selectedModule.id);
    }
  };

  const bookSubtitle = (bookId: PdfBookId) => {
    if (bookId === 'tome3-offensif') return 'Tome 3 · 1ère partie (Jeu offensif)';
    if (bookId === 'tome3-encerclements') return 'Tome 3 · 2e partie (Encerclements)';
    return 'Niveau 3 · Combinaisons pour experts';
  };

  const currentModuleExercises = quizExercisesByModule[selectedModule.id] ?? [];
  const safeQuizIdx = Math.min(
    activeQuizExerciseIndex,
    Math.max(0, currentModuleExercises.length - 1)
  );
  const activeQuizExercise = currentModuleExercises[safeQuizIdx];
  const currentModuleSolvedCount = currentModuleExercises.filter((ex) =>
    solvedQuizIds.includes(ex.id)
  ).length;
  const isCurrentChapterValidated = completedCheckIds.includes(selectedModule.id);

  const totalQuizExercises = useMemo(
    () =>
      PDF_LEARNING_MODULES.reduce(
        (acc, m) => acc + (quizExercisesByModule[m.id]?.length ?? 0),
        0
      ),
    [quizExercisesByModule]
  );

  const nextUnsolvedQuizIndex = useMemo(() => {
    if (!currentModuleExercises.length) return -1;
    for (let offset = 1; offset <= currentModuleExercises.length; offset++) {
      const idx = (safeQuizIdx + offset) % currentModuleExercises.length;
      if (idx !== safeQuizIdx && !solvedQuizIds.includes(currentModuleExercises[idx].id)) {
        return idx;
      }
    }
    return safeQuizIdx + 1 < currentModuleExercises.length ? safeQuizIdx + 1 : -1;
  }, [currentModuleExercises, safeQuizIdx, solvedQuizIds]);

  const nextModuleInQuiz = useMemo(() => {
    const idx = quizChapterList.findIndex((m) => m.id === selectedModule.id);
    if (idx >= 0 && idx + 1 < quizChapterList.length) return quizChapterList[idx + 1];
    return null;
  }, [quizChapterList, selectedModule.id]);

  return (
    <div className="bg-[#262421] border border-[#3c3934] rounded-xl p-5 flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Apprentissage des PDF Dubois</h2>
          <p className="text-xs text-[#9c9890]">
            {completedCheckIds.length}/{PDF_LEARNING_MODULES.length} chapitres validés ·{' '}
            {solvedQuizIds.length}/{totalQuizExercises} schémas résolus
          </p>
        </div>
        <BookOpen className="w-4 h-4 text-[#d59120] shrink-0" />
      </div>

      {/* Segmented Switcher */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#161512] rounded-lg border border-[#3c3934]">
        <button
          type="button"
          onClick={() => handleSwitchSection('tome3')}
          className={`py-1.5 px-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            sectionTab === 'tome3' ? 'bg-[#302e2c] text-white' : 'text-[#9c9890] hover:text-white'
          }`}
        >
          Tome 3
        </button>
        <button
          type="button"
          onClick={() => handleSwitchSection('experts')}
          className={`py-1.5 px-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            sectionTab === 'experts'
              ? 'bg-[#302e2c] text-white'
              : 'text-[#9c9890] hover:text-white'
          }`}
        >
          12 Chapitres
        </button>
        <button
          type="button"
          onClick={() => handleSwitchSection('quiz')}
          className={`py-1.5 px-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            sectionTab === 'quiz' ? 'bg-[#629924] text-white font-semibold' : 'text-[#9c9890] hover:text-white'
          }`}
        >
          Quiz PDF
        </button>
        <button
          type="button"
          onClick={() => handleSwitchSection('glossary')}
          className={`py-1.5 px-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            sectionTab === 'glossary'
              ? 'bg-[#302e2c] text-white'
              : 'text-[#9c9890] hover:text-white'
          }`}
        >
          Lexique
        </button>
      </div>

      {sectionTab === 'glossary' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="glossary-cat" className="text-xs font-medium text-[#bababa]">
              Catégorie
            </label>
            <select
              id="glossary-cat"
              value={glossaryCategory}
              onChange={(e) => setGlossaryCategory(e.target.value)}
              className="bg-[#161512] border border-[#3c3934] rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#629924]"
            >
              <option value="Tous">Toutes les notions ({PDF_GLOSSARY.length})</option>
              <option value="Notation PDF">Notation PDF</option>
              <option value="Structure stratégique">Structures stratégiques</option>
              <option value="Mécanisme combinatoire">Mécanismes combinatoires</option>
            </select>
          </div>

          <div className="flex flex-col divide-y divide-[#3c3934] border-y border-[#3c3934] max-h-[540px] overflow-y-auto">
            {filteredGlossary.map((entry) => (
              <div key={entry.term} className="py-3 px-1 flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{entry.term}</span>
                  <span className="text-[11px] text-[#9c9890] shrink-0">{entry.category}</span>
                </div>
                <p className="text-xs leading-relaxed text-[#d8d5ce]">{entry.definition}</p>
                {entry.example && (
                  <p className="text-[11px] font-mono text-[#d59120]">Ex. : {entry.example}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : sectionTab === 'quiz' ? (
        <div className="flex flex-col gap-4">
          {/* Quiz Chapter Filter */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[#bababa]">
              Résolvez tous les schémas d’un chapitre pour le valider
            </span>
            <select
              aria-label="Filtrer les chapitres du Quiz PDF"
              value={quizBookFilter}
              onChange={(e) => setQuizBookFilter(e.target.value as 'all' | 'tome3' | 'experts')}
              className="bg-[#161512] border border-[#3c3934] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#629924]"
            >
              <option value="all">Tous ({PDF_LEARNING_MODULES.length})</option>
              <option value="tome3">Tome 3 ({tome3Modules.length})</option>
              <option value="experts">12 Chapitres ({expertsModules.length})</option>
            </select>
          </div>

          {/* Chapter Selector List */}
          <div className="flex flex-col divide-y divide-[#3c3934] border-y border-[#3c3934] max-h-44 overflow-y-auto">
            {quizChapterList.map((mod) => {
              const active = mod.id === selectedModule.id;
              const modExercises = quizExercisesByModule[mod.id] ?? [];
              const modSolved = modExercises.filter((ex) => solvedQuizIds.includes(ex.id)).length;
              const done = completedCheckIds.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => onSelectModule(mod.id)}
                  className={`text-left py-2 px-2 transition-colors flex items-center justify-between gap-3 ${
                    active ? 'bg-[#302e2c]' : 'hover:bg-[#2c2a27]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#9c9890] truncate">
                      <span className={active ? 'text-[#75b52c] font-semibold' : ''}>
                        {mod.chapterLabel}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono">
                        {modSolved}/{modExercises.length} schémas
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white truncate">{mod.title}</div>
                  </div>
                  {done && (
                    <CheckCircle2
                      className="w-4 h-4 text-[#75b52c] shrink-0"
                      aria-label="Chapitre validé"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {activeQuizExercise && (
            <div className="flex flex-col gap-3.5">
              {/* Chapter Progress & Exercise Switcher */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="text-[#9c9890] truncate">
                  <span className="text-white font-semibold">
                    Schéma {safeQuizIdx + 1}/{currentModuleExercises.length}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span className={isCurrentChapterValidated ? 'text-[#75b52c] font-semibold' : ''}>
                    {isCurrentChapterValidated
                      ? 'Chapitre validé'
                      : `${currentModuleSolvedCount}/${currentModuleExercises.length} validés`}
                  </span>
                </div>
                <a
                  href={activeQuizExercise.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3692e7] hover:underline flex items-center gap-1 shrink-0 font-medium"
                >
                  <span>Voir PDF ({activeQuizExercise.pageLabel})</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Schema Number Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {currentModuleExercises.map((ex, idx) => {
                  const isCurrent = idx === safeQuizIdx;
                  const isExSolved = solvedQuizIds.includes(ex.id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => onSelectQuizExercise(idx)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-[#302e2c] border-[#629924] text-white font-semibold'
                          : isExSolved
                          ? 'bg-[#1d2817] border-[#629924]/50 text-[#a3d471] hover:border-[#629924]'
                          : 'bg-[#161512] border-[#3c3934] text-[#9c9890] hover:text-white'
                      }`}
                    >
                      <span>#{idx + 1}</span>
                      {isExSolved && <CheckCircle2 className="w-3 h-3 text-[#75b52c]" />}
                    </button>
                  );
                })}
              </div>

              {/* Active Exercise Header & Prompt */}
              <div className="bg-[#161512] border border-[#3c3934] rounded-lg p-3.5 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{activeQuizExercise.title}</h3>
                    <p className="text-xs text-[#9c9890] mt-0.5">
                      <span
                        className={
                          activeQuizExercise.turn === 'B'
                            ? 'text-[#d59120] font-semibold'
                            : 'text-[#e0ddd6] font-medium'
                        }
                      >
                        {activeQuizExercise.turn === 'W'
                          ? 'Trait aux Blancs (31→5)'
                          : 'Trait aux Noirs (1→50)'}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{activeQuizExercise.subtitle}</span>
                    </p>
                  </div>
                  {solvedQuizIds.includes(activeQuizExercise.id) &&
                    quizStatus === 'playing' && (
                      <span className="text-[11px] font-medium text-[#75b52c] shrink-0">
                        Déjà résolu
                      </span>
                    )}
                </div>

                <p className="text-xs leading-relaxed text-[#d8d5ce]">
                  {activeQuizExercise.prompt}
                </p>

                {quizStatus === 'wrong' && quizAttemptNotation && (
                  <div className="bg-[#2e1a18] border border-[#dc2626]/60 rounded-md px-3 py-2 text-xs text-[#f3b3ae]">
                    Coup joué : <span className="font-mono font-semibold">{quizAttemptNotation}</span> — ce
                    n’est pas le meilleur coup sur ce schéma. Essayez un autre coup sur le damier.
                  </div>
                )}

                {quizShowHint && quizStatus !== 'solved' && quizStatus !== 'revealed' && (
                  <div className="bg-[#262118] border border-[#d59120]/50 rounded-md px-3 py-2 text-xs text-[#e8c67a]">
                    <span className="font-semibold">Indice : </span>
                    {activeQuizExercise.hint}
                  </div>
                )}

                {(quizStatus === 'solved' || quizStatus === 'revealed') && (
                  <div
                    className={`rounded-md px-3 py-2.5 border text-xs flex flex-col gap-2 ${
                      quizStatus === 'solved'
                        ? 'bg-[#1d2817] border-[#629924]/70 text-[#d8efc0]'
                        : 'bg-[#262118] border-[#d59120]/60 text-[#e8d5b0]'
                    }`}
                  >
                    <div className="font-semibold text-white">
                      {quizStatus === 'solved'
                        ? `Bravo ! Meilleur coup trouvé : ${quizNotations[0] ?? ''}`
                        : `Solution du PDF : ${quizNotations[0] ?? ''}`}
                    </div>
                    <p className="leading-relaxed">{activeQuizExercise.explanation}</p>

                    {quizNotations.length > 1 && (
                      <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
                        <span className="text-[11px] text-[#bababa]">
                          Rejouer la suite sur le damier :
                        </span>
                        <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                          {quizNotations.map((note, idx) => {
                            const ply = idx + 1;
                            const active = quizReplayPly === ply;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => onChangeQuizReplayPly(ply)}
                                className={`px-1.5 py-0.5 rounded transition-colors ${
                                  active
                                    ? 'bg-[#629924] text-white font-semibold'
                                    : 'bg-[#161512]/80 text-[#d8d5ce] hover:bg-[#302e2c]'
                                }`}
                              >
                                {note}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quiz Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {quizStatus !== 'solved' && quizStatus !== 'revealed' ? (
                  <>
                    <button
                      type="button"
                      onClick={onToggleQuizHint}
                      className="px-3 py-1.5 rounded-md bg-[#302e2c] hover:bg-[#3c3934] border border-[#4a4640] text-xs font-medium text-white transition-colors flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#d59120]" />
                      <span>{quizShowHint ? 'Masquer l’indice' : 'Indice'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRevealQuizAnswer}
                      className="px-3 py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] border border-[#3c3934] text-xs font-medium text-[#bababa] hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Voir la solution</span>
                    </button>
                  </>
                ) : (
                  <>
                    {nextUnsolvedQuizIndex >= 0 && (
                      <button
                        type="button"
                        onClick={() => onSelectQuizExercise(nextUnsolvedQuizIndex)}
                        className="px-3.5 py-1.5 rounded-md bg-[#629924] hover:bg-[#75b52c] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <span>Schéma suivant</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {nextUnsolvedQuizIndex < 0 && nextModuleInQuiz && (
                      <button
                        type="button"
                        onClick={() => onSelectModule(nextModuleInQuiz.id)}
                        className="px-3.5 py-1.5 rounded-md bg-[#629924] hover:bg-[#75b52c] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <span>Chapitre suivant</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onResetQuizExercise}
                      className="px-3 py-1.5 rounded-md bg-[#302e2c] hover:bg-[#3c3934] border border-[#4a4640] text-xs font-medium text-white transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Réessayer</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() =>
                    onChangeSectionTab(
                      selectedModule.bookId === 'combinaisons-experts' ? 'experts' : 'tome3'
                    )
                  }
                  className="px-3 py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] border border-[#3c3934] text-xs font-medium text-[#bababa] hover:text-white transition-colors"
                >
                  Revoir le cours
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSendToAnalysis(activeQuizExercise.initialBoard, activeQuizExercise.turn)
                  }
                  className="px-3 py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] border border-[#3c3934] text-xs font-medium text-[#bababa] hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Échiquier</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Module Selector */}
          <div className="flex flex-col divide-y divide-[#3c3934] border-y border-[#3c3934] max-h-48 overflow-y-auto">
            {visibleModules.map((mod) => {
              const active = mod.id === selectedModule.id;
              const done = completedCheckIds.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => onSelectModule(mod.id)}
                  className={`text-left py-2.5 px-2 transition-colors flex items-center justify-between gap-3 ${
                    active ? 'bg-[#302e2c]' : 'hover:bg-[#2c2a27]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#9c9890] truncate">
                      <span className={active ? 'text-[#75b52c] font-semibold' : ''}>
                        {mod.chapterLabel}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono">{mod.pageRange}</span>
                    </div>
                    <div className="text-sm font-medium text-white truncate">{mod.title}</div>
                  </div>
                  {done && (
                    <CheckCircle2 className="w-4 h-4 text-[#75b52c] shrink-0" aria-label="Validé" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Module Header */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs text-[#9c9890]">
              <span className="truncate">
                {bookSubtitle(selectedModule.bookId)} · {selectedModule.pageRange}
              </span>
              <a
                href={selectedModule.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3692e7] hover:underline flex items-center gap-1 shrink-0 font-medium"
              >
                <span>Voir PDF</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h3 className="text-base font-semibold text-white">{selectedModule.title}</h3>
            <p className="text-xs text-[#bababa]">{selectedModule.playersOrSource}</p>
          </div>

          {/* Interactive Move Sequence Player */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5 bg-[#161512] border border-[#3c3934] rounded-lg p-2.5 font-mono text-xs max-h-32 overflow-y-auto">
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
                  idx === 0 || (selectedModule.initialTurn === 'W' ? idx % 2 === 0 : idx % 2 === 1);
                const prefix =
                  idx === 0 && selectedModule.initialTurn === 'B'
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
                disabled={stepIndex >= selectedModule.moves.length - 1}
                onClick={() => onChangeStep(stepIndex + 1)}
                className="py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-35 border border-[#3c3934] flex items-center justify-center text-[#bababa] transition-colors"
                title="Coup suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={stepIndex >= selectedModule.moves.length - 1}
                onClick={() => onChangeStep(selectedModule.moves.length - 1)}
                className="py-1.5 rounded-md bg-[#161512] hover:bg-[#302e2c] disabled:opacity-35 border border-[#3c3934] flex items-center justify-center text-[#bababa] transition-colors"
                title="Fin de la séquence"
              >
                <ChevronLast className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Move Commentary */}
          <div className="border-t border-[#3c3934] pt-3 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[#d59120]">
              {stepIndex < 0
                ? 'Idée maîtresse du chapitre'
                : `Analyse · Coup ${stepIndex + 1}/${selectedModule.moves.length}`}
            </span>
            <p className="text-sm leading-relaxed text-[#e0ddd6]">{activeComment}</p>
          </div>

          {/* Structured Takeaways */}
          <div className="border-t border-[#3c3934] pt-3 flex flex-col gap-2.5 text-xs">
            <div>
              <span className="font-semibold text-white">Formations & repères clés</span>
              <ul className="mt-1 space-y-1 text-[#cfccc4] list-disc pl-4">
                {selectedModule.keyFormations.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-[#e0a840]">Pièges fréquents</span>
              <ul className="mt-1 space-y-1 text-[#cfccc4] list-disc pl-4">
                {selectedModule.trapsToAvoid.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-[#75b52c]">À retenir</span>
              <ul className="mt-1 space-y-1 text-[#cfccc4] list-disc pl-4">
                {selectedModule.takeaways.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Comprehension Check */}
          <div className="border-t border-[#3c3934] pt-3 flex flex-col gap-2">
            <span className="text-xs font-semibold text-white">Vérifier ma compréhension</span>
            <p className="text-xs leading-relaxed text-[#d8d5ce]">
              {selectedModule.checkQuestion.prompt}
            </p>
            <div className="flex flex-col gap-1.5">
              {selectedModule.checkQuestion.options.map((opt, idx) => {
                const isChosen = chosenAnswer === idx;
                const isAnswerCorrect = idx === selectedModule.checkQuestion.correctIndex;
                let style =
                  'bg-[#161512] border-[#3c3934] text-[#cfccc4] hover:text-white hover:bg-[#2c2a27]';
                if (isAnswered) {
                  if (isAnswerCorrect) {
                    style = 'bg-[#1d2817] border-[#629924]/70 text-white';
                  } else if (isChosen) {
                    style = 'bg-[#2e1a18] border-[#dc2626]/60 text-[#f3b3ae]';
                  }
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChooseOption(idx)}
                    className={`text-left px-3 py-2 rounded-md border text-xs transition-colors ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {isAnswered && (
              <p
                className={`text-xs leading-relaxed ${
                  isCorrect ? 'text-[#a3d471]' : 'text-[#f3b3ae]'
                }`}
              >
                {selectedModule.checkQuestion.explanation}
              </p>
            )}
          </div>

          {/* Actions Footer */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#3c3934]">
            <button
              type="button"
              onClick={() => onStartChapterQuiz(selectedModule.id)}
              className="px-3.5 py-2 rounded-md bg-[#629924] hover:bg-[#75b52c] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                Quiz PDF ({currentModuleSolvedCount}/{currentModuleExercises.length})
              </span>
            </button>
            {selectedModule.chapterFilterKey && (
              <button
                type="button"
                onClick={() => onPracticeChapter(selectedModule.chapterFilterKey!)}
                className="px-3.5 py-2 rounded-md bg-[#302e2c] hover:bg-[#3c3934] border border-[#4a4640] text-white text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5 text-[#d59120]" />
                <span>Puzzles</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onSendToAnalysis(currentBoard, currentTurn)}
              className="px-3.5 py-2 rounded-md bg-[#161512] hover:bg-[#302e2c] border border-[#3c3934] text-xs font-medium text-[#bababa] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Échiquier</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
