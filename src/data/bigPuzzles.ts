/**
 * Big Puzzles – Unified data loader
 *
 * Loads all pre-generated puzzles from the full matrix JSON.
 * Supports 4 themes × 3 grid sizes × 3 difficulties × 10 chapters = 360 puzzles.
 */

import { LevelData, Word } from '../game/types';
import puzzleMatrixData from './puzzle_matrix.json';

export type BigPuzzleDifficulty = 'Kolay' | 'Orta' | 'Zor';
export type BigPuzzleTheme = 'Genel' | 'Bilim' | 'Tarih' | 'Spor';

export interface BigPuzzleMeta {
    id: string;
    size: 15 | 17 | 20;
    difficulty: BigPuzzleDifficulty;
    theme: BigPuzzleTheme;
    title: string;
    createdAt: string;
    puzzleData: LevelData;
}

export interface BigPuzzleFilter {
    size: number;
    difficulty: string;
    theme: string;
}

// ── Difficulty mapping ──

const DIFF_EN_TO_TR: Record<string, BigPuzzleDifficulty> = {
    easy: 'Kolay', medium: 'Orta', hard: 'Zor',
};

const GRID_SIZE_MAP: Record<string, 15 | 17 | 20> = {
    '15x15': 15, '17x17': 17, '20x20': 20,
};

// ── Load & convert all matrix puzzles ──

function loadMatrixPuzzles(): BigPuzzleMeta[] {
    return (puzzleMatrixData as any[]).map((ch) => {
        const diff = DIFF_EN_TO_TR[ch.difficulty] ?? 'Orta';
        const size = GRID_SIZE_MAP[ch.grid_size] ?? 15;
        const theme = (ch.theme || 'Genel') as BigPuzzleTheme;

        const words: Word[] = ch.answers.map((a: any) => ({
            id: `${a.direction}_${a.number}`,
            direction: a.direction as 'across' | 'down',
            startRow: a.startRow,
            startCol: a.startCol,
            answer: a.answer,
            clue: a.clue,
            num: a.number,
        }));

        const idNum = (size * 1000) + ch.chapter
            + (ch.difficulty === 'medium' ? 100 : ch.difficulty === 'hard' ? 200 : 0);

        const puzzleData: LevelData = {
            id: idNum,
            gridSize: size,
            words,
            difficulty: diff,
            title: `${size}×${size} ${diff} ${theme} Bölüm ${ch.chapter}`,
        };

        return {
            id: `matrix_${theme.toLowerCase()}_${size}_${ch.difficulty}_${String(ch.chapter).padStart(2, '0')}`,
            size,
            difficulty: diff,
            theme,
            title: `Bölüm ${ch.chapter}`,
            createdAt: '2026-02-27',
            puzzleData,
        };
    });
}

let _matrixCache: BigPuzzleMeta[] | null = null;
function getMatrixPuzzles(): BigPuzzleMeta[] {
    if (!_matrixCache) _matrixCache = loadMatrixPuzzles();
    return _matrixCache;
}

// ── Public API ──

export function getBigPuzzle(filter: BigPuzzleFilter): BigPuzzleMeta | null {
    return getMatrixPuzzles().find(
        (p) => p.size === filter.size && p.difficulty === filter.difficulty && p.theme === filter.theme,
    ) ?? null;
}

export function getBigPuzzles(filter: Partial<BigPuzzleFilter>): BigPuzzleMeta[] {
    return getMatrixPuzzles().filter((p) => {
        if (filter.size != null && p.size !== filter.size) return false;
        if (filter.difficulty != null && p.difficulty !== filter.difficulty) return false;
        if (filter.theme != null && p.theme !== filter.theme) return false;
        return true;
    });
}
