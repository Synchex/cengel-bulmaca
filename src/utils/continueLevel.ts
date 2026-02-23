import { LevelProgress } from '../game/types';
import { IS_DEV, DEV_UNLOCK_ALL } from '../config/devConfig';

/**
 * Get the resume target puzzle ID from çengel puzzle progress.
 *
 * Algorithm:
 * A) First incomplete but unlocked puzzle (sequential unlock).
 * B) If all completed → last puzzle.
 * C) If no puzzles → null.
 */
export function getResumePuzzleId(
    allPuzzleIds: string[],
    puzzleProgress: Record<string, { completed: boolean; stars: number; bestTime: number }>,
): string | null {
    if (allPuzzleIds.length === 0) return null;

    for (let i = 0; i < allPuzzleIds.length; i++) {
        const id = allPuzzleIds[i];
        const p = puzzleProgress[id];
        const completed = p?.completed ?? false;

        // Unlock: first puzzle always unlocked, otherwise previous must be completed
        const unlocked = DEV_UNLOCK_ALL || i === 0 || (puzzleProgress[allPuzzleIds[i - 1]]?.completed ?? false);

        if (unlocked && !completed) {
            return id;
        }
    }

    // All completed → return last puzzle
    return allPuzzleIds[allPuzzleIds.length - 1];
}

/**
 * Get the 1-based level number for a puzzle ID within allPuzzleIds.
 */
export function getPuzzleLevelNumber(puzzleId: string, allPuzzleIds: string[]): number {
    const idx = allPuzzleIds.indexOf(puzzleId);
    return idx >= 0 ? idx + 1 : 1;
}

/**
 * Legacy: get continue level from old LevelProgress array.
 */
export function getContinueLevelId(progress: LevelProgress[]): number {
    if (progress.length === 0) return 1;

    const inProgress = progress
        .filter((p) => p.status === 'in_progress')
        .sort((a, b) => b.updatedAt - a.updatedAt);
    if (inProgress.length > 0) {
        return inProgress[0].levelId;
    }

    const nextLevel = progress.find((p) => p.unlocked && !p.completed);
    if (nextLevel) {
        return nextLevel.levelId;
    }

    return progress[progress.length - 1].levelId;
}

/**
 * DEV-only: log the continue decision.
 */
export function logContinueDecision(resumeId: string, levelNum: number): void {
    if (!IS_DEV) return;
    console.log('[Continue] ─────────────────────');
    console.log('[Continue] Resume puzzleId:', resumeId);
    console.log('[Continue] Level number:', levelNum);
    console.log('[Continue] ─────────────────────');
}
