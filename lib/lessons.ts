import type { LessonStep, Lesson } from './types';

export type { LessonStep, Lesson };

export const lessons: Record<string, Lesson> = {
  kid: {
    id: 'kid',
    name: "vs King's Indian Defense",
    description: "Black plays ...Nf6, ...g6, ...Bg7, ...d6",
    color: "bg-red-600",
    icon: "🏰",
    keyIdeas: [
      "Develop Bf4 before e3 — the London trademark",
      "Be2 (not Bd3) since Black hasn't played ...d5",
      "Plan: h3, Nbd2, c3, then consider e4 break",
    ],
    steps: [
      { move: 'd4', side: 'w', explanation: "The London System always starts with 1.d4 — controlling the center with the queen's pawn.", highlight: "Opening Move" },
      { move: 'Nf6', side: 'b', explanation: "Black develops the knight to f6. This flexible move often leads to the King's Indian setup." },
      { move: 'Bf4', side: 'w', explanation: "The signature London move! Develop the dark-squared bishop BEFORE playing e3. This is the defining idea.", highlight: "Key Principle" },
      { move: 'g6', side: 'b', explanation: "Black fianchettoes — a clear sign of the King's Indian Defense. They want to put the bishop on g7." },
      { move: 'e3', side: 'w', explanation: "Solidify d4 and open the diagonal for the light-squared bishop. Safe now because Bf4 is already out!", highlight: "Structure" },
      { move: 'Bg7', side: 'b', explanation: "Black completes the fianchetto. The bishop on g7 is powerful, but our London structure handles it." },
      { move: 'Nf3', side: 'w', explanation: "Natural knight development. It supports d4 and controls the key e5 square." },
      { move: 'd6', side: 'b', explanation: "Typical King's Indian: Black plays ...d6 and will aim for ...e5 later to challenge the center." },
      { move: 'Be2', side: 'w', explanation: "In the KID variation, Be2 is preferred over Bd3 since Black hasn't played ...d5 to target.", highlight: "Variation Choice" },
      { move: 'O-O', side: 'b', explanation: "Black castles kingside. Standard development." },
      { move: 'O-O', side: 'w', explanation: "Castle and connect the rooks. White has a solid, harmonious London setup!", highlight: "Setup Complete" },
      { move: 'Nbd7', side: 'b', explanation: "Black develops the second knight. White's plan: h3 (prevent ...Nh5), Nbd2, c3, then look for e4." },
    ]
  },

  qgd: {
    id: 'qgd',
    name: "vs Queen's Gambit Declined",
    description: "Black plays ...d5, ...e6, ...Nf6, ...Be7",
    color: "bg-blue-600",
    icon: "👑",
    keyIdeas: [
      "Bd3 pairs with Bf4 to create a deadly battery",
      "Nbd2 (not Nc3) — keep the c-pawn free for c3",
      "Plan: c3, Qe2, then Ne5 for kingside pressure",
    ],
    steps: [
      { move: 'd4', side: 'w', explanation: "Start with the queen's pawn. The London System begins!", highlight: "Opening Move" },
      { move: 'd5', side: 'b', explanation: "The classical response. Black mirrors the center pawn, leading to a QGD-type structure." },
      { move: 'Bf4', side: 'w', explanation: "Get the bishop out before e3! This is THE key London principle that many players forget.", highlight: "Key Principle" },
      { move: 'Nf6', side: 'b', explanation: "Black develops the knight naturally. A standard QGD developing move." },
      { move: 'e3', side: 'w', explanation: "Now e3 is safe — Bf4 is already developed. This supports d4 and opens the f1-a6 diagonal.", highlight: "Structure" },
      { move: 'e6', side: 'b', explanation: "Black solidifies d5 with ...e6. Classical QGD structure — solid but slightly passive." },
      { move: 'Nf3', side: 'w', explanation: "Natural development supporting d4 and controlling central squares." },
      { move: 'Be7', side: 'b', explanation: "A modest bishop development. Solid but passive — this is good news for White!" },
      { move: 'Bd3', side: 'w', explanation: "Bd3 is excellent here! It eyes h7 and pairs with Bf4 to create the classic London attacking battery.", highlight: "Attacking Setup" },
      { move: 'O-O', side: 'b', explanation: "Black castles. White continues with purposeful development." },
      { move: 'Nbd2', side: 'w', explanation: "Knight to d2, not c3! Keeping the c-pawn free for c3 is essential in the London System.", highlight: "Key Principle" },
      { move: 'c5', side: 'b', explanation: "Black challenges the center. White has a comfortable position — c3 maintains the center, or allow exchanges for open lines." },
    ]
  },

  qid: {
    id: 'qid',
    name: "vs Queen's Indian Defense",
    description: "Black plays ...Nf6, ...e6, ...b6, ...Bb7",
    color: "bg-purple-600",
    icon: "🎯",
    keyIdeas: [
      "Control e4 — Black's bishop on b7 targets it",
      "Bd3 + Nbd2 before committing to c4 or c3",
      "Plan: h3, O-O, then decide on c3 or c4 based on Black's setup",
    ],
    steps: [
      { move: 'd4', side: 'w', explanation: "1.d4 — Standard London opening move.", highlight: "Opening Move" },
      { move: 'Nf6', side: 'b', explanation: "Black plays the flexible ...Nf6, waiting to see White's setup." },
      { move: 'Bf4', side: 'w', explanation: "The London bishop comes out immediately. Always before e3!", highlight: "Key Principle" },
      { move: 'e6', side: 'b', explanation: "Black prepares ...b6 and ...Bb7. This is the start of the Queen's Indian setup." },
      { move: 'e3', side: 'w', explanation: "Solidify the center. The bishop is already developed, so e3 is perfectly timed." },
      { move: 'b6', side: 'b', explanation: "The Queen's Indian move! Black will fianchetto on b7 to pressure the long diagonal." },
      { move: 'Nf3', side: 'w', explanation: "Develop naturally. The knight supports d4 and controls e5.", highlight: "Development" },
      { move: 'Bb7', side: 'b', explanation: "Black completes the fianchetto. The bishop eyes e4 and the kingside." },
      { move: 'Bd3', side: 'w', explanation: "Bd3 controls e4 from White's side and prepares kingside castling.", highlight: "Control e4" },
      { move: 'Be7', side: 'b', explanation: "Quiet development. Black has a flexible but slightly passive position." },
      { move: 'Nbd2', side: 'w', explanation: "The knight goes to d2 — supporting e4 and keeping the c-pawn mobile.", highlight: "Flexible Setup" },
      { move: 'O-O', side: 'b', explanation: "Black castles. White should castle too, then consider h3, c3, and the e4 break when ready." },
      { move: 'O-O', side: 'w', explanation: "Castle and complete development. White has a harmonious London position with clear plans!", highlight: "Setup Complete" },
      { move: 'd5', side: 'b', explanation: "Black stakes a claim in the center. White can play c4 to challenge or c3 for solidity." },
    ]
  },

  dutch: {
    id: 'dutch',
    name: "vs Dutch Defense",
    description: "Black plays ...f5 — aggressive but risky!",
    color: "bg-orange-600",
    icon: "⚔️",
    keyIdeas: [
      "Black's kingside is weakened by ...f5",
      "Target the e1-a5 diagonal and the light squares",
      "Plan: Nh3-f4, Bd3, Qh5 ideas to exploit king safety",
    ],
    steps: [
      { move: 'd4', side: 'w', explanation: "1.d4 — Our standard London opening.", highlight: "Opening Move" },
      { move: 'f5', side: 'b', explanation: "The Dutch Defense! Aggressive but weakens the kingside. The London System is one of the best responses." },
      { move: 'Bf4', side: 'w', explanation: "Bf4 is strong against the Dutch — the bishop eyes the weakened dark squares around Black's king.", highlight: "Exploiting Weakness" },
      { move: 'Nf6', side: 'b', explanation: "Black develops the knight. A standard move in the Dutch." },
      { move: 'e3', side: 'w', explanation: "Solid structure. We're in no rush — Black has already weakened their position.", highlight: "Structure" },
      { move: 'e6', side: 'b', explanation: "Black supports ...d5 and develops. A cautious approach." },
      { move: 'Nf3', side: 'w', explanation: "Natural development. The knight may later jump to e5 or even h4-f3-g5 routes.", highlight: "Development" },
      { move: 'd6', side: 'b', explanation: "Black plays ...d6 instead of ...d5, keeping the position closed." },
      { move: 'Bd3', side: 'w', explanation: "Bd3 is very strong vs the Dutch! It eyes the h7 pawn and the f5 pawn is a target.", highlight: "Attacking Setup" },
      { move: 'Be7', side: 'b', explanation: "Black develops modestly. The kingside remains vulnerable." },
      { move: 'O-O', side: 'w', explanation: "Castle and prepare the attack. White's position is very comfortable.", highlight: "Preparation" },
      { move: 'O-O', side: 'b', explanation: "Black castles into potential danger. White can now prepare h3, Nbd2-f3-e5 or Qe1-h4 plans." },
    ]
  }
};
