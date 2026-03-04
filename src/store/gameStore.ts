import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LevelProgress } from '../game/types';
import { levels } from '../levels/levels';

const STORAGE_KEY = '@crossword_progress';

interface ProgressStore {
  progress: LevelProgress[];
  loaded: boolean;
  loadProgress: () => Promise<void>;
  saveProgress: () => Promise<void>;
  markInProgress: (levelId: number) => void;
  completeLevel: (
    levelId: number,
    stars: number,
    time: number,
    mistakes?: number,
    hintsUsed?: number
  ) => void;
}

const defaultProgress = (count: number): LevelProgress[] =>
  Array.from({ length: count }, (_, i) => ({
    levelId: i + 1,
    unlocked: i === 0,
    completed: false,
    status: 'not_started' as const,
    updatedAt: 0,
    stars: 0,
    bestTime: 0,
    bestMistakes: 999,
    bestHintsUsed: 999,
  }));

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: defaultProgress(levels.length),
  loaded: false,

  loadProgress: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        const migrated = (data.progress ?? defaultProgress(6)).map(
          (p: any) => ({
            ...p,
            bestMistakes: p.bestMistakes ?? 999,
            bestHintsUsed: p.bestHintsUsed ?? 999,
            status: p.status ?? (p.completed ? 'completed' : 'not_started'),
            updatedAt: p.updatedAt ?? 0,
          })
        );
        const totalLevels = levels.length;
        if (migrated.length < totalLevels) {
          for (let i = migrated.length; i < totalLevels; i++) {
            migrated.push({
              levelId: i + 1,
              unlocked: false,
              completed: false,
              status: 'not_started',
              updatedAt: 0,
              stars: 0,
              bestTime: 0,
              bestMistakes: 999,
              bestHintsUsed: 999,
            });
          }
        }
        // Recalculate unlock state from actual completions.
        // Level 1 is always unlocked. Each subsequent level unlocks
        // only if the previous level is completed.
        const corrected = migrated.map((p: LevelProgress, i: number) => ({
          ...p,
          unlocked: i === 0 || (migrated[i - 1]?.completed ?? false),
        }));
        set({ progress: corrected, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  saveProgress: async () => {
    try {
      const { progress } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ progress }));
    } catch {
      // silent
    }
  },

  markInProgress: (levelId) => {
    set((state) => {
      const progress = state.progress.map((p) => {
        if (p.levelId === levelId && p.status !== 'completed') {
          return { ...p, status: 'in_progress' as const, updatedAt: Date.now() };
        }
        return p;
      });
      setTimeout(() => get().saveProgress(), 0);
      return { progress };
    });
  },

  completeLevel: (levelId, stars, time, mistakes = 0, hintsUsed = 0) => {
    set((state) => {
      const progress = state.progress.map((p) => {
        if (p.levelId === levelId) {
          return {
            ...p,
            completed: true,
            status: 'completed' as const,
            updatedAt: Date.now(),
            stars: Math.max(p.stars, stars),
            bestTime: p.bestTime === 0 ? time : Math.min(p.bestTime, time),
            bestMistakes: Math.min(p.bestMistakes, mistakes),
            bestHintsUsed: Math.min(p.bestHintsUsed, hintsUsed),
          };
        }
        if (p.levelId === levelId + 1) {
          return { ...p, unlocked: true };
        }
        return p;
      });
      setTimeout(() => get().saveProgress(), 0);
      return { progress };
    });
  },
}));
