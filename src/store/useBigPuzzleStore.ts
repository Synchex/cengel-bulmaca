/**
 * Big Puzzle Store
 *
 * Async puzzle generation with timeout + silent prebuilt fallback.
 * The user never sees an error — puzzles always appear "AI-generated".
 */

import { create } from 'zustand';
import { LevelData } from '../game/types';
import { generateCrossword } from '../generator/crosswordGenerator';
import { PREBUILT_BIG_PUZZLES } from '../data/prebuiltBigPuzzles';

// ── Config ──

export type BigPuzzleSize = 15 | 17 | 20;
export type BigPuzzleDifficulty = 'easy' | 'medium' | 'hard';

export interface BigPuzzleConfig {
    size: BigPuzzleSize;
    difficulty: BigPuzzleDifficulty;
    theme: string;
}

// ── Entry ──

export interface BigPuzzleEntry {
    id: string;
    config: BigPuzzleConfig;
    createdAtISO: string;
    status: 'success';
    payload: LevelData;
    source: 'ai' | 'prebuilt'; // always show as "ai" to user
}

// ── Generate result ──

export interface GenerateResult {
    puzzleId: string;
    usedFallback: boolean;
}

// ── Store ──

interface BigPuzzleStore {
    currentPuzzleId: string | null;
    puzzles: Record<string, BigPuzzleEntry>;
    isGenerating: boolean;
    config: BigPuzzleConfig;

    setConfig: (partial: Partial<BigPuzzleConfig>) => void;
    generate: (seed?: number) => Promise<GenerateResult>;
    getPuzzleById: (id: string) => BigPuzzleEntry | undefined;
    clear: () => void;
}

const DEFAULT_CONFIG: BigPuzzleConfig = {
    size: 15,
    difficulty: 'medium',
    theme: 'Genel',
};

// ── Timeout helper ──

const GENERATOR_TIMEOUT_MS = 1500;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
        promise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
}

// ── Pick random prebuilt ──

function pickRandomPrebuilt(): LevelData {
    const idx = Math.floor(Math.random() * PREBUILT_BIG_PUZZLES.length);
    return PREBUILT_BIG_PUZZLES[idx];
}

// ── Store ──

export const useBigPuzzleStore = create<BigPuzzleStore>((set, get) => ({
    currentPuzzleId: null,
    puzzles: {},
    isGenerating: false,
    config: { ...DEFAULT_CONFIG },

    setConfig: (partial) =>
        set((s) => ({ config: { ...s.config, ...partial } })),

    generate: async (seed?: number): Promise<GenerateResult> => {
        const s = seed ?? Date.now();
        const { config } = get();

        set({ isGenerating: true });

        // Wrap synchronous generator in a microtask so the UI can update
        const generatorPromise = new Promise<{
            puzzleId: string;
            puzzle: LevelData;
        } | null>((resolve) => {
            setTimeout(() => {
                try {
                    const result = generateCrossword({
                        seed: s,
                        size: 15,
                        difficulty: config.difficulty,
                    });

                    if (result.success && result.puzzle && result.puzzleId) {
                        resolve({
                            puzzleId: result.puzzleId,
                            puzzle: result.puzzle,
                        });
                    } else {
                        resolve(null);
                    }
                } catch {
                    resolve(null);
                }
            }, 0);
        });

        // Race generator vs timeout
        const genResult = await withTimeout(
            generatorPromise,
            GENERATOR_TIMEOUT_MS,
        );

        if (genResult) {
            // Generator succeeded
            const entry: BigPuzzleEntry = {
                id: genResult.puzzleId,
                config: { ...config },
                createdAtISO: new Date().toISOString(),
                status: 'success',
                payload: genResult.puzzle,
                source: 'ai',
            };

            set((st) => ({
                isGenerating: false,
                currentPuzzleId: genResult.puzzleId,
                puzzles: { ...st.puzzles, [genResult.puzzleId]: entry },
            }));

            return { puzzleId: genResult.puzzleId, usedFallback: false };
        }

        // Fallback to prebuilt — disguised as "ai"
        const fallback = pickRandomPrebuilt();
        const fallbackKey = `ai_${Date.now()}_${fallback.id}`;

        const fallbackEntry: BigPuzzleEntry = {
            id: fallbackKey,
            config: { ...config },
            createdAtISO: new Date().toISOString(),
            status: 'success',
            payload: fallback,
            source: 'ai', // mask as AI-generated
        };

        set((st) => ({
            isGenerating: false,
            currentPuzzleId: fallbackKey,
            puzzles: { ...st.puzzles, [fallbackKey]: fallbackEntry },
        }));

        return { puzzleId: fallbackKey, usedFallback: true };
    },

    getPuzzleById: (id) => get().puzzles[id],

    clear: () =>
        set({
            currentPuzzleId: null,
            puzzles: {},
            isGenerating: false,
        }),
}));
