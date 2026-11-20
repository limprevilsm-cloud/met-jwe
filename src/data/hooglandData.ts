import { applyMove, buildBoard, createInitialBoard, getLegalMoves } from '../engine/draughtsEngine';
import type {
  BoardState,
  GoalItem,
  MasterLesson,
  PlayerColor,
  TacticalPuzzle,
  TaxationExercise,
} from '../types/draughts';

export interface OpeningPreset {
  id: string;
  name: string;
  description: string;
  board: BoardState;
  turn: PlayerColor;
}

function playSequence(
  moves: { from: number; to: number }[],
  startBoard?: BoardState
): { board: BoardState; turn: PlayerColor } {
  let board = startBoard ? [...startBoard] : createInitialBoard();
  let turn: PlayerColor = 'W';
  for (const m of moves) {
    const legals = getLegalMoves(board, turn);
    const found = legals.find((l) => l.from === m.from && l.to === m.to);
    if (!found) {
      throw new Error(`Invalid opening move ${m.from}-${m.to} for ${turn}`);
    }
    board = applyMove(board, found);
    turn = turn === 'W' ? 'B' : 'W';
  }
  return { board, turn };
}

const classicPos = playSequence([
  { from: 32, to: 28 },
  { from: 19, to: 23 },
  { from: 28, to: 19 },
  { from: 14, to: 23 },
  { from: 37, to: 32 },
  { from: 10, to: 14 },
  { from: 41, to: 37 },
  { from: 14, to: 19 },
  { from: 34, to: 30 },
  { from: 20, to: 24 },
  { from: 30, to: 25 },
  { from: 5, to: 10 },
  { from: 46, to: 41 },
  { from: 17, to: 21 },
  { from: 31, to: 27 },
  { from: 11, to: 17 },
  { from: 37, to: 31 },
  { from: 7, to: 11 },
]);

const roozenburgPos = playSequence([
  { from: 33, to: 29 },
  { from: 17, to: 22 },
  { from: 39, to: 33 },
  { from: 11, to: 17 },
  { from: 44, to: 39 },
  { from: 6, to: 11 },
  { from: 32, to: 28 },
  { from: 19, to: 23 },
  { from: 28, to: 19 },
  { from: 14, to: 23 },
  { from: 31, to: 27 },
  { from: 22, to: 31 },
  { from: 36, to: 27 },
  { from: 17, to: 22 },
  { from: 37, to: 31 },
  { from: 12, to: 17 },
  { from: 41, to: 37 },
  { from: 7, to: 12 },
  { from: 29, to: 24 },
  { from: 20, to: 29 },
  { from: 33, to: 24 },
]);

const bonnardPos = playSequence([
  { from: 32, to: 28 },
  { from: 19, to: 23 },
  { from: 28, to: 19 },
  { from: 14, to: 23 },
  { from: 37, to: 32 },
  { from: 10, to: 14 },
  { from: 41, to: 37 },
  { from: 5, to: 10 },
  { from: 34, to: 29 },
  { from: 23, to: 34 },
  { from: 40, to: 29 },
  { from: 20, to: 24 },
  { from: 29, to: 20 },
  { from: 15, to: 24 },
]);

const kellerPos = playSequence([
  { from: 32, to: 28 },
  { from: 17, to: 22 },
  { from: 28, to: 17 },
  { from: 11, to: 22 },
  { from: 37, to: 32 },
  { from: 12, to: 17 },
  { from: 41, to: 37 },
  { from: 6, to: 11 },
  { from: 31, to: 27 },
  { from: 22, to: 31 },
  { from: 36, to: 27 },
  { from: 7, to: 12 },
  { from: 32, to: 28 },
  { from: 17, to: 21 },
  { from: 34, to: 30 },
]);

export const OPENING_PRESETS: OpeningPreset[] = [
  {
    id: 'initial',
    name: 'Position initiale (10×10)',
    description: 'Position de départ réglementaire KNDB / FMJD.',
    board: createInitialBoard(),
    turn: 'W',
  },
  {
    id: 'classic',
    name: 'Partie Classique (27 / 24)',
    description: 'Structure classique centrale : maintien des cases 48 et 49 et tension 27/24.',
    board: classicPos.board,
    turn: classicPos.turn,
  },
  {
    id: 'roozenburg',
    name: 'Système Roozenburg (Avant-poste 24)',
    description: 'Les Blancs établissent un avant-poste dynamique en 24 appuyé par 27 et 28.',
    board: roozenburgPos.board,
    turn: roozenburgPos.turn,
  },
  {
    id: 'bonnard',
    name: 'Partie Bonnard (34-29)',
    description: 'Échange 34-29 suivi d’un jeu d’ailes asymétrique très étudié chez Hoogland.',
    board: bonnardPos.board,
    turn: bonnardPos.turn,
  },
  {
    id: 'keller',
    name: 'Système Keller (17-22)',
    description: 'Ouverture tranchante avec lutte immédiate pour l’aile gauche blanche.',
    board: kellerPos.board,
    turn: kellerPos.turn,
  },
];

export const MASTER_LESSONS: MasterLesson[] = [
  {
    id: 'lesson-tempo',
    themeCode: 'Thème 1.1',
    title: 'Le Calcul du Temps et l’Équilibre des Ailes',
    subtitle: 'Comprendre la différence de temps et éviter le « trop de temps »',
    players: 'Cours Hoogland — T. Goedemoed & J. Krajenbrink',
    keyConcept: 'Temps de développement & Équilibre',
    summary:
      'En partie classique, une avance de temps trop importante sans soutien des pièces arrière affaiblit la ligne de base (46-50). Observer comment un échange vers l’avant ou l’arrière modifie le compteur de temps.',
    initialBoard: classicPos.board,
    initialTurn: 'W',
    initialArrows: [
      { from: 42, to: 37, color: 'gold' },
      { from: 48, to: 42, color: 'blue' },
    ],
    moves: [
      {
        from: 42,
        to: 37,
        comment:
          '42-37 soutient le pion 32 tout en gardant le verrou central 48-49 intact. En Hoogland, on maintient la ligne de base avant d’échanger.',
        arrows: [
          { from: 48, to: 42, color: 'green' },
          { from: 49, to: 43, color: 'green' },
        ],
      },
      {
        from: 1,
        to: 7,
        comment:
          'Les Noirs développent leur dernière pièce de la rangée 1-5 pour renforcer le flanc droit.',
        arrows: [{ from: 7, to: 12, color: 'gold' }],
      },
      {
        from: 32,
        to: 28,
        comment:
          '32-28 relève le défi central et provoque une prise obligatoire vers l’arrière.',
        arrows: [{ from: 28, to: 23, color: 'blue' }],
      },
      {
        from: 23,
        to: 32,
        comment:
          '23x32 est forcé : les Noirs cèdent la case 23 et perdent du terrain au centre.',
        arrows: [],
      },
      {
        from: 37,
        to: 28,
        comment:
          '37x28 reprend vers l’avant ! Les Blancs regagnent le centre et maintiennent un équilibre de temps optimal.',
        arrows: [{ from: 28, to: 22, color: 'green' }],
      },
    ],
  },
  {
    id: 'lesson-outpost',
    themeCode: 'Thème 1.2',
    title: 'L’Avant-Poste en 24 et son Encerclement',
    subtitle: 'Dynamique du système Roozenburg',
    players: 'R. Clerc — H. Wiersma (Modèle KNDB)',
    keyConcept: 'Avant-poste & Contre-jeu sur les ailes',
    summary:
      'Le pion blanc en 24 paralyse l’aile gauche noire (15, 20, 25), mais il nécessite un soutien constant depuis 29/34 ou 39-33. S’il est coupé de sa base, il devient une cible d’encerclement.',
    initialBoard: roozenburgPos.board,
    initialTurn: 'B',
    initialArrows: [
      { from: 24, to: 15, color: 'gold' },
      { from: 24, to: 19, color: 'gold' },
      { from: 34, to: 29, color: 'blue' },
    ],
    moves: [
      {
        from: 10,
        to: 14,
        comment:
          'Les Noirs développent leurs réserves vers le centre en 14 avant d’attaquer l’avant-poste 24.',
        arrows: [{ from: 14, to: 19, color: 'gold' }],
      },
      {
        from: 39,
        to: 33,
        comment:
          'Les Blancs renforcent le centre pour préparer 33-29 et soutenir l’avant-poste 24.',
        arrows: [{ from: 33, to: 29, color: 'green' }],
      },
      {
        from: 4,
        to: 10,
        comment:
          'Les Noirs mobilisent leur ligne de base vers le centre pour soutenir les colonnes d’attaque.',
        arrows: [{ from: 10, to: 14, color: 'blue' }],
      },
      {
        from: 33,
        to: 29,
        comment:
          'Soutien vital ! 33-29 consolide définitivement la case 24 et menace un échange avantageux vers l’avant.',
        arrows: [{ from: 29, to: 24, color: 'green' }],
      },
      {
        from: 14,
        to: 19,
        comment:
          '14-19 verrouille le centre tout en préparant l’encerclement progressif de l’avant-poste 24.',
        arrows: [{ from: 19, to: 24, color: 'gold' }],
      },
    ],
  },
  {
    id: 'lesson-classique',
    themeCode: 'Thème 2.1',
    title: 'Les Temps de Réserve en Partie Classique',
    subtitle: 'L’art de ne pas s’épuiser au centre',
    players: 'J. Krajenbrink — A. Baljakin (Théorie Hoogland)',
    keyConcept: 'Temps de réserve (45, 43, 36)',
    summary:
      'Dans une position classique verrouillée, le camp qui possède le plus de « temps de réserve » sur les ailes force l’adversaire à rompre sa structure le premier.',
    initialBoard: buildBoard({
      whiteMen: [27, 28, 31, 32, 33, 35, 36, 37, 38, 42, 43, 48, 49],
      blackMen: [2, 3, 7, 8, 12, 13, 14, 16, 18, 19, 23, 24, 25],
    }),
    initialTurn: 'W',
    initialArrows: [
      { from: 43, to: 39, color: 'green' },
      { from: 27, to: 24, color: 'gold' },
    ],
    moves: [
      {
        from: 43,
        to: 39,
        comment:
          '43-39 utilise un temps de réserve précieux tout en gardant la paire défensive 48-49 intacte.',
        arrows: [{ from: 39, to: 34, color: 'green' }],
      },
      {
        from: 24,
        to: 29,
        comment:
          'Les Noirs attaquent le flanc en 29 pour forcer un échange avant de manquer de coups d’attente.',
        arrows: [{ from: 29, to: 33, color: 'gold' }],
      },
      {
        from: 33,
        to: 24,
        comment:
          'Prise forcée : les Blancs capturent en 24, ouvrant le passage sur l’aile droite.',
        arrows: [],
      },
      {
        from: 19,
        to: 30,
        comment:
          '19x30 rétablit l’équilibre matériel, mais attention à la brèche ouverte sur la colonne 19-14-10 !',
        arrows: [{ from: 28, to: 10, color: 'red' }],
      },
      {
        from: 28,
        to: 10,
        comment:
          '28x10 ! La prise majoritaire punit l’affaiblissement de la case 19 : deux pions pris (23 et 14) et percée décisive !',
        arrows: [{ from: 10, to: 4, color: 'green' }],
      },
    ],
  },
  {
    id: 'lesson-wing-break',
    themeCode: 'Thème 3.1',
    title: 'La Percée de l’Aile et l’Échange Bonnard',
    subtitle: 'Exploiter un flanc affaibli après 34-29',
    players: 'T. Sijbrands — R. Boomstra (Thème de Maître)',
    keyConcept: 'Échange libérateur & Attaque d’aile',
    summary:
      'Après 34-29 (23x34) 40x29, l’échange crée une asymétrie caractéristique : les Blancs visent l’aile gauche noire tandis que les Noirs cherchent du contre-jeu sur le centre.',
    initialBoard: bonnardPos.board,
    initialTurn: 'W',
    initialArrows: [
      { from: 46, to: 41, color: 'blue' },
      { from: 32, to: 28, color: 'green' },
    ],
    moves: [
      {
        from: 46,
        to: 41,
        comment:
          '46-41 ferme la case de fuite 41 avant d’engager les échanges au centre.',
        arrows: [{ from: 41, to: 37, color: 'green' }],
      },
      {
        from: 18,
        to: 23,
        comment:
          'Les Noirs réoccupent le centre en 23 afin de maintenir la pression sur l’aile droite blanche.',
        arrows: [{ from: 23, to: 28, color: 'gold' }],
      },
      {
        from: 32,
        to: 28,
        comment:
          '23 est défié immédiatement ! Grâce à 46-41, la prise noire s’arrête en 32.',
        arrows: [{ from: 28, to: 19, color: 'green' }],
      },
      {
        from: 23,
        to: 32,
        comment:
          '23x32 est forcé et s’arrête sur la case 32.',
        arrows: [],
      },
      {
        from: 37,
        to: 28,
        comment:
          '37x28 reprend harmonieusement vers le centre tout en gardant 42-37 en réserve.',
        arrows: [{ from: 28, to: 22, color: 'green' }],
      },
    ],
  },
  {
    id: 'lesson-endgame',
    themeCode: 'Thème 4.1',
    title: 'Opposition et Passage à Dame en Finale',
    subtitle: 'Calcul précis des temps en finale de pions',
    players: 'Cours Hoogland — Chapitre Finales',
    keyConcept: 'Opposition & Gain de temps',
    summary:
      'En finale de pions, un seul temps d’avance ou l’utilisation d’un sacrifice de déviation décide du passage à dame. Apprenez à compter la parité des cases.',
    initialBoard: buildBoard({
      whiteMen: [27, 32, 37],
      blackMen: [16, 17, 24],
    }),
    initialTurn: 'W',
    initialArrows: [
      { from: 27, to: 22, color: 'green' },
      { from: 32, to: 23, color: 'gold' },
    ],
    moves: [
      {
        from: 27,
        to: 22,
        comment:
          '27-22 ! Sacrifice classique de percée qui ouvre l’accès direct aux cases de dame.',
        arrows: [{ from: 22, to: 28, color: 'gold' }],
      },
      {
        from: 17,
        to: 28,
        comment:
          '17x28 est la prise unique (le pion 37 empêche 28x37).',
        arrows: [],
      },
      {
        from: 32,
        to: 23,
        comment:
          '32x23 ! Le pion blanc dépasse désormais toute défense et file vers 1-5.',
        arrows: [{ from: 23, to: 18, color: 'green' }],
      },
      {
        from: 24,
        to: 30,
        comment:
          'Les Noirs tentent une contre-course par 24-30.',
        arrows: [{ from: 30, to: 35, color: 'gold' }],
      },
      {
        from: 23,
        to: 18,
        comment:
          '23-18 : les Blancs arrivent à dame avec 2 temps d’avance et contrôlent la partie !',
        arrows: [{ from: 18, to: 3, color: 'green' }],
      },
    ],
  },
];

export const TACTICAL_PUZZLES: TacticalPuzzle[] = [
  {
    id: 'puz-royal',
    title: 'Le Coup Royal',
    motif: 'Coup Royal (3 pièces + Dame)',
    difficulty: 'Fondamental',
    description:
      'Attirez le pion noir 18 sur la case 27 par un sacrifice précis pour ouvrir la rafle décisive jusqu’à la case 3.',
    hint: 'Sacrifiez le pion 27 vers le centre (27-22) afin de dégager la prise de 32.',
    initialBoard: buildBoard({
      whiteMen: [27, 28, 32, 38, 42],
      blackMen: [8, 13, 17, 18, 24],
    }),
    playerColor: 'W',
    solution: [
      { from: 27, to: 22 },
      { from: 18, to: 27 },
      { from: 32, to: 3 },
    ],
    explanation:
      '1. 27-22 force 18x27 (car le pion 28 empêche 17x28). Ensuite 2. 32x3 capture trois pièces (27, 17, 8) et couronne une Dame imparable en 3 !',
    arrows: [
      { from: 27, to: 22, color: 'gold' },
      { from: 32, to: 3, color: 'green' },
    ],
  },
  {
    id: 'puz-philippe',
    title: 'Le Coup Philippe',
    motif: 'Double sacrifice & Rafle (4 pièces)',
    difficulty: 'Intermédiaire',
    description:
      'Sacrifiez deux pions successivement pour amener l’adversaire en 38 et déclencher une rafle en zigzag de 43 jusqu’en 3.',
    hint: 'Commencez par attirer 18 en 27 (27-22), puis sacrifiez encore sur 32 !',
    initialBoard: buildBoard({
      whiteMen: [27, 37, 38, 41, 43, 49],
      blackMen: [9, 11, 17, 18, 19, 28],
    }),
    playerColor: 'W',
    solution: [
      { from: 27, to: 22 },
      { from: 18, to: 27 },
      { from: 38, to: 32 },
      { from: 27, to: 38 },
      { from: 43, to: 3 },
    ],
    explanation:
      '1. 27-22 18x27 2. 38-32 27x38 (bloqué en 38 grâce à 49) et 3. 43x3 rafle quatre pièces (38, 28, 19, 9) jusqu’à dame.',
    arrows: [
      { from: 27, to: 22, color: 'gold' },
      { from: 38, to: 32, color: 'gold' },
      { from: 43, to: 3, color: 'green' },
    ],
  },
  {
    id: 'puz-raphael',
    title: 'Le Coup Raphaël',
    motif: 'Blocage d’échappatoire & Dame en 3',
    difficulty: 'Fondamental',
    description:
      'Votre pion 29 verrouille le pion 18. Utilisez ce point d’appui pour forcer 19 à prendre en 28 et déclencher la rafle de 32.',
    hint: 'Jouez 28-23 pour forcer la prise 19x28.',
    initialBoard: buildBoard({
      whiteMen: [28, 29, 32, 34, 37, 42, 49],
      blackMen: [8, 11, 13, 15, 18, 19, 25],
    }),
    playerColor: 'W',
    solution: [
      { from: 28, to: 23 },
      { from: 19, to: 28 },
      { from: 32, to: 3 },
    ],
    explanation:
      'Grâce au pion blanc en 29 qui interdit 18x29, 1. 28-23 force 19x28. Les Blancs exécutent alors 2. 32x3 en prenant trois pions (28, 18, 8).',
    arrows: [
      { from: 28, to: 23, color: 'gold' },
      { from: 32, to: 3, color: 'green' },
    ],
  },
  {
    id: 'puz-talon',
    title: 'Le Coup de Talon',
    motif: 'Prise en arrière & Pivot en 29',
    difficulty: 'Intermédiaire',
    description:
      'Attirez le pion noir 24 vers l’arrière en 33 pour permettre à votre pion 38 d’enchaîner un rebond dévastateur.',
    hint: 'Avancez 33-29 pour attirer l’unique prise 24x33.',
    initialBoard: buildBoard({
      whiteMen: [33, 34, 38, 42, 48],
      blackMen: [13, 14, 23, 24, 25],
    }),
    playerColor: 'W',
    solution: [
      { from: 33, to: 29 },
      { from: 24, to: 33 },
      { from: 38, to: 20 },
    ],
    explanation:
      '1. 33-29 force 24x33 (le pion 34 empêche 23x34 et 42 bloque la suite). 2. 38x20 capture 4 pions (33, 23, 13, 14) en un seul mouvement !',
    arrows: [
      { from: 33, to: 29, color: 'gold' },
      { from: 38, to: 20, color: 'green' },
    ],
  },
  {
    id: 'puz-majoritaire',
    title: 'Piège de la Prise Majoritaire',
    motif: 'Prise majoritaire obligatoire (2 > 1)',
    difficulty: 'Maîtrise',
    description:
      'Les Noirs ont deux prises possibles après votre coup, mais la règle de la prise majoritaire les oblige à prendre deux pièces et à s’exposer à une rafle de 4 pions.',
    hint: 'Offrez le pion 27 en 22 : 17 devra prendre 2 pions (17x39) plutôt que 18x27.',
    initialBoard: buildBoard({
      whiteMen: [27, 33, 36, 38, 43, 48],
      blackMen: [8, 13, 17, 18, 24, 29],
    }),
    playerColor: 'W',
    solution: [
      { from: 27, to: 22 },
      { from: 17, to: 39 },
      { from: 43, to: 3 },
    ],
    explanation:
      'Après 1. 27-22, 18x27 ne prend qu’un pion alors que 17x28x39 en prend deux : la prise 17x39 est donc obligatoire ! Les Blancs concluent par 2. 43x3 (4 pions pris + Dame).',
    arrows: [
      { from: 27, to: 22, color: 'gold' },
      { from: 43, to: 3, color: 'green' },
    ],
  },
  {
    id: 'puz-dame-lunette',
    title: 'Le Piège de la Grande Dame',
    motif: 'Déviation de Dame & Contre-rafle',
    difficulty: 'Maîtrise',
    description:
      'Neutralisez la Dame noire en 10 en l’obligeant à capturer vers 37, permettant à votre Dame en 48 d’emporter la Dame adverse et deux pions.',
    hint: 'Jouez 38-32 : la Dame noire en 10 est forcée d’atterrir sur l’unique case libre 37.',
    initialBoard: buildBoard({
      whiteKings: [48],
      whiteMen: [38, 40, 41, 46],
      blackKings: [10],
      blackMen: [15, 22, 29],
    }),
    playerColor: 'W',
    solution: [
      { from: 38, to: 32 },
      { from: 10, to: 37 },
      { from: 48, to: 34 },
    ],
    explanation:
      '1. 38-32 oblige la Dame 10 à prendre en 37 (les cases 41 et 46 étant occupées). Votre Dame 48 réplique par 2. 48x34 (par 31 et 18) en capturant la Dame noire 37 ainsi que les pions 22 et 29 !',
    arrows: [
      { from: 38, to: 32, color: 'gold' },
      { from: 48, to: 34, color: 'green' },
    ],
  },
];

export const TAXATION_EXERCISES: TaxationExercise[] = [
  {
    id: 'tax-1',
    title: 'Taxation 1 : L’Avant-poste isolé ou soutenu ?',
    source: 'Cours Hoogland — Thème 1 (Analyse de structure)',
    initialBoard: roozenburgPos.board,
    turn: 'B',
    arrows: [
      { from: 24, to: 15, color: 'gold' },
      { from: 28, to: 24, color: 'blue' },
    ],
    questionContext:
      'Les Blancs viennent de jouer 29-24. Évaluez la position selon la méthode Hoogland (temps, avant-poste, équilibre des ailes).',
    correctEval: 'white',
    correctStructure: 'Avant-poste blanc en 24 (Système Roozenburg)',
    structureOptions: [
      'Position classique symétrique (27/24)',
      'Avant-poste blanc en 24 (Système Roozenburg)',
      'Encerclement complet par les Noirs',
      'Aile droite blanche effondrée',
    ],
    correctPlan: 'Les Blancs contrôlent l’aile gauche noire et préparent 39-33-29 pour soutenir 24.',
    planOptions: [
      'Les Blancs doivent immédiatement abandonner 24 par 24-20.',
      'Les Blancs contrôlent l’aile gauche noire et préparent 39-33-29 pour soutenir 24.',
      'Les Noirs gagnent un pion forcé dès le coup suivant.',
      'Les Blancs doivent ouvrir leur ligne de base par 49-43.',
    ],
    expertAnalysis:
      'Dans cette position Roozenburg typique, l’avant-poste blanc en 24 immobilise 15, 20 et 25. Les Blancs ont un avantage d’espace clair à condition de soutenir 24 via 39-33-29 et de surveiller l’aile gauche.',
  },
  {
    id: 'tax-2',
    title: 'Taxation 2 : Le « Trop de Temps » en Classique',
    source: 'T. Goedemoed — Exemples d’équilibre des temps',
    initialBoard: buildBoard({
      whiteMen: [22, 23, 24, 27, 28, 31, 32, 34, 37, 42, 43, 47],
      blackMen: [1, 2, 3, 6, 7, 8, 9, 12, 13, 14, 18, 25],
    }),
    turn: 'B',
    arrows: [
      { from: 22, to: 24, color: 'red' },
      { from: 47, to: 42, color: 'blue' },
    ],
    questionContext:
      'Matériel égal (12 contre 12), mais regardez la répartition : les Blancs ont une énorme avance de temps. Qui est réellement mieux ?',
    correctEval: 'black',
    correctStructure: 'Sur-extension blanche (« Trop de temps »)',
    structureOptions: [
      'Sur-extension blanche (« Trop de temps »)',
      'Avantage décisif des Blancs au centre',
      'Partie classique parfaitement équilibrée',
      'Finale de dames imminente',
    ],
    correctPlan: 'Les Noirs disposent d’une base solide (1-3, 6-9) et attaquent les pions blancs avancés et sans soutien.',
    planOptions: [
      'Les Blancs écrasent les Noirs grâce à leur avance de temps.',
      'Les Noirs disposent d’une base solide (1-3, 6-9) et attaquent les pions blancs avancés et sans soutien.',
      'Les Blancs passent à dame au prochain coup.',
      'Les Noirs doivent sacrifier deux pions pour égaliser.',
    ],
    expertAnalysis:
      'Leçon fondamentale du Thème 1 de Hoogland : un excès de temps sans base arrière laisse les pions blancs (22, 23, 24) coupés de leurs réserves. Les Noirs ont des coups d’attente solides et vont forcer les Blancs à faiblir.',
  },
  {
    id: 'tax-3',
    title: 'Taxation 3 : Solidité de la Ligne de Base (48/49)',
    source: 'J. Krajenbrink — Structure défensive KNDB',
    initialBoard: classicPos.board,
    turn: 'W',
    arrows: [
      { from: 48, to: 49, color: 'green' },
      { from: 27, to: 24, color: 'gold' },
    ],
    questionContext:
      'Examinez la position issue de la partie classique. Quelle est la caractéristique stratégique majeure ?',
    correctEval: 'equal',
    correctStructure: 'Structure Classique équilibrée (27 / 24)',
    structureOptions: [
      'Structure Classique équilibrée (27 / 24)',
      'Flanc droit noir ouvert sans défense',
      'Avant-poste noir en 32',
      'Faiblesse critique de la case 48',
    ],
    correctPlan: 'Maintenir les pions 48 et 49 sur la ligne de base tout en développant 46-41 et en gérant la tension centrale.',
    planOptions: [
      'Jouer immédiatement 48-42 puis 49-44 pour vider la dernière rangée.',
      'Maintenir les pions 48 et 49 sur la ligne de base tout en développant 46-41 et en gérant la tension centrale.',
      'Sacrifier le pion 27 sans compensation.',
      'Déplacer toutes les pièces sur la colonne 5-50.',
    ],
    expertAnalysis:
      'En partie classique, la paire 48-49 protège contre les combinaisons vers 46-50 et sert de socle aux échanges de libération. La position est dynamique et parfaitement équilibrée.',
  },
  {
    id: 'tax-4',
    title: 'Taxation 4 : La Finale à Opposition Active',
    source: 'Cours Hoogland — Évaluation de finale',
    initialBoard: buildBoard({
      whiteMen: [26, 27, 38],
      blackMen: [16, 17, 29],
    }),
    turn: 'W',
    arrows: [{ from: 26, to: 21, color: 'green' }],
    questionContext:
      '3 pions contre 3 pions, trait aux Blancs. Quelle est votre taxation de cette finale ?',
    correctEval: 'white',
    correctStructure: 'Finale de pions avec percée gagnante sur l’aile gauche',
    structureOptions: [
      'Finale totalement nulle par symétrie',
      'Finale de pions avec percée gagnante sur l’aile gauche',
      'Victoire noire grâce au pion avancé en 29',
      'Position bloquée sans coup légal',
    ],
    correctPlan: 'Jouer 26-21 pour forcer le passage à dame avant que le pion noir 29 ne puisse arriver en 46-50.',
    planOptions: [
      'Reculer ou attendre avec 38-32 pour défendre la ligne de base.',
      'Jouer 26-21 pour forcer le passage à dame avant que le pion noir 29 ne puisse arriver en 46-50.',
      'Échanger immédiatement en 29.',
      'Proposer la nulle sans calculer la course.',
    ],
    expertAnalysis:
      'Avec le trait, 26-21 force la percée (17-22 27x18 ou 16-21 27x16) et le pion blanc atteint la ligne de promotion (1-5) avec deux temps d’avance sur le pion noir 29.',
  },
];

export const HOOGLAND_GOALS: GoalItem[] = [
  {
    id: 'g-1-1',
    theme: 'Thème 1 — Bases Stratégiques & Temps',
    code: '1.1',
    title: 'Calculer la différence de temps exacte',
    description:
      'Compter les temps de chaque camp (1 à 10 par rangée) et prévoir l’impact d’un échange vers l’avant ou vers l’arrière sur le compteur.',
    linkedTab: 'masters',
    linkedId: 'lesson-tempo',
  },
  {
    id: 'g-1-2',
    theme: 'Thème 1 — Bases Stratégiques & Temps',
    code: '1.2',
    title: 'Identifier le « trop de temps » et l’équilibre des ailes',
    description:
      'Reconnaître quand une avancée prématurée coupe les pions de tête de leur base et fragilise les flancs.',
    linkedTab: 'training',
    linkedId: 'tax-2',
  },
  {
    id: 'g-1-3',
    theme: 'Thème 1 — Bases Stratégiques & Temps',
    code: '1.3',
    title: 'Préserver la ligne de base (48 / 49)',
    description:
      'Comprendre le rôle défensif et combinatoire des pions 48 et 49 avant d’entrer en milieu de partie.',
    linkedTab: 'training',
    linkedId: 'tax-3',
  },
  {
    id: 'g-2-1',
    theme: 'Thème 2 — Structures & Avant-Postes',
    code: '2.1',
    title: 'Maîtriser le système Roozenburg (Avant-poste 24)',
    description:
      'Soutenir l’avant-poste en 24 avec 28/29/33 et détecter les menaces d’encerclement sur l’aile.',
    linkedTab: 'masters',
    linkedId: 'lesson-outpost',
  },
  {
    id: 'g-2-2',
    theme: 'Thème 2 — Structures & Avant-Postes',
    code: '2.2',
    title: 'Gérer les temps de réserve en Partie Classique',
    description:
      'Utiliser les mouvements de flanc (35-30, 36-31) au bon moment pour contraindre l’adversaire à rompre sa formation.',
    linkedTab: 'masters',
    linkedId: 'lesson-classique',
  },
  {
    id: 'g-2-3',
    theme: 'Thème 2 — Structures & Avant-Postes',
    code: '2.3',
    title: 'Comprendre la structure Bonnard (34-29)',
    description:
      'Évaluer la compensation entre contrôle du centre et jeu asymétrique sur l’aile droite.',
    linkedTab: 'masters',
    linkedId: 'lesson-wing-break',
  },
  {
    id: 'g-3-1',
    theme: 'Thème 3 — Combinaisons Standards KNDB 6',
    code: '3.1',
    title: 'Exécuter le Coup Royal et le Coup Raphaël',
    description:
      'Repérer les schémas de blocage et attirer un pion adverse pour ouvrir la diagonale jusqu’à la rangée de dame.',
    linkedTab: 'training',
    linkedId: 'puz-royal',
  },
  {
    id: 'g-3-2',
    theme: 'Thème 3 — Combinaisons Standards KNDB 6',
    code: '3.2',
    title: 'Calculer le Coup Philippe (double sacrifice)',
    description:
      'Enchaîner deux offrandes consécutives avec précision en vérifiant l’absence de contre-prises.',
    linkedTab: 'training',
    linkedId: 'puz-philippe',
  },
  {
    id: 'g-3-3',
    theme: 'Thème 3 — Combinaisons Standards KNDB 6',
    code: '3.3',
    title: 'Utiliser la prise majoritaire et le Coup de Talon',
    description:
      'Exploiter l’obligation de prise majoritaire et les prises en arrière pour renverser le calcul adverse.',
    linkedTab: 'training',
    linkedId: 'puz-majoritaire',
  },
  {
    id: 'g-4-1',
    theme: 'Thème 4 — Finales & Taxation Positionnelle',
    code: '4.1',
    title: 'Calculer les courses à dame et l’opposition',
    description:
      'Compter les temps exacts jusqu’aux cases 1-5 / 46-50 et utiliser les sacrifices de déviation.',
    linkedTab: 'masters',
    linkedId: 'lesson-endgame',
  },
  {
    id: 'g-4-2',
    theme: 'Thème 4 — Finales & Taxation Positionnelle',
    code: '4.2',
    title: 'Appliquer la grille de Taxation Hoogland',
    description:
      'Évaluer systématiquement une position selon : matériel, temps, centre, ligne de base et sécurité tactique.',
    linkedTab: 'training',
    linkedId: 'tax-1',
  },
  {
    id: 'g-4-3',
    theme: 'Thème 4 — Finales & Taxation Positionnelle',
    code: '4.3',
    title: 'Maîtriser les pièges de Dames en finale',
    description:
      'Forcer l’atterrissage d’une Dame adverse sur une case vulnérable afin de l’enfermer ou de la capturer.',
    linkedTab: 'training',
    linkedId: 'puz-dame-lunette',
  },
];
