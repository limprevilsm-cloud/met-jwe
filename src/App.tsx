import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AnalysisPanel } from './components/AnalysisPanel';
import { DraughtsBoard } from './components/DraughtsBoard';
import { GoalsView } from './components/GoalsView';
import { MastersPanel } from './components/MastersPanel';
import {
  PdfLearningPanel,
  type PdfQuizStatus,
  type PdfSectionTab,
} from './components/PdfLearningPanel';
import { TrainingPanel, type PuzzleSourceFilter } from './components/TrainingPanel';
import {
  MASTER_LESSONS,
  OPENING_PRESETS,
  TACTICAL_PUZZLES,
  TAXATION_EXERCISES,
} from './data/hooglandData';
import { PDF_LEARNING_MODULES, PDF_PUZZLES } from './data/pdfCuratedData';
import { generateQuizExercisesForModule } from './utils/pdfQuizGenerator';
import {
  analyzePosition,
  applyMove,
  boardToPdnFen,
  cloneBoard,
  createInitialBoard,
  findBestMove,
  formatMoveNotation,
  getLegalMoves,
} from './engine/draughtsEngine';
import { playSound } from './engine/sound';
import type {
  BoardArrow,
  BoardState,
  GoalItem,
  HistoryEntry,
  Move,
  PlayerColor,
} from './types/draughts';

type WorkspaceTab = 'analysis' | 'masters' | 'pdf-course' | 'training' | 'goals';

const ALL_PUZZLES = [...TACTICAL_PUZZLES, ...PDF_PUZZLES];

const STORAGE_KEYS = {
  solvedPuzzles: 'hoogland_solved_puzzles_v1',
  completedTax: 'hoogland_completed_tax_v1',
  checkedGoals: 'hoogland_checked_goals_v1',
  goalNotes: 'hoogland_goal_notes_v1',
  completedPdfChecks: 'hoogland_completed_pdf_checks_v1',
  solvedPdfQuiz: 'hoogland_solved_pdf_quiz_v1',
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('analysis');
  const [flipped, setFlipped] = useState(false);
  const [showNumbers, setShowNumbers] = useState(true);
  const [muted, setMuted] = useState(false);
  const [userArrows, setUserArrows] = useState<BoardArrow[]>([]);

  // --- Tab 1: Analysis & AI State ---
  const [mode, setMode] = useState<'ai' | 'local'>('ai');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('W');
  const [aiDepth, setAiDepth] = useState<number>(4);
  const [activePresetId, setActivePresetId] = useState<string>('initial');
  const [baseBoard, setBaseBoard] = useState<BoardState>(() => createInitialBoard());
  const [baseTurn, setBaseTurn] = useState<PlayerColor>('W');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [viewIndex, setViewIndex] = useState<number>(-1);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const aiTimerRef = useRef<number | null>(null);

  // --- Tab 2: Masters & Themes State ---
  const [selectedLessonId, setSelectedLessonId] = useState<string>(MASTER_LESSONS[0].id);
  const [lessonStep, setLessonStep] = useState<number>(-1);

  // --- Tab 3: PDF Learning Mode & Quiz PDF State ---
  const [pdfSectionTab, setPdfSectionTab] = useState<PdfSectionTab>('tome3');
  const [selectedPdfModuleId, setSelectedPdfModuleId] = useState<string>(PDF_LEARNING_MODULES[0].id);
  const [pdfStepIndex, setPdfStepIndex] = useState<number>(-1);
  const [pdfQuizExerciseIndex, setPdfQuizExerciseIndex] = useState<number>(0);
  const [pdfQuizStatus, setPdfQuizStatus] = useState<PdfQuizStatus>('playing');
  const [pdfQuizAttemptNotation, setPdfQuizAttemptNotation] = useState<string | null>(null);
  const [pdfQuizReplayPly, setPdfQuizReplayPly] = useState<number>(0);
  const [pdfQuizShowHint, setPdfQuizShowHint] = useState<boolean>(false);

  // --- Tab 4: Puzzles & Taxation State ---
  const [trainingSubMode, setTrainingSubMode] = useState<'puzzles' | 'taxation'>('puzzles');
  const [puzzleSourceFilter, setPuzzleSourceFilter] = useState<PuzzleSourceFilter>('all');
  const [puzzleChapterFilter, setPuzzleChapterFilter] = useState<string>('all');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string>(ALL_PUZZLES[0].id);
  const [puzzleBoard, setPuzzleBoard] = useState<BoardState>(() =>
    cloneBoard(ALL_PUZZLES[0].initialBoard)
  );
  const [puzzleTurn, setPuzzleTurn] = useState<PlayerColor>(ALL_PUZZLES[0].playerColor);
  const [puzzleStep, setPuzzleStep] = useState<number>(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'playing' | 'wrong' | 'solved'>('playing');
  const [puzzleLastMove, setPuzzleLastMove] = useState<{ from: number; to: number } | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const puzzleTimerRef = useRef<number | null>(null);

  const [selectedTaxationId, setSelectedTaxationId] = useState<string>(TAXATION_EXERCISES[0].id);

  // --- Persistent Progress ---
  const [solvedPuzzleIds, setSolvedPuzzleIds] = useState<string[]>(() =>
    loadJson(STORAGE_KEYS.solvedPuzzles, [])
  );
  const [completedTaxationIds, setCompletedTaxationIds] = useState<string[]>(() =>
    loadJson(STORAGE_KEYS.completedTax, [])
  );
  const [checkedGoalIds, setCheckedGoalIds] = useState<string[]>(() =>
    loadJson(STORAGE_KEYS.checkedGoals, [])
  );
  const [goalNotes, setGoalNotes] = useState<Record<string, string>>(() =>
    loadJson(STORAGE_KEYS.goalNotes, {})
  );
  const [completedPdfCheckIds, setCompletedPdfCheckIds] = useState<string[]>(() =>
    loadJson(STORAGE_KEYS.completedPdfChecks, [])
  );
  const [solvedPdfQuizIds, setSolvedPdfQuizIds] = useState<string[]>(() =>
    loadJson(STORAGE_KEYS.solvedPdfQuiz, [])
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.solvedPuzzles, JSON.stringify(solvedPuzzleIds));
    } catch {}
  }, [solvedPuzzleIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.completedTax, JSON.stringify(completedTaxationIds));
    } catch {}
  }, [completedTaxationIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.checkedGoals, JSON.stringify(checkedGoalIds));
    } catch {}
  }, [checkedGoalIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.goalNotes, JSON.stringify(goalNotes));
    } catch {}
  }, [goalNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.completedPdfChecks,
        JSON.stringify(completedPdfCheckIds)
      );
    } catch {}
  }, [completedPdfCheckIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.solvedPdfQuiz, JSON.stringify(solvedPdfQuizIds));
    } catch {}
  }, [solvedPdfQuizIds]);

  // --- Derived Analysis State ---
  const currentAnalysisBoard = useMemo(() => {
    if (viewIndex < 0 || !history[viewIndex]) return baseBoard;
    return history[viewIndex].boardAfter;
  }, [baseBoard, history, viewIndex]);

  const currentAnalysisTurn = useMemo(() => {
    if (viewIndex < 0 || !history[viewIndex]) return baseTurn;
    return history[viewIndex].turnAfter;
  }, [baseTurn, history, viewIndex]);

  const analysisLegalMoves = useMemo(
    () => getLegalMoves(currentAnalysisBoard, currentAnalysisTurn),
    [currentAnalysisBoard, currentAnalysisTurn]
  );

  const analysisLastMove =
    viewIndex >= 0 && history[viewIndex]
      ? { from: history[viewIndex].move.from, to: history[viewIndex].move.to }
      : null;

  const gameOverWinner: PlayerColor | null = useMemo(() => {
    if (analysisLegalMoves.length > 0) return null;
    return currentAnalysisTurn === 'W' ? 'B' : 'W';
  }, [analysisLegalMoves, currentAnalysisTurn]);

  const isLatestAnalysisPly = viewIndex === history.length - 1;

  // --- AI Move Trigger ---
  useEffect(() => {
    if (aiTimerRef.current !== null) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }

    if (
      activeTab !== 'analysis' ||
      mode !== 'ai' ||
      !isLatestAnalysisPly ||
      currentAnalysisTurn === playerColor ||
      analysisLegalMoves.length === 0
    ) {
      setIsThinking(false);
      return;
    }

    setIsThinking(true);
    aiTimerRef.current = window.setTimeout(() => {
      const { move, evalScore } = findBestMove(currentAnalysisBoard, currentAnalysisTurn, aiDepth);
      if (move) {
        const nextBoard = applyMove(currentAnalysisBoard, move);
        const nextTurn: PlayerColor = currentAnalysisTurn === 'W' ? 'B' : 'W';
        const notation = formatMoveNotation(move);
        if (move.promotes) playSound('promote', muted);
        else if (move.captures.length > 0) playSound('capture', muted);
        else playSound('move', muted);

        setHistory((prev) => [
          ...prev,
          { move, notation, boardAfter: nextBoard, turnAfter: nextTurn, evalAfter: evalScore },
        ]);
        setViewIndex((prev) => prev + 1);
      }
      setIsThinking(false);
    }, 320);

    return () => {
      if (aiTimerRef.current !== null) {
        window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    mode,
    isLatestAnalysisPly,
    currentAnalysisTurn,
    playerColor,
    aiDepth,
    currentAnalysisBoard,
    analysisLegalMoves.length,
    muted,
  ]);

  // --- Derived Master Lesson State ---
  const selectedLesson = useMemo(
    () => MASTER_LESSONS.find((l) => l.id === selectedLessonId) ?? MASTER_LESSONS[0],
    [selectedLessonId]
  );

  const lessonPlayback = useMemo(() => {
    const boards: BoardState[] = [cloneBoard(selectedLesson.initialBoard)];
    const turns: PlayerColor[] = [selectedLesson.initialTurn];
    const notations: string[] = [];
    const lastMoves: ({ from: number; to: number } | null)[] = [null];

    let b = selectedLesson.initialBoard;
    let t = selectedLesson.initialTurn;

    for (const m of selectedLesson.moves) {
      const found = getLegalMoves(b, t).find((l) => l.from === m.from && l.to === m.to);
      if (!found) break;
      notations.push(formatMoveNotation(found));
      b = applyMove(b, found);
      t = t === 'W' ? 'B' : 'W';
      boards.push(b);
      turns.push(t);
      lastMoves.push({ from: found.from, to: found.to });
    }

    const idx = Math.max(-1, Math.min(lessonStep, selectedLesson.moves.length - 1));
    const board = boards[idx + 1] ?? boards[0];
    const turn = turns[idx + 1] ?? turns[0];
    const lastMove = lastMoves[idx + 1] ?? null;
    const arrows =
      idx >= 0
        ? selectedLesson.moves[idx]?.arrows ?? []
        : selectedLesson.initialArrows ?? [];

    return { board, turn, lastMove, arrows, notations };
  }, [selectedLesson, lessonStep]);

  // --- Derived PDF Learning Playback State ---
  const selectedPdfModule = useMemo(
    () =>
      PDF_LEARNING_MODULES.find((m) => m.id === selectedPdfModuleId) ?? PDF_LEARNING_MODULES[0],
    [selectedPdfModuleId]
  );

  const pdfPlayback = useMemo(() => {
    const boards: BoardState[] = [cloneBoard(selectedPdfModule.initialBoard)];
    const turns: PlayerColor[] = [selectedPdfModule.initialTurn];
    const notations: string[] = [];
    const lastMoves: ({ from: number; to: number } | null)[] = [null];

    let b = selectedPdfModule.initialBoard;
    let t = selectedPdfModule.initialTurn;

    for (const m of selectedPdfModule.moves) {
      const found = getLegalMoves(b, t).find((l) => l.from === m.from && l.to === m.to);
      if (!found) break;
      notations.push(formatMoveNotation(found));
      b = applyMove(b, found);
      t = t === 'W' ? 'B' : 'W';
      boards.push(b);
      turns.push(t);
      lastMoves.push({ from: found.from, to: found.to });
    }

    const idx = Math.max(-1, Math.min(pdfStepIndex, selectedPdfModule.moves.length - 1));
    const board = boards[idx + 1] ?? boards[0];
    const turn = turns[idx + 1] ?? turns[0];
    const lastMove = lastMoves[idx + 1] ?? null;
    const arrows =
      idx >= 0
        ? selectedPdfModule.moves[idx]?.arrows ?? []
        : selectedPdfModule.initialArrows ?? [];

    return { board, turn, lastMove, arrows, notations };
  }, [selectedPdfModule, pdfStepIndex]);

  const quizExercisesByModule = useMemo(() => {
    const map: Record<string, ReturnType<typeof generateQuizExercisesForModule>> = {};
    for (const mod of PDF_LEARNING_MODULES) {
      map[mod.id] = generateQuizExercisesForModule(mod);
    }
    return map;
  }, []);

  const currentModuleQuizExercises = quizExercisesByModule[selectedPdfModule.id] ?? [];
  const activeQuizExercise =
    currentModuleQuizExercises[
      Math.min(pdfQuizExerciseIndex, Math.max(0, currentModuleQuizExercises.length - 1))
    ];

  const pdfQuizPlayback = useMemo(() => {
    if (!activeQuizExercise) {
      return {
        board: cloneBoard(selectedPdfModule.initialBoard),
        turn: selectedPdfModule.initialTurn,
        initialLegals: [] as Move[],
        lastMove: null as { from: number; to: number } | null,
        arrows: [] as BoardArrow[],
        notations: [] as string[],
      };
    }

    const boards: BoardState[] = [cloneBoard(activeQuizExercise.initialBoard)];
    const turns: PlayerColor[] = [activeQuizExercise.turn];
    const notations: string[] = [];
    const lastMoves: ({ from: number; to: number } | null)[] = [null];
    const initialLegals = getLegalMoves(activeQuizExercise.initialBoard, activeQuizExercise.turn);

    let b = activeQuizExercise.initialBoard;
    let t = activeQuizExercise.turn;

    for (const mv of activeQuizExercise.continuation) {
      const found = getLegalMoves(b, t).find((l) => l.from === mv.from && l.to === mv.to);
      if (!found) break;
      notations.push(formatMoveNotation(found));
      b = applyMove(b, found);
      t = t === 'W' ? 'B' : 'W';
      boards.push(b);
      turns.push(t);
      lastMoves.push({ from: found.from, to: found.to });
    }

    const ply = Math.max(0, Math.min(pdfQuizReplayPly, boards.length - 1));
    return {
      board: boards[ply] ?? boards[0],
      turn: turns[ply] ?? turns[0],
      initialLegals,
      lastMove: lastMoves[ply] ?? null,
      arrows:
        (pdfQuizStatus === 'solved' || pdfQuizStatus === 'revealed') && ply === 1
          ? activeQuizExercise.solutionArrows
          : [],
      notations,
    };
  }, [activeQuizExercise, selectedPdfModule, pdfQuizReplayPly, pdfQuizStatus]);

  // --- Derived Training State ---
  const selectedPuzzle = useMemo(
    () => ALL_PUZZLES.find((p) => p.id === selectedPuzzleId) ?? ALL_PUZZLES[0],
    [selectedPuzzleId]
  );

  const selectedTaxation = useMemo(
    () => TAXATION_EXERCISES.find((t) => t.id === selectedTaxationId) ?? TAXATION_EXERCISES[0],
    [selectedTaxationId]
  );

  const puzzleLegalMoves = useMemo(
    () => getLegalMoves(puzzleBoard, puzzleTurn),
    [puzzleBoard, puzzleTurn]
  );

  // --- Handlers ---
  const handleSelectPreset = (presetId: string) => {
    const preset = OPENING_PRESETS.find((p) => p.id === presetId) ?? OPENING_PRESETS[0];
    setActivePresetId(preset.id);
    setBaseBoard(cloneBoard(preset.board));
    setBaseTurn(preset.turn);
    setHistory([]);
    setViewIndex(-1);
    setUserArrows([]);
    setIsThinking(false);
  };

  const handleResetGame = () => {
    handleSelectPreset(activePresetId);
    setActiveTab('analysis');
  };

  const handleAnalysisMove = (move: Move) => {
    if (mode === 'ai' && currentAnalysisTurn !== playerColor) return;
    const truncated = history.slice(0, viewIndex + 1);
    const nextBoard = applyMove(currentAnalysisBoard, move);
    const nextTurn: PlayerColor = currentAnalysisTurn === 'W' ? 'B' : 'W';
    const notation = formatMoveNotation(move);
    const metricsAfter = analyzePosition(nextBoard);

    if (move.promotes) playSound('promote', muted);
    else if (move.captures.length > 0) playSound('capture', muted);
    else playSound('move', muted);

    setHistory([
      ...truncated,
      {
        move,
        notation,
        boardAfter: nextBoard,
        turnAfter: nextTurn,
        evalAfter: metricsAfter.evalScore,
      },
    ]);
    setViewIndex(truncated.length);
  };

  const handleSelectLesson = (id: string) => {
    setSelectedLessonId(id);
    setLessonStep(-1);
    setUserArrows([]);
  };

  const handleSendToAnalysis = (board: BoardState, turn: PlayerColor) => {
    setActivePresetId('initial');
    setBaseBoard(cloneBoard(board));
    setBaseTurn(turn);
    setHistory([]);
    setViewIndex(-1);
    setMode('local');
    setUserArrows([]);
    setActiveTab('analysis');
  };

  const loadPuzzle = (id: string) => {
    if (puzzleTimerRef.current !== null) {
      window.clearTimeout(puzzleTimerRef.current);
      puzzleTimerRef.current = null;
    }
    const puz = ALL_PUZZLES.find((p) => p.id === id) ?? ALL_PUZZLES[0];
    setSelectedPuzzleId(puz.id);
    setPuzzleBoard(cloneBoard(puz.initialBoard));
    setPuzzleTurn(puz.playerColor);
    setPuzzleStep(0);
    setPuzzleStatus('playing');
    setPuzzleLastMove(null);
    setShowHint(false);
    setUserArrows([]);
  };

  const resetQuizTransientState = () => {
    setPdfQuizStatus('playing');
    setPdfQuizAttemptNotation(null);
    setPdfQuizReplayPly(0);
    setPdfQuizShowHint(false);
    setUserArrows([]);
  };

  const handleSelectPdfModule = (id: string) => {
    setSelectedPdfModuleId(id);
    setPdfStepIndex(-1);
    const modExercises = quizExercisesByModule[id] ?? [];
    const firstUnsolved = modExercises.findIndex((ex) => !solvedPdfQuizIds.includes(ex.id));
    setPdfQuizExerciseIndex(firstUnsolved >= 0 ? firstUnsolved : 0);
    resetQuizTransientState();
  };

  const handleStartChapterQuiz = (moduleId: string) => {
    handleSelectPdfModule(moduleId);
    setPdfSectionTab('quiz');
  };

  const handleSelectQuizExercise = (idx: number) => {
    setPdfQuizExerciseIndex(idx);
    resetQuizTransientState();
  };

  const handlePdfQuizMove = (move: Move) => {
    if (!activeQuizExercise || pdfQuizStatus === 'solved' || pdfQuizStatus === 'revealed') return;
    const notation = formatMoveNotation(move);
    if (
      move.from !== activeQuizExercise.bestMove.from ||
      move.to !== activeQuizExercise.bestMove.to
    ) {
      playSound('error', muted);
      setPdfQuizStatus('wrong');
      setPdfQuizAttemptNotation(notation);
      return;
    }

    if (move.promotes) playSound('promote', muted);
    else if (move.captures.length > 0) playSound('capture', muted);
    else playSound('move', muted);

    setPdfQuizStatus('solved');
    setPdfQuizAttemptNotation(notation);
    setPdfQuizReplayPly(1);

    const nextSolved = solvedPdfQuizIds.includes(activeQuizExercise.id)
      ? solvedPdfQuizIds
      : [...solvedPdfQuizIds, activeQuizExercise.id];

    if (nextSolved !== solvedPdfQuizIds) {
      setSolvedPdfQuizIds(nextSolved);
    }

    const allModuleDone =
      currentModuleQuizExercises.length > 0 &&
      currentModuleQuizExercises.every((ex) => nextSolved.includes(ex.id));

    if (allModuleDone && !completedPdfCheckIds.includes(selectedPdfModule.id)) {
      setCompletedPdfCheckIds((prev) =>
        prev.includes(selectedPdfModule.id) ? prev : [...prev, selectedPdfModule.id]
      );
      playSound('success', muted);
    }
  };

  const handleChangeSourceFilter = (source: PuzzleSourceFilter) => {
    setPuzzleSourceFilter(source);
    setPuzzleChapterFilter('all');
    const first = ALL_PUZZLES.find((p) =>
      source === 'all' ? true : (p.sourceBook ?? 'hoogland') === source
    );
    if (first) loadPuzzle(first.id);
  };

  const handleChangeChapterFilter = (chapterId: string) => {
    setPuzzleChapterFilter(chapterId);
    const first = ALL_PUZZLES.find((p) => {
      const book = p.sourceBook ?? 'hoogland';
      if (puzzleSourceFilter !== 'all' && book !== puzzleSourceFilter) return false;
      if (chapterId !== 'all' && p.chapterId !== chapterId) return false;
      return true;
    });
    if (first) loadPuzzle(first.id);
  };

  const handlePracticeChapterFromPdf = (chapterFilterKey: string) => {
    const first = ALL_PUZZLES.find((p) => p.chapterId === chapterFilterKey);
    setTrainingSubMode('puzzles');
    if (first?.sourceBook && first.sourceBook !== 'hoogland') {
      setPuzzleSourceFilter(first.sourceBook);
    } else {
      setPuzzleSourceFilter('all');
    }
    setPuzzleChapterFilter(chapterFilterKey);
    if (first) loadPuzzle(first.id);
    setActiveTab('training');
  };

  const handlePuzzleMove = (move: Move) => {
    if (puzzleStatus === 'solved' || puzzleTurn !== selectedPuzzle.playerColor) return;
    const expected = selectedPuzzle.solution[puzzleStep];
    if (!expected) return;

    if (move.from !== expected.from || move.to !== expected.to) {
      playSound('error', muted);
      setPuzzleStatus('wrong');
      return;
    }

    const afterPlayer = applyMove(puzzleBoard, move);
    if (move.promotes) playSound('promote', muted);
    else if (move.captures.length > 0) playSound('capture', muted);
    else playSound('move', muted);

    setPuzzleBoard(afterPlayer);
    setPuzzleLastMove({ from: move.from, to: move.to });
    setPuzzleStatus('playing');

    const nextStep = puzzleStep + 1;
    if (nextStep >= selectedPuzzle.solution.length) {
      setPuzzleStep(nextStep);
      setPuzzleStatus('solved');
      playSound('success', muted);
      if (!solvedPuzzleIds.includes(selectedPuzzle.id)) {
        setSolvedPuzzleIds((prev) => [...prev, selectedPuzzle.id]);
      }
      return;
    }

    // Trigger forced opponent reply
    const oppTurn: PlayerColor = selectedPuzzle.playerColor === 'W' ? 'B' : 'W';
    setPuzzleTurn(oppTurn);
    setPuzzleStep(nextStep);

    puzzleTimerRef.current = window.setTimeout(() => {
      const oppExpected = selectedPuzzle.solution[nextStep];
      const oppLegal = getLegalMoves(afterPlayer, oppTurn).find(
        (m) => m.from === oppExpected.from && m.to === oppExpected.to
      );
      if (oppLegal) {
        const afterOpp = applyMove(afterPlayer, oppLegal);
        if (oppLegal.captures.length > 0) playSound('capture', muted);
        else playSound('move', muted);
        setPuzzleBoard(afterOpp);
        setPuzzleLastMove({ from: oppLegal.from, to: oppLegal.to });
        setPuzzleTurn(selectedPuzzle.playerColor);
        setPuzzleStep(nextStep + 1);
      }
    }, 380);
  };

  const handleNavigateFromGoal = (goal: GoalItem) => {
    if (goal.linkedTab === 'masters' && goal.linkedId) {
      handleSelectLesson(goal.linkedId);
      setActiveTab('masters');
    } else if (goal.linkedTab === 'pdf-course' && goal.linkedId) {
      const targetMod =
        PDF_LEARNING_MODULES.find((m) => m.id === goal.linkedId) ?? PDF_LEARNING_MODULES[0];
      handleSelectPdfModule(targetMod.id);
      setPdfSectionTab(targetMod.bookId === 'combinaisons-experts' ? 'experts' : 'tome3');
      setActiveTab('pdf-course');
    } else if (goal.linkedTab === 'training' && goal.linkedId) {
      if (goal.linkedId.startsWith('tax-')) {
        setTrainingSubMode('taxation');
        setSelectedTaxationId(goal.linkedId);
      } else {
        setTrainingSubMode('puzzles');
        loadPuzzle(goal.linkedId);
      }
      setActiveTab('training');
    }
  };

  // --- Select Active Board Props Based on Tab ---
  let boardState = currentAnalysisBoard;
  let boardTurn = currentAnalysisTurn;
  let boardLegals = analysisLegalMoves;
  let boardInteractive =
    activeTab === 'analysis' &&
    !gameOverWinner &&
    (mode === 'local' || currentAnalysisTurn === playerColor);
  let boardLastMove = analysisLastMove;
  let boardArrows: BoardArrow[] = [];
  let onBoardMove = handleAnalysisMove;
  let topLabel = flipped ? 'Blancs (31–50)' : 'Noirs (1–20)';
  let topSublabel =
    mode === 'ai'
      ? (flipped && playerColor === 'W') || (!flipped && playerColor === 'B')
        ? 'Joueur'
        : `Moteur Prof. ${aiDepth}`
      : 'Analyse libre';
  let bottomLabel = flipped ? 'Noirs (1–20)' : 'Blancs (31–50)';
  let bottomSublabel =
    mode === 'ai'
      ? (flipped && playerColor === 'B') || (!flipped && playerColor === 'W')
        ? 'Joueur'
        : `Moteur Prof. ${aiDepth}`
      : 'Analyse libre';

  if (activeTab === 'masters') {
    boardState = lessonPlayback.board;
    boardTurn = lessonPlayback.turn;
    boardLegals = [];
    boardInteractive = false;
    boardLastMove = lessonPlayback.lastMove;
    boardArrows = lessonPlayback.arrows;
    topLabel = flipped ? 'Blancs' : 'Noirs';
    topSublabel = selectedLesson.themeCode;
    bottomLabel = flipped ? 'Noirs' : 'Blancs';
    bottomSublabel = selectedLesson.keyConcept;
  } else if (activeTab === 'pdf-course') {
    if (pdfSectionTab === 'quiz' && activeQuizExercise) {
      boardState = pdfQuizPlayback.board;
      boardTurn = pdfQuizPlayback.turn;
      boardLegals =
        pdfQuizStatus === 'solved' || pdfQuizStatus === 'revealed'
          ? []
          : pdfQuizPlayback.initialLegals;
      boardInteractive = pdfQuizStatus !== 'solved' && pdfQuizStatus !== 'revealed';
      boardLastMove = pdfQuizPlayback.lastMove;
      boardArrows = pdfQuizPlayback.arrows;
      onBoardMove = handlePdfQuizMove;
      topLabel = flipped ? 'Blancs' : 'Noirs';
      topSublabel = selectedPdfModule.chapterLabel;
      bottomLabel = flipped ? 'Noirs' : 'Blancs';
      bottomSublabel = 'Quiz PDF · Trouvez le meilleur coup';
    } else {
      boardState = pdfPlayback.board;
      boardTurn = pdfPlayback.turn;
      boardLegals = [];
      boardInteractive = false;
      boardLastMove = pdfPlayback.lastMove;
      boardArrows = pdfPlayback.arrows;
      topLabel = flipped ? 'Blancs' : 'Noirs';
      topSublabel = selectedPdfModule.chapterLabel;
      bottomLabel = flipped ? 'Noirs' : 'Blancs';
      bottomSublabel = selectedPdfModule.keyConcept;
    }
  } else if (activeTab === 'training') {
    if (trainingSubMode === 'puzzles') {
      boardState = puzzleBoard;
      boardTurn = puzzleTurn;
      boardLegals = puzzleLegalMoves;
      boardInteractive =
        puzzleStatus !== 'solved' && puzzleTurn === selectedPuzzle.playerColor;
      boardLastMove = puzzleLastMove;
      boardArrows =
        puzzleStatus === 'solved' || showHint ? selectedPuzzle.arrows ?? [] : [];
      onBoardMove = handlePuzzleMove;
      topLabel = flipped ? 'Blancs' : 'Noirs';
      topSublabel = selectedPuzzle.chapterLabel ?? selectedPuzzle.motif;
      bottomLabel = flipped ? 'Noirs' : 'Blancs';
      bottomSublabel = selectedPuzzle.difficulty;
    } else {
      boardState = selectedTaxation.initialBoard;
      boardTurn = selectedTaxation.turn;
      boardLegals = [];
      boardInteractive = false;
      boardLastMove = null;
      boardArrows = selectedTaxation.arrows ?? [];
      topLabel = flipped ? 'Blancs' : 'Noirs';
      topSublabel = 'Position à taxer';
      bottomLabel = flipped ? 'Noirs' : 'Blancs';
      bottomSublabel = 'Méthode Hoogland';
    }
  }

  const boardMetrics = useMemo(() => analyzePosition(boardState), [boardState]);

  const pdnString = useMemo(() => {
    const fen = boardToPdnFen(baseBoard, baseTurn);
    const movesStr = history
      .map((h, i) => (i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${h.notation}` : h.notation))
      .join(' ');
    return `${fen}\n${movesStr}`.trim();
  }, [baseBoard, baseTurn, history]);

  return (
    <div className="min-h-screen flex flex-col bg-[#161512] text-[#c4c1ba]">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="bg-[#211f1c] border-b border-[#3c3934] px-4 sm:px-6 py-3 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('analysis');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            lidraughts<span className="text-[#75b52c] font-normal">.hoogland</span>
          </a>

          {/* Zone 2: 5 Single-line Navigation Links */}
          <nav className="flex items-center gap-4 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-medium">
            {(
              [
                { id: 'analysis', label: 'Échiquier & IA' },
                { id: 'masters', label: 'Thèmes & Maîtres' },
                { id: 'pdf-course', label: 'Cours PDF' },
                { id: 'training', label: 'Combinaisons' },
                { id: 'goals', label: 'Objectifs' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-[#629924] text-white'
                      : 'border-transparent text-[#9c9890] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleResetGame}
              className="px-3.5 py-1.5 rounded-md bg-[#629924] hover:bg-[#75b52c] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nouvelle partie</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'goals' ? (
          <GoalsView
            checkedGoalIds={checkedGoalIds}
            notes={goalNotes}
            onToggleGoal={(id) =>
              setCheckedGoalIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              )
            }
            onUpdateNote={(id, note) =>
              setGoalNotes((prev) => ({ ...prev, [id]: note }))
            }
            onNavigateToLinked={handleNavigateFromGoal}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Stage: 10x10 International Draughts Board */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <DraughtsBoard
                board={boardState}
                turn={boardTurn}
                metrics={boardMetrics}
                legalMoves={boardLegals}
                interactive={boardInteractive}
                flipped={flipped}
                showNumbers={showNumbers}
                muted={muted}
                lastMove={boardLastMove}
                arrows={boardArrows}
                userArrows={userArrows}
                topLabel={topLabel}
                topSublabel={topSublabel}
                bottomLabel={bottomLabel}
                bottomSublabel={bottomSublabel}
                onMove={onBoardMove}
                onToggleFlip={() => setFlipped((f) => !f)}
                onToggleNumbers={() => setShowNumbers((n) => !n)}
                onToggleMute={() => setMuted((m) => !m)}
                onAddUserArrow={(a) => setUserArrows((prev) => [...prev, a])}
                onClearUserArrows={() => setUserArrows([])}
              />
            </div>

            {/* Right Workspace Panel */}
            <div className="lg:col-span-5 w-full">
              {activeTab === 'analysis' && (
                <AnalysisPanel
                  mode={mode}
                  playerColor={playerColor}
                  aiDepth={aiDepth}
                  isThinking={isThinking}
                  gameOverWinner={gameOverWinner}
                  history={history}
                  viewIndex={viewIndex}
                  metrics={boardMetrics}
                  activePresetId={activePresetId}
                  pdnText={pdnString}
                  onChangeMode={(m) => {
                    setMode(m);
                    setIsThinking(false);
                  }}
                  onChangePlayerColor={(c) => {
                    setPlayerColor(c);
                    setFlipped(c === 'B');
                  }}
                  onChangeAiDepth={setAiDepth}
                  onSelectPreset={handleSelectPreset}
                  onJumpToPly={(idx) => setViewIndex(idx)}
                  onResetGame={handleResetGame}
                />
              )}

              {activeTab === 'masters' && (
                <MastersPanel
                  selectedLesson={selectedLesson}
                  stepIndex={lessonStep}
                  currentBoard={lessonPlayback.board}
                  currentTurn={lessonPlayback.turn}
                  notations={lessonPlayback.notations}
                  onSelectLesson={handleSelectLesson}
                  onChangeStep={setLessonStep}
                  onSendToAnalysis={handleSendToAnalysis}
                />
              )}

              {activeTab === 'pdf-course' && (
                <PdfLearningPanel
                  sectionTab={pdfSectionTab}
                  selectedModule={selectedPdfModule}
                  stepIndex={pdfStepIndex}
                  currentBoard={pdfPlayback.board}
                  currentTurn={pdfPlayback.turn}
                  notations={pdfPlayback.notations}
                  completedCheckIds={completedPdfCheckIds}
                  quizExercisesByModule={quizExercisesByModule}
                  activeQuizExerciseIndex={pdfQuizExerciseIndex}
                  quizStatus={pdfQuizStatus}
                  quizAttemptNotation={pdfQuizAttemptNotation}
                  quizReplayPly={pdfQuizReplayPly}
                  quizNotations={pdfQuizPlayback.notations}
                  quizShowHint={pdfQuizShowHint}
                  solvedQuizIds={solvedPdfQuizIds}
                  onChangeSectionTab={(tab) => {
                    setPdfSectionTab(tab);
                    if (tab === 'quiz') {
                      const modExercises = quizExercisesByModule[selectedPdfModule.id] ?? [];
                      const firstUnsolved = modExercises.findIndex(
                        (ex) => !solvedPdfQuizIds.includes(ex.id)
                      );
                      setPdfQuizExerciseIndex(firstUnsolved >= 0 ? firstUnsolved : 0);
                      resetQuizTransientState();
                    }
                  }}
                  onSelectModule={handleSelectPdfModule}
                  onChangeStep={setPdfStepIndex}
                  onCompleteCheck={(id) =>
                    setCompletedPdfCheckIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
                  }
                  onPracticeChapter={handlePracticeChapterFromPdf}
                  onSendToAnalysis={handleSendToAnalysis}
                  onStartChapterQuiz={handleStartChapterQuiz}
                  onSelectQuizExercise={handleSelectQuizExercise}
                  onChangeQuizReplayPly={setPdfQuizReplayPly}
                  onToggleQuizHint={() => setPdfQuizShowHint((h) => !h)}
                  onRevealQuizAnswer={() => {
                    setPdfQuizStatus('revealed');
                    setPdfQuizAttemptNotation(null);
                    setPdfQuizReplayPly(1);
                  }}
                  onResetQuizExercise={resetQuizTransientState}
                />
              )}

              {activeTab === 'training' && (
                <TrainingPanel
                  subMode={trainingSubMode}
                  allPuzzles={ALL_PUZZLES}
                  sourceFilter={puzzleSourceFilter}
                  chapterFilter={puzzleChapterFilter}
                  selectedPuzzle={selectedPuzzle}
                  puzzleStep={puzzleStep}
                  puzzleStatus={puzzleStatus}
                  showHint={showHint}
                  solvedPuzzleIds={solvedPuzzleIds}
                  selectedTaxation={selectedTaxation}
                  completedTaxationIds={completedTaxationIds}
                  onChangeSubMode={(m) => {
                    setTrainingSubMode(m);
                    setUserArrows([]);
                  }}
                  onChangeSourceFilter={handleChangeSourceFilter}
                  onChangeChapterFilter={handleChangeChapterFilter}
                  onSelectPuzzle={loadPuzzle}
                  onToggleHint={() => setShowHint((h) => !h)}
                  onResetPuzzle={() => loadPuzzle(selectedPuzzle.id)}
                  onSelectTaxation={(id) => {
                    setSelectedTaxationId(id);
                    setUserArrows([]);
                  }}
                  onCompleteTaxation={(id) =>
                    setCompletedTaxationIds((prev) =>
                      prev.includes(id) ? prev : [...prev, id]
                    )
                  }
                  onSendToAnalysis={handleSendToAnalysis}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
