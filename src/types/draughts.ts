export type PlayerColor = 'W' | 'B';

export interface Piece {
  color: PlayerColor;
  isKing: boolean;
}

/** 1-indexed Manoury board: index 1..50, index 0 is unused */
export type BoardState = (Piece | null)[];

export interface Move {
  from: number;
  to: number;
  captures: number[];
  /** Full square-by-square landing path, e.g. [32, 21, 12] */
  path: number[];
  promotes: boolean;
}

export interface HistoryEntry {
  move: Move;
  notation: string;
  boardAfter: BoardState;
  turnAfter: PlayerColor;
  evalAfter: number;
}

export interface BoardArrow {
  from: number;
  to: number;
  color?: 'green' | 'gold' | 'blue' | 'red';
}

export interface PositionMetrics {
  whiteMen: number;
  whiteKings: number;
  blackMen: number;
  blackKings: number;
  whiteTempo: number;
  blackTempo: number;
  tempoDiff: number;
  whiteCenter: number;
  blackCenter: number;
  evalScore: number; // Positive = White advantage, in pawns (1.0 = 1 pion)
  structureLabel: string;
}

export interface LessonVariationMove {
  from: number;
  to: number;
  comment: string;
  arrows?: BoardArrow[];
}

export interface MasterLesson {
  id: string;
  themeCode: string;
  title: string;
  subtitle: string;
  players: string;
  keyConcept: string;
  summary: string;
  initialBoard: BoardState;
  initialTurn: PlayerColor;
  initialArrows?: BoardArrow[];
  moves: LessonVariationMove[];
}

export interface TacticalPuzzle {
  id: string;
  title: string;
  motif: string;
  difficulty: 'Fondamental' | 'Intermédiaire' | 'Maîtrise';
  description: string;
  hint: string;
  initialBoard: BoardState;
  playerColor: PlayerColor;
  /** Alternating player move, opponent auto-reply, player move, etc. */
  solution: { from: number; to: number }[];
  explanation: string;
  arrows?: BoardArrow[];
  sourceBook?: 'hoogland' | 'dubois-combinaisons' | 'dubois-tome3';
  chapterId?: string;
  chapterLabel?: string;
  pageNumber?: number;
  author?: string;
}

export interface TaxationExercise {
  id: string;
  title: string;
  source: string;
  initialBoard: BoardState;
  turn: PlayerColor;
  arrows?: BoardArrow[];
  questionContext: string;
  correctEval: 'white' | 'equal' | 'black';
  correctStructure: string;
  structureOptions: string[];
  correctPlan: string;
  planOptions: string[];
  expertAnalysis: string;
}

export type PdfBookId = 'tome3-offensif' | 'tome3-encerclements' | 'combinaisons-experts';

export interface PdfGlossaryEntry {
  term: string;
  category: 'Notation PDF' | 'Structure stratégique' | 'Mécanisme combinatoire';
  definition: string;
  example?: string;
}

export interface PdfLearningModule {
  id: string;
  bookId: PdfBookId;
  bookTitle: string;
  chapterLabel: string;
  chapterFilterKey?: string;
  pageRange: string;
  pdfUrl: string;
  title: string;
  subtitle: string;
  playersOrSource: string;
  keyConcept: string;
  strategicGoal: string;
  keyFormations: string[];
  trapsToAvoid: string[];
  takeaways: string[];
  initialBoard: BoardState;
  initialTurn: PlayerColor;
  initialArrows?: BoardArrow[];
  moves: LessonVariationMove[];
  checkQuestion: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface GoalItem {
  id: string;
  theme: string;
  code: string;
  title: string;
  description: string;
  linkedTab?: 'masters' | 'training' | 'pdf-course';
  linkedId?: string;
}

