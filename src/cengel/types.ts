// ── Bilgeç Core Types ──

// ── Cell Types (static puzzle definition) ──
export interface BlockCell {
    type: 'BLOCK';
}

export interface LetterCell {
    type: 'LETTER';
    solution: string; // Single uppercase Turkish letter
}

export interface ClueCell {
    type: 'CLUE';
    across?: { clue: string };
    down?: { clue: string };
}

export type Cell = BlockCell | LetterCell | ClueCell;

// ── Puzzle (static, embedded data) ──
export interface Puzzle {
    id: string;                        // e.g. "ch1_01"
    title: string;
    size: [number, number];            // [rows, cols]
    theme: string;
    difficulty: 'easy' | 'medium' | 'hard';
    grid: Cell[][];
}

// ── Entry (derived at runtime from puzzle grid) ──
export interface Entry {
    id: string;                        // e.g. "A1" or "D3"
    direction: 'across' | 'down';
    clueCell: { row: number; col: number };
    clueText: string;
    start: { row: number; col: number };
    cells: Array<{ row: number; col: number }>;
    length: number;
    solution: string;
}

// ── Runtime game cell ──
export interface GameCell {
    row: number;
    col: number;
    type: 'BLOCK' | 'LETTER' | 'CLUE';
    // LETTER cell fields
    solution?: string;
    userLetter?: string;
    isLocked?: boolean;
    isRevealed?: boolean;
    // CLUE cell fields
    clueAcross?: string;
    clueDown?: string;
}

// ── Game state ──
export interface CengelGameState {
    gameGrid: GameCell[][];
    entries: Entry[];
    selectedCell: { row: number; col: number } | null;
    activeEntryId: string | null;
    activeDirection: 'across' | 'down';
    timeElapsed: number;
    isComplete: boolean;
    lockedEntryIds: Set<string>;
    hintsUsed: number;
}

// ── Progress ──
export interface PuzzleProgress {
    puzzleId: string;
    completed: boolean;
    stars: number;    // 0-3 based on hint usage
    bestTime: number;
    hintsUsed: number;
}

// ── Chapter ──
export interface Chapter {
    id: string;
    title: string;
    subtitle?: string;
    puzzleIds: string[];
}
