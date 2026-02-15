import type { MiddlegameChapter, AnnotatedGame, TrainingPosition } from './types';

// ═══════════════════════════════════════════════════════════════
// CHAPTER 1: KINGSIDE ATTACK (existing)
// ═══════════════════════════════════════════════════════════════

/** Annotated master game: Kingside Attack */
const kingsideAttackGame: AnnotatedGame = {
  id: 'game_kingside_attack_1',
  title: 'The London Kingside Attack',
  players: 'GM Example vs IM Opponent, 2023',
  result: '1-0',
  pgn: '1. d4 Nf6 2. Bf4 g6 3. e3 Bg7 4. Nf3 O-O 5. Be2 d6 6. O-O Nbd7 7. h3 Re8 8. Nbd2 e5 9. Bh2 exd4 10. exd4 Nf8 11. c3 Bf5 12. Re1 N6d7 13. Nf1 c6 14. Ng3 Bg4 15. Ne5 Nxe5 16. dxe5 Bxe2 17. Qxe2 Rxe5 18. Qd3 Rxe1+ 19. Rxe1 Qf6 20. Qd4 Qxd4 21. cxd4 1-0',
  annotations: [
    {
      moveNumber: 8,
      move: 'Nbd2',
      concept: 'The Flexible Knight',
      explanation: 'Nbd2 is the typical London setup. The knight heads to f1-g3 or e4 via f1. It avoids blocking the c-pawn and keeps options open. This move appears in 72% of master London games at this stage.',
    },
    {
      moveNumber: 9,
      move: 'Bh2',
      concept: 'Retreating with Purpose',
      explanation: 'Bh2 looks passive but is actually very clever. After Black plays ...exd4, our bishop stays active on the long diagonal. It avoids being traded and keeps pressure on e5 and d6. This bishop retreat is a key London System idea.',
    },
    {
      moveNumber: 15,
      move: 'Ne5',
      concept: 'The e5 Outpost',
      explanation: 'Ne5 is the dream square in the London System. The knight cannot be kicked by pawns, attacks f7, and supports our kingside attack. In this structure, masters play Ne5 in 78% of games. Notice how it coordinates with our dark-squared bishop.',
    },
    {
      moveNumber: 16,
      move: 'dxe5',
      concept: 'Opening the Center',
      explanation: 'After Black trades our strong knight, dxe5 recaptures and opens the d-file. White now has a powerful pawn on e5 supported by the Bh2, and the open d-file gives our rooks activity. This central break is a typical London middlegame theme.',
    },
    {
      moveNumber: 20,
      move: 'Qd4',
      concept: 'Centralizing the Queen',
      explanation: 'Qd4 is powerful. The queen controls the center, attacks along the a1-h8 diagonal, and puts pressure on Black. This centralized queen is a typical London pattern when the center opens up after exchanges.',
    },
  ],
  keyTakeaways: [
    'Ne5 is the key outpost in most London positions',
    'Bh2 retreat keeps the bishop safe and active',
    'Trade pieces that challenge your strong squares, but on your terms',
    'A centralized queen (d4) gives maximum flexibility',
  ],
};

/** Training positions for Kingside Attack chapter */
const kingsideAttackPositions: TrainingPosition[] = [
  {
    id: 'pos_kingside_1',
    fen: 'r1bq1rk1/ppp2pbp/2np1np1/4p3/3PP3/2N1BN1P/PP2BPP1/R2QR1K1 w - - 0 1',
    toMove: 'w',
    question: "Black has castled kingside. What is White's best plan?",
    type: 'multiple-choice',
    options: [
      { label: 'A) Castle queenside and attack there', isCorrect: false, explanation: "Queenside castling is too slow. Black's king is on the kingside - that's where we attack!" },
      { label: 'B) Play Ne5, Qd2, prepare h4-h5', isCorrect: true, explanation: 'Perfect! Ne5 is the anchor, Qd2 supports h4-h5 pawn storm. This is the classic London kingside attack pattern.' },
      { label: 'C) Trade all pieces for an endgame', isCorrect: false, explanation: "We have attacking chances with our pieces aimed at Black's king. Trading pieces throws away our advantage." },
      { label: 'D) Play c4 and focus on the center', isCorrect: false, explanation: "While c4 can be useful, with Black's king on the kingside, we should attack there first." },
    ],
    explanation: 'When your opponent castles, ask: "Where is their king?" Then attack that side! The London is perfectly set up for kingside attacks.',
  },
  {
    id: 'pos_kingside_2',
    fen: 'r1bq1rk1/ppp2pbp/2np1np1/4N3/3PP3/2N1B2P/PP2BPP1/R2Q1RK1 w - - 0 1',
    toMove: 'w',
    question: "You've achieved Ne5. What should you play next to continue the attack?",
    type: 'find-move',
    correctMoves: ['Qd2'],
    hints: [
      'Your queen needs to support the kingside push',
      'Think about which squares the queen can reach from d1',
      'Qd2 supports h4-h5 and connects the rooks',
    ],
    explanation: 'Qd2 is excellent! It supports the h4-h5 pawn storm, connects the rooks, and the queen can swing to h6 later. Master games show this queen placement in 70% of positions with Ne5.',
  },
  {
    id: 'pos_kingside_3',
    fen: 'r1bq1rk1/ppp2pbp/2np1np1/4N3/3PP2P/2N1B3/PP1QBPP1/R4RK1 w - - 0 1',
    toMove: 'w',
    question: "Your pieces are ready. What's the next move to start the pawn storm?",
    type: 'find-move',
    correctMoves: ['h5'],
    hints: [
      'Push forward on the kingside!',
      'The h-pawn is already on h4...',
      'h5 attacks the g6 pawn and opens lines',
    ],
    explanation: "h5! starts the pawn attack. After ...Nxh5 we get Bxh5 with pressure, or after ...gxh5 the g-file opens for our rook. This pawn storm is deadly when combined with our centralized pieces.",
  },
  {
    id: 'pos_kingside_4',
    fen: 'r2q1rk1/ppp2pbp/2np1npP/4N3/3PP3/2N1B3/PP1QBPP1/R4RK1 w - - 0 1',
    toMove: 'w',
    question: 'Black has allowed h6. What is the best follow-up?',
    type: 'multiple-choice',
    options: [
      { label: 'A) Take on g7 immediately', isCorrect: false, explanation: 'Too hasty! The g7 pawn is going nowhere. Improve your pieces first.' },
      { label: 'B) Bring a rook to the h-file', isCorrect: true, explanation: "Excellent! h6 weakened Black's kingside. Double on the h-file and the attack plays itself. The h-file will open soon." },
      { label: 'C) Play Qh2 immediately', isCorrect: false, explanation: "Qh2 is premature. We need the rook on the h-file first to create real threats." },
      { label: 'D) Retreat with Qd1', isCorrect: false, explanation: 'Never retreat when attacking! Keep pressing forward.' },
    ],
    explanation: 'When you have space on the kingside, bring more pieces to the attack! Rooks on open/semi-open files are crucial.',
  },
  {
    id: 'pos_kingside_5',
    fen: 'r2q1rk1/ppp2pbp/2np1np1/4N3/3PP3/2N2B2/PP1Q1PPP/R3R1K1 w - - 0 1',
    toMove: 'w',
    question: "Black just played ...Nh5 attacking your dark-squared bishop (which was on e3). It retreated. What's your plan now?",
    type: 'find-move',
    correctMoves: ['Qh6'],
    hints: [
      "With the knight gone from f6, Black's king is weak",
      'Your queen can land on a devastating square',
      'Think about Qh6 combined with your Ne5',
    ],
    explanation: "Qh6! A devastating move. The queen lands right next to Black's king, threatening Ng4 or Nxf7. With the knight gone from f6, Black has no good defense. This pattern - Qh6 when the f6 knight moves - is a key London attacking idea!",
  },
];

/** Chapter 1: Kingside Attack */
const kingsideAttackChapter: MiddlegameChapter = {
  id: 'kingside_attack',
  title: 'Kingside Attack',
  description: 'Learn how to launch devastating kingside attacks in the London System',
  icon: '\u2694\uFE0F',
  color: 'bg-red-600',
  theme: 'Attack',
  masterGame: kingsideAttackGame,
  trainingPositions: kingsideAttackPositions,
  estimatedTime: 15,
};

// ═══════════════════════════════════════════════════════════════
// CHAPTER 2: vs KING'S INDIAN DEFENSE — Central Control
// ═══════════════════════════════════════════════════════════════

const vsKIDGame: AnnotatedGame = {
  id: 'game_vs_kid_1',
  title: 'London vs King\'s Indian: Queenside Domination',
  players: 'Kamsky vs Radjabov, 2012',
  result: '1-0',
  pgn: '1. d4 Nf6 2. Bf4 g6 3. e3 Bg7 4. Nf3 O-O 5. Be2 d6 6. O-O Nbd7 7. h3 c5 8. c3 b6 9. Nbd2 Bb7 10. a4 a6 11. Re1 Qc7 12. Bf1 e5 13. dxe5 dxe5 14. Bg5 h6 15. Bh4 Rfe8 16. Nc4 Rad8 17. Qc2 Nh5 18. Rad1 Nf8 19. a5 bxa5 20. Nxa5 Bc8 21. Qb3 1-0',
  annotations: [
    {
      moveNumber: 10,
      move: 'a4',
      concept: 'Queenside Expansion',
      explanation: 'a4 is the signature move against the KID fianchetto. It grabs queenside space and prepares a5 to break open Black\'s queenside. Against the ...b6 setup, this pawn advance creates lasting pressure on Black\'s structure.',
    },
    {
      moveNumber: 13,
      move: 'dxe5',
      concept: 'Favorable Exchange',
      explanation: 'When Black plays ...e5 in the KID, dxe5 dxe5 opens the d-file for our pieces while Black\'s center becomes a target. The e5 pawn can become weak, and our pieces flood the open lines. White welcomes this exchange.',
    },
    {
      moveNumber: 14,
      move: 'Bg5',
      concept: 'Pinning the Defender',
      explanation: 'After the center opens, Bg5 pins the f6 knight to the queen. This is a key resource — the London bishop transitions from f4 to g5 once the center opens. The pin creates tactical pressure and limits Black\'s piece coordination.',
    },
    {
      moveNumber: 16,
      move: 'Nc4',
      concept: 'The Knight Maneuver',
      explanation: 'Nc4 is a powerful regrouping. The knight eyes both a5 (attacking the queenside) and e5 (the classic outpost). From c4 the knight controls key central and queenside squares, perfectly complementing our a-file pressure.',
    },
    {
      moveNumber: 20,
      move: 'Nxa5',
      concept: 'Breaking Through',
      explanation: 'After a5 bxa5, Nxa5 achieves White\'s strategic goal — the queenside is ripped open. The knight on a5 attacks c6, b7 is exposed, and Black\'s bishop is driven back. White dominates the open lines created by the pawn break.',
    },
  ],
  keyTakeaways: [
    'Against the KID fianchetto, expand on the queenside with a4-a5',
    'Welcome the ...e5 exchange — it opens lines for your pieces',
    'Nc4-a5 is a powerful maneuver that breaks open the queenside',
    'Bg5 transitions the bishop to active kingside pressure after the center opens',
  ],
};

const vsKIDPositions: TrainingPosition[] = [
  {
    id: 'pos_kid_1',
    fen: 'r2q1rk1/pb1nppbp/1p1p1np1/2p5/3P1B2/2P1PN1P/PP1NBPP1/R2Q1RK1 w - - 2 10',
    toMove: 'w',
    question: 'Black has set up a typical KID fianchetto with ...b6 and ...Bb7. What is White\'s best plan?',
    type: 'multiple-choice',
    options: [
      { label: 'A) Play e4 for a central pawn mass', isCorrect: false, explanation: 'e4 weakens the d4 pawn and gives Black the d5 square. In the London we maintain a solid center, not overextend it.' },
      { label: 'B) Play a4 and expand on the queenside', isCorrect: true, explanation: 'Correct! a4 followed by a5 cracks open the queenside where Black is weak. This is the primary plan against the KID fianchetto in the London.' },
      { label: 'C) Play h4 and attack the kingside', isCorrect: false, explanation: 'The kingside attack is premature here. Black\'s kingside is solid with the fianchetto. Target the queenside first.' },
      { label: 'D) Play dxc5 to simplify', isCorrect: false, explanation: 'Trading on c5 relieves Black\'s pressure and gives them easy play. Maintain the central tension.' },
    ],
    explanation: 'Against the KID fianchetto, the queenside is Black\'s weak spot. a4-a5 combined with Nc4-a5 creates devastating pressure on the b-file and weak queenside pawns.',
  },
  {
    id: 'pos_kid_2',
    fen: 'r4rk1/1bqnppbp/pp1p1np1/2p5/P2P1B2/2P1PN1P/1P1NBPP1/R2QR1K1 w - - 2 12',
    toMove: 'w',
    question: 'Your a-pawn is on a4. What is the next key move to continue queenside pressure?',
    type: 'find-move',
    correctMoves: ['a5'],
    hints: [
      'Push further on the queenside!',
      'The a-pawn wants to challenge Black\'s b6 pawn',
      'a5 forces Black to make a difficult decision about the b6 pawn',
    ],
    explanation: 'a5! is the key break. After ...bxa5, White recaptures with the knight via Nc4-a5, establishing a powerful outpost. If Black doesn\'t take, the a5 pawn cramps Black\'s queenside permanently.',
  },
  {
    id: 'pos_kid_3',
    fen: 'r3r1k1/1bqn1pb1/pp3npp/2p1p3/P6B/2P1PN1P/1P1N1PP1/R2QRBK1 w - - 0 16',
    toMove: 'w',
    question: 'The center has opened after dxe5 dxe5. What is the best knight maneuver?',
    type: 'find-move',
    correctMoves: ['Nc4'],
    hints: [
      'One of your knights can reach a very active square',
      'Think about where the d2 knight wants to go',
      'Nc4 eyes both a5 and e5',
    ],
    explanation: 'Nc4! is the star move. The knight is perfectly placed — it eyes a5 (queenside pressure) and e5 (central outpost). From c4, the knight supports the entire queenside strategy while keeping central options open.',
  },
  {
    id: 'pos_kid_4',
    fen: 'r4rk1/1bqn1pbp/pp3np1/2p1p3/P4B2/2P1PN1P/1P1N1PP1/R2QRBK1 w - - 0 14',
    toMove: 'w',
    question: 'Black just played ...e5. How should White respond?',
    type: 'multiple-choice',
    options: [
      { label: 'A) Play dxe5 and open lines', isCorrect: true, explanation: 'Excellent! dxe5 dxe5 opens the d-file for your rooks. Black\'s e5 pawn becomes a target, and your pieces become very active on the open files.' },
      { label: 'B) Play d5 and lock the center', isCorrect: false, explanation: 'd5 closes the position and takes away your pieces\' activity. You want open lines for your rooks and bishops.' },
      { label: 'C) Ignore it and play on the queenside', isCorrect: false, explanation: 'You should address the center first. After dxe5, the open d-file gives you a concrete advantage before continuing queenside play.' },
      { label: 'D) Play Bxe5 immediately', isCorrect: false, explanation: 'Trading the bishop for a pawn is poor. The bishop is more valuable on the diagonal. dxe5 is better since dxe5 recaptures centrally.' },
    ],
    explanation: 'In the London vs KID, you should welcome the ...e5 break. After dxe5 dxe5, the open d-file and Black\'s exposed e5 pawn give White a long-term advantage.',
  },
  {
    id: 'pos_kid_5',
    fen: '3rrnk1/1bq2pb1/pp4pp/2p1p2n/P1N4B/2P1PN1P/1PQ2PP1/3RRBK1 w - - 8 19',
    toMove: 'w',
    question: 'Black\'s queenside is weakened. Find the breakthrough move.',
    type: 'find-move',
    correctMoves: ['a5'],
    hints: [
      'Your a-pawn is ready to strike',
      'Think about opening the a and b files',
      'a5 attacks the b6 pawn directly',
    ],
    explanation: 'a5! breaks through on the queenside. After ...bxa5, Nxa5 gives White a dominant knight on a5, attacking c6 and b7. The open a and b files let White\'s rooks pour in. This is the culmination of the queenside strategy.',
  },
];

const vsKIDChapter: MiddlegameChapter = {
  id: 'vs_kid',
  title: 'vs King\'s Indian Defense',
  description: 'Control the center and dominate the queenside against the KID fianchetto',
  icon: '\u265C',
  color: 'bg-blue-600',
  theme: 'Central Control',
  masterGame: vsKIDGame,
  trainingPositions: vsKIDPositions,
  estimatedTime: 15,
};

// ═══════════════════════════════════════════════════════════════
// CHAPTER 3: vs QUEEN'S GAMBIT DECLINED — Minority Attack
// ═══════════════════════════════════════════════════════════════

const vsQGDGame: AnnotatedGame = {
  id: 'game_vs_qgd_1',
  title: 'London vs QGD: The Classic Minority Attack',
  players: 'Jobava vs Karjakin, 2014',
  result: '1-0',
  pgn: '1. d4 Nf6 2. Bf4 d5 3. e3 e6 4. Nf3 Be7 5. Nbd2 O-O 6. c3 c6 7. Bd3 Nbd7 8. O-O Re8 9. Qe2 Nf8 10. Ne5 Ng6 11. Nxg6 hxg6 12. e4 dxe4 13. Nxe4 Nxe4 14. Bxe4 Bd6 15. Bg3 Bxg3 16. hxg3 Qd6 17. Rad1 Bd7 18. b4 Rad8 19. a4 Bc8 20. b5 1-0',
  annotations: [
    {
      moveNumber: 10,
      move: 'Ne5',
      concept: 'The Central Outpost',
      explanation: 'Ne5 is the London\'s most important idea against the QGD. The knight sits on e5 unchallenged — Black can\'t easily kick it with ...f6 due to the weakened kingside. From e5, the knight controls d7, f7, and supports the e4 break.',
    },
    {
      moveNumber: 12,
      move: 'e4',
      concept: 'The Central Break',
      explanation: 'e4 is the key pawn break in the London vs QGD. After the knight exchange on g6, White opens the center at exactly the right moment. This break challenges Black\'s d5 pawn and activates the light-squared bishop. Timing this break is crucial.',
    },
    {
      moveNumber: 15,
      move: 'Bg3',
      concept: 'Strategic Bishop Retreat',
      explanation: 'After Black plays ...Bd6 to challenge our bishop, Bg3 is the correct retreat. We exchange dark-squared bishops on our terms. This trade actually helps White — it removes a key defender of Black\'s king and creates the h-file for our rook.',
    },
    {
      moveNumber: 18,
      move: 'b4',
      concept: 'Starting the Minority Attack',
      explanation: 'b4 begins the famous minority attack. White advances the b-pawn to b5, where it attacks Black\'s c6 pawn. The idea is to create a weak pawn on c6 (or an isolated pawn on d5) that can be attacked. This is a classic strategic weapon.',
    },
    {
      moveNumber: 20,
      move: 'b5',
      concept: 'Completing the Minority Attack',
      explanation: 'b5! strikes at the c6 pawn. After ...cxb5, axb5 creates a backward c-pawn or isolated d-pawn for Black. If Black doesn\'t take, White can play bxc6 creating doubled pawns. Either way, Black gets lasting structural weaknesses.',
    },
  ],
  keyTakeaways: [
    'Ne5 is the anchor move — establish it early against the QGD',
    'Time the e4 break carefully after piece exchanges',
    'The minority attack (b4-b5) targets the c6 pawn weakness',
    'Exchange dark-squared bishops to weaken Black\'s king',
  ],
};

const vsQGDPositions: TrainingPosition[] = [
  {
    id: 'pos_qgd_1',
    fen: 'r1bqr1k1/pp1nbppp/2p1pn2/3p4/3P1B2/2PBPN2/PP1NQPPP/R4RK1 w - - 5 9',
    toMove: 'w',
    question: 'You have the classic London setup vs QGD. What is the best square for your f3 knight?',
    type: 'find-move',
    correctMoves: ['Ne5'],
    hints: [
      'Your knight wants the strongest possible outpost',
      'Think about which central square can\'t be challenged by Black\'s pawns',
      'The e5 square is the dream for London knights',
    ],
    explanation: 'Ne5! The knight reaches its ideal outpost. From e5 it controls d7, f7, c6, and g6. Black cannot easily remove it since ...f6 would fatally weaken the kingside. This is the #1 move to play against the QGD structure.',
  },
  {
    id: 'pos_qgd_2',
    fen: 'r1bqr1k1/pp2bpp1/2p1pnp1/3p4/3P1B2/2PBP3/PP1NQPPP/R4RK1 w - - 0 12',
    toMove: 'w',
    question: 'The knights have been exchanged and Black has a solid center. What is the key pawn break?',
    type: 'find-move',
    correctMoves: ['e4'],
    hints: [
      'Challenge Black\'s central pawn',
      'Your bishop on d3 will become very active after this break',
      'e4 opens the position favorably for White',
    ],
    explanation: 'e4! opens the center at the right moment. After dxe4 Nxe4 (or Bxe4), White activates the bishop and gains central control. This break is the key to converting the London\'s positional advantages into concrete pressure.',
  },
  {
    id: 'pos_qgd_3',
    fen: 'r1b1r1k1/pp3pp1/2pqp1p1/8/3PB3/2P3P1/PP2QPP1/3R1RK1 w - - 2 17',
    toMove: 'w',
    question: 'The position has opened up. How should White begin the minority attack?',
    type: 'multiple-choice',
    options: [
      { label: 'A) Play b4, starting the minority attack', isCorrect: true, explanation: 'Perfect! b4 is the start of the minority attack. The plan is b4-b5 to attack the c6 pawn. This creates lasting structural weaknesses in Black\'s position.' },
      { label: 'B) Play f4 for a kingside attack', isCorrect: false, explanation: 'f4 weakens your own king and doesn\'t address the queenside weakness. The minority attack is the thematic plan here.' },
      { label: 'C) Play Rd3 to double rooks', isCorrect: false, explanation: 'Doubling rooks can wait. First, start the pawn advance — b4 creates the conditions for your rooks to become effective later.' },
      { label: 'D) Trade queens with Qd3', isCorrect: false, explanation: 'Keep the queens on! With the minority attack, White has attacking chances. Trading queens would reduce your winning potential.' },
    ],
    explanation: 'The minority attack is White\'s primary strategic weapon against the QGD structure. By advancing b4-b5, White creates permanent weaknesses in Black\'s pawn structure.',
  },
  {
    id: 'pos_qgd_4',
    fen: 'r1bqr1k1/pp1nbppp/2p1pn2/3pN3/3P1B2/2PBP3/PP1NQPPP/R4RK1 w - - 0 10',
    toMove: 'w',
    question: 'You have Ne5 established. Black wants to trade your strong knight with ...Nxe5. What should you be ready to do?',
    type: 'multiple-choice',
    options: [
      { label: 'A) Recapture with dxe5', isCorrect: false, explanation: 'dxe5 gives up the d4 pawn and opens the position for Black\'s bishops. Not ideal.' },
      { label: 'B) Recapture with Bxe5', isCorrect: false, explanation: 'Bxe5 trades your powerful dark-squared bishop. Keep it for attacking chances.' },
      { label: 'C) Let Black take first, then recapture with the knight (Nxg6)', isCorrect: true, explanation: 'Correct! If Black exchanges on e5 and the knight recaptures on g6, you open the h-file. If Black plays ...Ng6, Nxg6 hxg6 gives White the h-file for the rook — a powerful attacking resource.' },
      { label: 'D) Move the knight away', isCorrect: false, explanation: 'Never retreat from a strong outpost! The knight on e5 is your best piece.' },
    ],
    explanation: 'The exchange on g6 (Nxg6 hxg6) opens the h-file for White\'s rook, creating attacking chances. This is a key pattern in the London vs QGD — the h-file becomes a powerful weapon.',
  },
  {
    id: 'pos_qgd_5',
    fen: '2brr1k1/pp3pp1/2pqp1p1/8/PP1PB3/2P3P1/4QPP1/3R1RK1 w - - 1 20',
    toMove: 'w',
    question: 'The minority attack is underway with b4 and a4. Find the decisive break.',
    type: 'find-move',
    correctMoves: ['b5'],
    hints: [
      'Continue the pawn advance on the queenside',
      'Target the c6 pawn directly',
      'b5 creates permanent structural damage',
    ],
    explanation: 'b5! is the culmination of the minority attack. Black must deal with the threat to c6. After ...cxb5 axb5, the c-file opens and Black has a weak backward pawn. If Black plays ...c5, then dxc5 gives White a passed d-pawn. Either way, White wins strategically.',
  },
];

const vsQGDChapter: MiddlegameChapter = {
  id: 'vs_qgd',
  title: 'vs Queen\'s Gambit Declined',
  description: 'Execute the minority attack and exploit weak pawns',
  icon: '\u265F',
  color: 'bg-purple-600',
  theme: 'Minority Attack',
  masterGame: vsQGDGame,
  trainingPositions: vsQGDPositions,
  estimatedTime: 15,
};

// ═══════════════════════════════════════════════════════════════
// CHAPTER 4: vs QUEEN'S INDIAN DEFENSE — Bishop Pair & Central Expansion
// ═══════════════════════════════════════════════════════════════

const vsQIDGame: AnnotatedGame = {
  id: 'game_vs_qid_1',
  title: 'London vs QID: Central Domination',
  players: 'Rapport vs Giri, 2019',
  result: '1-0',
  pgn: '1. d4 Nf6 2. Bf4 e6 3. e3 b6 4. Nf3 Bb7 5. Nbd2 Be7 6. h3 O-O 7. Bd3 d6 8. O-O Nbd7 9. c3 c5 10. Qe2 Qc7 11. Rae1 Rfe8 12. e4 cxd4 13. cxd4 e5 14. dxe5 dxe5 15. Bh2 Nc5 16. Bc4 Rad8 17. Nb3 Ncxe4 18. Nxe5 Qxe5 19. Bxe5 Rd2 20. Qe3 1-0',
  annotations: [
    {
      moveNumber: 12,
      move: 'e4',
      concept: 'Central Expansion',
      explanation: 'e4 is the key break against the QID. White seizes the center with two pawns abreast. Black must react to this central expansion. The bishop pair combined with central control gives White a significant advantage. This move transforms the position.',
    },
    {
      moveNumber: 14,
      move: 'dxe5',
      concept: 'Opening the Position',
      explanation: 'After ...e5, dxe5 dxe5 opens the d-file. With both bishops and open lines, White\'s pieces become extremely active. The bishop on h2 controls the long diagonal, and the d-file gives the rooks targets. Open positions favor the bishop pair.',
    },
    {
      moveNumber: 15,
      move: 'Bh2',
      concept: 'Preserving the Bishop',
      explanation: 'Bh2 is the London\'s trademark retreat. When Black challenges our dark-squared bishop, we retreat to h2 where it remains very active on the a7-g1 diagonal. Never trade this bishop unless you get something concrete in return — it\'s a long-term asset.',
    },
    {
      moveNumber: 16,
      move: 'Bc4',
      concept: 'Active Bishop Placement',
      explanation: 'Bc4 activates the light-squared bishop aggressively. It targets f7, controls key central squares, and works in harmony with our other bishop on h2. With both bishops aimed at the kingside, White has significant attacking potential. The bishop pair is our main advantage.',
    },
    {
      moveNumber: 20,
      move: 'Qe3',
      concept: 'Maintaining Coordination',
      explanation: 'Qe3 centralizes the queen while keeping the bishops active. White maintains pressure on all fronts — the rook on d2 is under fire, and the bishop pair controls key diagonals. When you have the bishop pair, keep the position open and coordinate your pieces.',
    },
  ],
  keyTakeaways: [
    'Push e4 to seize the center against the QID fianchetto',
    'Retreat Bh2 to preserve the dark-squared bishop — it\'s a long-term asset',
    'Activate both bishops aggressively — the bishop pair is your advantage',
    'Keep the position open when you have two bishops vs bishop and knight',
  ],
};

const vsQIDPositions: TrainingPosition[] = [
  {
    id: 'pos_qid_1',
    fen: 'r3r1k1/pbqnbppp/1p1ppn2/2p5/3P1B2/2PBPN1P/PP1NQPP1/4RRK1 w - - 4 12',
    toMove: 'w',
    question: 'You have the London setup vs the QID. What is the most important pawn break?',
    type: 'find-move',
    correctMoves: ['e4'],
    hints: [
      'Expand in the center!',
      'Your pieces are well-placed to support a central advance',
      'e4 seizes space and opens lines for your bishops',
    ],
    explanation: 'e4! is the critical break. It grabs central space, opens diagonals for both bishops, and puts Black under immediate pressure. Against the QID, the e4 advance is White\'s most powerful strategic tool. After e4, White\'s bishops come to life.',
  },
  {
    id: 'pos_qid_2',
    fen: 'r3r1k1/pbqnbppp/1p3n2/4p3/4PB2/3B1N1P/PP1NQPP1/4RRK1 w - - 0 15',
    toMove: 'w',
    question: 'Black has played ...e5, challenging your bishop. Where should the bishop retreat?',
    type: 'find-move',
    correctMoves: ['Bh2'],
    hints: [
      'The bishop needs a safe square that keeps it active',
      'Think about the long diagonal from h2',
      'Bh2 is the London\'s signature retreat',
    ],
    explanation: 'Bh2! keeps the bishop active on the long h2-b8 diagonal. From h2 it controls e5 and d6, and can\'t be easily challenged. This is a fundamental London System pattern — always retreat to h2, never trade the dark-squared bishop unnecessarily.',
  },
  {
    id: 'pos_qid_3',
    fen: 'r3r1k1/pbqnbppp/1p3n2/4p3/4P3/3B1N1P/PP1NQPPB/4RRK1 w - - 0 16',
    toMove: 'w',
    question: 'Your dark-squared bishop is safe on h2. How should you activate your light-squared bishop?',
    type: 'multiple-choice',
    options: [
      { label: 'A) Play Bc4, targeting f7', isCorrect: true, explanation: 'Correct! Bc4 is the most aggressive placement. The bishop aims at f7, works with the h2 bishop, and controls the a2-g8 diagonal. Both bishops become a powerful attacking duo.' },
      { label: 'B) Play Bb5, pinning the knight', isCorrect: false, explanation: 'Bb5 doesn\'t achieve much — Black can simply play ...a6. Bc4 is more aggressive and creates real threats.' },
      { label: 'C) Play Be2 to keep it safe', isCorrect: false, explanation: 'Be2 is too passive. When you have the bishop pair, you need to activate them aggressively. Bc4 is far more dynamic.' },
      { label: 'D) Leave it on d3 and play f4', isCorrect: false, explanation: 'f4 weakens your own king. The bishop belongs on c4 where it controls key squares and creates threats against f7.' },
    ],
    explanation: 'With both bishops, placement is everything. Bc4 creates the ideal bishop duo — dark-squared bishop on h2 controlling the long diagonal, light-squared bishop on c4 targeting f7. This pair creates immense pressure.',
  },
  {
    id: 'pos_qid_4',
    fen: 'r3r1k1/pbq1bppp/1p3n2/2n1p3/2B1P3/5N1P/PP1NQPPB/4RRK1 w - - 0 16',
    toMove: 'w',
    question: 'Black is challenging your e4 pawn with ...Nc5. What is White\'s best approach?',
    type: 'multiple-choice',
    options: [
      { label: 'A) Play Nb3, challenging the knight', isCorrect: true, explanation: 'Correct! Nb3 challenges the c5 knight directly. If Black takes, Bxb3 keeps the bishop pair and maintains central control. White keeps both bishops active.' },
      { label: 'B) Play f3 to protect e4', isCorrect: false, explanation: 'f3 is too passive and weakens the king. Active piece play (Nb3) is better than passive pawn moves.' },
      { label: 'C) Play e5 to gain space', isCorrect: false, explanation: 'e5 pushes the pawn forward but loses central control. The knight on c5 would love to reach d3 or e4 after the center is fixed.' },
      { label: 'D) Trade bishops with Bxb7', isCorrect: false, explanation: 'Trading a bishop gives up your advantage! The bishop pair is your main asset. Keep both bishops on the board.' },
    ],
    explanation: 'When your opponent attacks the center, respond with piece play, not passive pawn moves. Nb3 maintains the initiative and preserves the powerful bishop pair.',
  },
  {
    id: 'pos_qid_5',
    fen: 'r2qr1k1/pb2bppp/1pn2n2/2ppp3/3P1B2/2PBPN1P/PP1N1PP1/R2QR1K1 w - - 0 12',
    toMove: 'w',
    question: 'Black has a solid center with pawns on d5 and e5. How do you activate your position?',
    type: 'find-move',
    correctMoves: ['e4'],
    hints: [
      'Challenge the center!',
      'Don\'t let Black keep two strong center pawns unchallenged',
      'The e-pawn break opens lines for your bishops',
    ],
    explanation: 'e4! challenges Black\'s center immediately. After ...dxe4 Bxe4, your bishop becomes a monster on the long diagonal. If Black plays ...d4, then c4 controls the center. You must act in the center before Black consolidates.',
  },
];

const vsQIDChapter: MiddlegameChapter = {
  id: 'vs_qid',
  title: 'vs Queen\'s Indian Defense',
  description: 'Maintain the bishop pair and dominate the center',
  icon: '\u265D',
  color: 'bg-green-600',
  theme: 'Bishop Pair',
  masterGame: vsQIDGame,
  trainingPositions: vsQIDPositions,
  estimatedTime: 15,
};

// ═══════════════════════════════════════════════════════════════
// CHAPTER 5: vs DUTCH DEFENSE — Exploiting Weaknesses
// ═══════════════════════════════════════════════════════════════

const vsDutchGame: AnnotatedGame = {
  id: 'game_vs_dutch_1',
  title: 'London vs Dutch: Punishing the Weakened King',
  players: 'Carlsen vs Van Foreest, 2020',
  result: '1-0',
  pgn: '1. d4 f5 2. Bf4 Nf6 3. e3 e6 4. Nf3 d6 5. Bd3 Be7 6. O-O O-O 7. Nbd2 Nc6 8. c3 Bd7 9. Re1 Qe8 10. e4 fxe4 11. Nxe4 Nxe4 12. Bxe4 d5 13. Bd3 Bd6 14. Bg3 Bxg3 15. hxg3 Qf7 16. Ne5 Nxe5 17. dxe5 Bc6 18. Qg4 Qg6 19. Qe2 Rad8 20. f4 1-0',
  annotations: [
    {
      moveNumber: 10,
      move: 'e4',
      concept: 'Exploiting the Weakened Kingside',
      explanation: 'e4 is the most critical break against the Dutch. Black\'s ...f5 weakened the e6 and e5 squares permanently. By playing e4, White forces an exchange that opens the position — exactly what Black doesn\'t want. The e5 square becomes available for the knight.',
    },
    {
      moveNumber: 13,
      move: 'Bd3',
      concept: 'Active Bishop Retreat',
      explanation: 'After the center opens, Bd3 places the bishop on its best diagonal. It aims at the kingside (h7) and supports future play on the e-file. The bishop is much stronger than Black\'s pieces since ...f5 left holes everywhere.',
    },
    {
      moveNumber: 16,
      move: 'Ne5',
      concept: 'The Dream Outpost',
      explanation: 'Ne5 exploits the hole created by ...f5. This is the ultimate punishment — Black gave up control of e5 with their first move, and now a knight lands there permanently. From e5 the knight attacks d7, f7, g6, and dominates the board.',
    },
    {
      moveNumber: 17,
      move: 'dxe5',
      concept: 'Permanent Space Advantage',
      explanation: 'After Nxe5 dxe5, White has a powerful pawn on e5 that cramps Black\'s entire position. The pawn controls d6 and f6, making it very hard for Black\'s pieces to find active squares. This space advantage is a direct consequence of Black\'s ...f5.',
    },
    {
      moveNumber: 20,
      move: 'f4',
      concept: 'Locking Down the Position',
      explanation: 'f4 secures the e5 pawn and creates a powerful pawn chain. White\'s space advantage is now permanent. Black\'s pieces are passive, and White can build up pressure at leisure. The London System has completely neutralized the Dutch Defense\'s aggressive intentions.',
    },
  ],
  keyTakeaways: [
    'Against the Dutch, e4 is the critical break — exploit the holes left by ...f5',
    'Ne5 is the dream outpost since Black can never play ...f6 to challenge it',
    'The e5 pawn gives White a permanent space advantage',
    'The Dutch weakens Black\'s king — punish it with piece activity, not just pawn moves',
  ],
};

const vsDutchPositions: TrainingPosition[] = [
  {
    id: 'pos_dutch_1',
    fen: 'r3qrk1/pppbb1pp/2nppn2/5p2/3P1B2/2PBPN2/PP1N1PPP/R2QR1K1 w - - 3 10',
    toMove: 'w',
    question: 'Black has played ...f5 in the Dutch Defense. What is White\'s best strategy?',
    type: 'multiple-choice',
    options: [
      { label: 'A) Play e4 to open the center', isCorrect: true, explanation: 'Correct! e4 exploits the weakness of ...f5. After fxe4 Nxe4, White controls the center and the e5 square becomes a permanent outpost. Black\'s kingside is fatally weakened.' },
      { label: 'B) Play h3 and develop slowly', isCorrect: false, explanation: 'Too slow! Against the Dutch, you must act quickly in the center. Black wants to build a kingside attack — don\'t give them time.' },
      { label: 'C) Play g4 to attack the f5 pawn', isCorrect: false, explanation: 'g4 weakens your own king dangerously. e4 is cleaner and achieves the same goal of opening the center.' },
      { label: 'D) Play b4 for queenside play', isCorrect: false, explanation: 'Queenside play is too slow against the Dutch. The center is where you strike — e4 opens the position and exposes Black\'s weaknesses.' },
    ],
    explanation: 'Against the Dutch, the e4 break is your nuclear option. Black\'s ...f5 created permanent holes on e5 and e6. Opening the center with e4 exploits these weaknesses immediately.',
  },
  {
    id: 'pos_dutch_2',
    fen: 'r3qrk1/pppbb1pp/2n1p3/3p4/3PBB2/2P2N2/PP3PPP/R2QR1K1 w - - 0 13',
    toMove: 'w',
    question: 'The center has opened after e4 fxe4 Nxe4 Nxe4 Bxe4 d5. Where should the bishop retreat?',
    type: 'find-move',
    correctMoves: ['Bd3'],
    hints: [
      'The bishop needs an active diagonal',
      'Think about targeting the kingside',
      'Bd3 aims at h7 and keeps central control',
    ],
    explanation: 'Bd3! places the bishop on the best diagonal. It aims toward h7, supports the center, and prepares to coordinate with other pieces for kingside pressure. After ...f5 weakened the dark squares, Bd3 on the light squares is perfectly complementary.',
  },
  {
    id: 'pos_dutch_3',
    fen: 'r4rk1/pppb1qpp/2n1p3/3p4/3P4/2PB1NP1/PP3PP1/R2QR1K1 w - - 1 16',
    toMove: 'w',
    question: 'Black\'s king is weakened by ...f5. What is the ideal outpost for your knight?',
    type: 'find-move',
    correctMoves: ['Ne5'],
    hints: [
      'Black played ...f5 — which square did that weaken?',
      'Your knight wants the strongest possible outpost',
      'The e5 square can never be challenged by a pawn after ...f5',
    ],
    explanation: 'Ne5! occupies the dream outpost. Since Black played ...f5, the e5 square is permanently available — no pawn can ever kick this knight. From e5, the knight attacks f7, d7, g6, and g4. This is the ultimate punishment for the Dutch Defense.',
  },
  {
    id: 'pos_dutch_4',
    fen: 'r1b2rk1/pppnq1pp/4pn2/3p1p2/3PNB2/3BPN2/PPP2PPP/R2QR1K1 w - - 0 10',
    toMove: 'w',
    question: 'You have a strong center vs the Dutch. When should White play e4?',
    type: 'multiple-choice',
    options: [
      { label: 'A) Play e4 immediately', isCorrect: true, explanation: 'Yes! e4 is best now while Black\'s pieces are uncoordinated. After fxe4, White recaptures with excellent central control and the e5 square opens up.' },
      { label: 'B) Wait and improve pieces first', isCorrect: false, explanation: 'Waiting gives Black time to consolidate. The e4 break is strongest when played early, before Black can organize a defense.' },
      { label: 'C) Play c4 instead', isCorrect: false, explanation: 'c4 is the wrong break. The e4 advance is what exploits the ...f5 weakness. c4 doesn\'t target the dark square holes.' },
      { label: 'D) Play g3 to support the bishop', isCorrect: false, explanation: 'g3 is unnecessary and slow. e4 is the move that takes advantage of Black\'s weakened structure.' },
    ],
    explanation: 'Against the Dutch, e4 should be played as soon as it\'s prepared. The longer you wait, the more time Black has to solidify. Strike while the iron is hot!',
  },
  {
    id: 'pos_dutch_5',
    fen: '3r1rk1/ppp3pp/2b1p1q1/3pP3/8/2PB2P1/PP2QPP1/R3R1K1 w - - 5 20',
    toMove: 'w',
    question: 'White has a powerful e5 pawn. How do you lock down the advantage permanently?',
    type: 'find-move',
    correctMoves: ['f4'],
    hints: [
      'Support the e5 pawn permanently',
      'Create a pawn chain that can\'t be challenged',
      'f4 secures the space advantage forever',
    ],
    explanation: 'f4! creates an unbreakable pawn chain on e5-f4. Black\'s pieces are permanently cramped. The e5 pawn controls d6 and f6, and now with f4 it can never be undermined. White has a lasting strategic advantage from the weaknesses created by ...f5.',
  },
];

const vsDutchChapter: MiddlegameChapter = {
  id: 'vs_dutch',
  title: 'vs Dutch Defense',
  description: 'Exploit the weaknesses created by Black\'s ...f5',
  icon: '\u265E',
  color: 'bg-red-600',
  theme: 'Exploiting Weaknesses',
  masterGame: vsDutchGame,
  trainingPositions: vsDutchPositions,
  estimatedTime: 15,
};

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL CHAPTERS
// ═══════════════════════════════════════════════════════════════

export const middlegameChapters: Record<string, MiddlegameChapter> = {
  kingside_attack: kingsideAttackChapter,
  vs_kid: vsKIDChapter,
  vs_qgd: vsQGDChapter,
  vs_qid: vsQIDChapter,
  vs_dutch: vsDutchChapter,
};
