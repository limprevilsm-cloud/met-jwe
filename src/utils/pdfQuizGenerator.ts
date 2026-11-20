import { PDF_PUZZLES } from '../data/pdfCuratedData';
import { applyMove, cloneBoard, getLegalMoves } from '../engine/draughtsEngine';
import type { BoardArrow, BoardState, PdfLearningModule, PlayerColor, TacticalPuzzle } from '../types/draughts';

export interface PdfQuizExercise {
  id: string;
  moduleId: string;
  sourceType: 'lesson-diagram' | 'puzzle-diagram';
  title: string;
  subtitle: string;
  pageLabel: string;
  pdfUrl: string;
  prompt: string;
  hint: string;
  explanation: string;
  initialBoard: BoardState;
  turn: PlayerColor;
  bestMove: { from: number; to: number };
  continuation: { from: number; to: number }[];
  solutionArrows: BoardArrow[];
}

function boardSignature(
  board: BoardState,
  turn: PlayerColor,
  move: { from: number; to: number }
): string {
  const pieces: string[] = [];
  for (let sq = 1; sq <= 50; sq++) {
    const p = board[sq];
    if (p) pieces.push(`${sq}${p.color}${p.isKing ? 'K' : 'M'}`);
  }
  return `${turn}:${pieces.join(',')}:${move.from}-${move.to}`;
}

function puzzleToQuizExercise(module: PdfLearningModule, puzzle: TacticalPuzzle): PdfQuizExercise | null {
  if (!puzzle.solution.length) return null;
  const first = puzzle.solution[0];
  const legals = getLegalMoves(puzzle.initialBoard, puzzle.playerColor);
  const found = legals.find((m) => m.from === first.from && m.to === first.to);
  if (!found || legals.length < 2) return null;

  const basePdfPath =
    puzzle.sourceBook === 'dubois-tome3'
      ? '/assets/aistudio/jpdubois-perfectionnement-sens-du-jeu-tome-3-V1_copie_ef0089f8.pdf'
      : '/assets/aistudio/jpdubois_expert_combinaisons_V2_copie_693d0be6.pdf';

  const pageLabel = puzzle.pageNumber ? `p. ${puzzle.pageNumber}` : module.pageRange;
  const pdfUrl = puzzle.pageNumber ? `${basePdfPath}#page=${puzzle.pageNumber}` : module.pdfUrl;
  const turnText = puzzle.playerColor === 'W' ? 'Trait aux Blancs' : 'Trait aux Noirs';

  return {
    id: `quiz-${module.id}-${puzzle.id}`,
    moduleId: module.id,
    sourceType: 'puzzle-diagram',
    title: puzzle.title,
    subtitle: puzzle.motif,
    pageLabel,
    pdfUrl,
    prompt: `${turnText} — Trouvez le meilleur coup déclencheur sur ce schéma.`,
    hint: `Thème : ${puzzle.motif}. Examinez attentivement les coups possibles avec la pièce en ${first.from}.`,
    explanation: puzzle.explanation,
    initialBoard: cloneBoard(puzzle.initialBoard),
    turn: puzzle.playerColor,
    bestMove: { from: first.from, to: first.to },
    continuation: puzzle.solution.map((s) => ({ from: s.from, to: s.to })),
    solutionArrows:
      puzzle.arrows && puzzle.arrows.length > 0
        ? puzzle.arrows
        : [{ from: first.from, to: first.to, color: 'green' }],
  };
}

function extractLessonExercises(
  module: PdfLearningModule,
  maxItems: number,
  seen: Set<string>
): PdfQuizExercise[] {
  const results: PdfQuizExercise[] = [];
  let board = cloneBoard(module.initialBoard);
  let turn: PlayerColor = module.initialTurn;

  for (let i = 0; i < module.moves.length; i++) {
    const mv = module.moves[i];
    const legals = getLegalMoves(board, turn);
    const legal = legals.find((l) => l.from === mv.from && l.to === mv.to);
    if (!legal) break;

    const beforeParen = mv.comment.split('(')[0] ?? '';
    const isBlunder = /\?/.test(beforeParen) || /\b(faute|passif|perdait)\b/i.test(mv.comment);
    const isStrong = beforeParen.includes('!') && !isBlunder;

    if (results.length < maxItems && isStrong && legals.length >= 3) {
      const sig = boardSignature(board, turn, mv);
      if (!seen.has(sig)) {
        seen.add(sig);
        const turnText = turn === 'W' ? 'Trait aux Blancs' : 'Trait aux Noirs';
        const continuation = module.moves
          .slice(i, Math.min(module.moves.length, i + 5))
          .map((m) => ({ from: m.from, to: m.to }));

        results.push({
          id: `quiz-${module.id}-step-${i}`,
          moduleId: module.id,
          sourceType: 'lesson-diagram',
          title: `${module.keyConcept} · Schéma d’étude ${results.length + 1}`,
          subtitle: module.playersOrSource,
          pageLabel: module.pageRange,
          pdfUrl: module.pdfUrl,
          prompt: `${turnText} — Trouvez le meilleur coup thématique recommandé dans le cours.`,
          hint: `Repère du chapitre (${module.keyConcept}) : vérifiez le coup actif de la pièce en ${mv.from}.`,
          explanation: mv.comment,
          initialBoard: cloneBoard(board),
          turn,
          bestMove: { from: mv.from, to: mv.to },
          continuation,
          solutionArrows:
            mv.arrows && mv.arrows.length > 0
              ? mv.arrows
              : [{ from: mv.from, to: mv.to, color: 'green' }],
        });
      }
    }

    board = applyMove(board, legal);
    turn = turn === 'W' ? 'B' : 'W';
  }

  return results;
}

export function generateQuizExercisesForModule(module: PdfLearningModule): PdfQuizExercise[] {
  const seen = new Set<string>();
  const exercises: PdfQuizExercise[] = [];

  const linkedPuzzles = module.chapterFilterKey
    ? PDF_PUZZLES.filter((p) => p.chapterId === module.chapterFilterKey)
    : [];

  if (module.bookId === 'combinaisons-experts') {
    // Chapter puzzles are the exact diagrams of this chapter in "Combinaisons pour experts"
    for (const puz of linkedPuzzles) {
      const ex = puzzleToQuizExercise(module, puz);
      if (!ex) continue;
      const sig = boardSignature(ex.initialBoard, ex.turn, ex.bestMove);
      if (!seen.has(sig)) {
        seen.add(sig);
        exercises.push(ex);
      }
    }
    if (exercises.length === 0) {
      exercises.push(...extractLessonExercises(module, 1, seen));
    }
  } else {
    // Tome 3 modules: extract unique strong positions from the master game diagram first,
    // then complement with chapter PDF diagrams
    const lessonCap = module.id === 'mod-pdf-guide' ? 2 : 3;
    exercises.push(...extractLessonExercises(module, lessonCap, seen));

    const maxTotal = 5;
    for (const puz of linkedPuzzles) {
      if (exercises.length >= maxTotal) break;
      const ex = puzzleToQuizExercise(module, puz);
      if (!ex) continue;
      const sig = boardSignature(ex.initialBoard, ex.turn, ex.bestMove);
      if (!seen.has(sig)) {
        seen.add(sig);
        exercises.push(ex);
      }
    }
  }

  return exercises;
}
