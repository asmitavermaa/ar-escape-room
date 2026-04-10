export type ScanType = 'dark' | 'bright' | 'seated' | 'nature' | 'self';

export interface Puzzle {
  id: number;
  name: string;
  chapter: string;
  hint: string;
  scanInstruction: string;
  scanType: ScanType;
  riddle: string;
  answer: string;
  solvedMessage: string;
}

export const PUZZLES: Puzzle[] = [
  {
    id: 1,
    name: "The Shadow Fragment",
    chapter: "Chapter 1 of 5",
    hint: "Seek where the light does not reach.",
    scanInstruction: "Point camera at a dark shadow or corner",
    scanType: 'dark',
    riddle: "The more you take, the more you leave behind. What am I?",
    answer: "steps",
    solvedMessage: "Fragment 1 secured. The darkness holds no more secrets."
  },
  {
    id: 2,
    name: "The Light Beacon",
    chapter: "Chapter 2 of 5",
    hint: "Find where the light enters your world.",
    scanInstruction: "Point camera at a window, lamp, or bright light source",
    scanType: 'bright',
    riddle: "I have cities but no houses, mountains but no trees, water but no fish. What am I?",
    answer: "map",
    solvedMessage: "Fragment 2 secured. The beacon is lit."
  },
  {
    id: 3,
    name: "The Resting Place",
    chapter: "Chapter 3 of 5",
    hint: "Find where the weary sit.",
    scanInstruction: "Point camera at a chair, sofa, or couch",
    scanType: 'seated',
    riddle: "I have four legs in the morning, two at noon, and three at night. What am I?",
    answer: "man",
    solvedMessage: "Fragment 3 secured. Rest while you can."
  },
  {
    id: 4,
    name: "The Living Cipher",
    chapter: "Chapter 4 of 5",
    hint: "Find what grows in silence.",
    scanInstruction: "Point camera at a plant, leaves, or greenery",
    scanType: 'nature',
    riddle: "What can you catch but never throw?",
    answer: "cold",
    solvedMessage: "Fragment 4 secured. Life finds a way."
  },
  {
    id: 5,
    name: "The Final Truth",
    chapter: "Chapter 5 of 5 — FINAL",
    hint: "The last clue has faced you all along.",
    scanInstruction: "Point at a person — face the mirror or find someone",
    scanType: 'self',
    riddle: "I have a face and two hands but no arms or legs. What am I?",
    answer: "clock",
    solvedMessage: "ALL FRAGMENTS SECURED. You have escaped the loop."
  }
];
