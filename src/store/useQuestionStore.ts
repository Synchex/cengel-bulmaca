import { create } from 'zustand';
import {
    getAllQuestionsForUI,
    UIQuestion as Question,
    QuestionType,
    Difficulty,
} from '../utils/questionLoader';

interface Filters {
    level: number | null;
    difficulty: Difficulty | null;
    type: QuestionType | null;
    showNewOnly: boolean;
}

interface QuestionStore {
    questions: Question[];
    filters: Filters;

    // ── Filters ──
    setLevel: (level: number | null) => void;
    setDifficulty: (d: Difficulty | null) => void;
    setType: (t: QuestionType | null) => void;
    setShowNewOnly: (v: boolean) => void;
    clearFilters: () => void;

    // ── Selectors ──
    filteredQuestions: () => Question[];
    getByLevel: (level: number) => Question[];
    getByDifficulty: (d: Difficulty) => Question[];
    getByType: (t: QuestionType) => Question[];
    getRandomSet: (count: number) => Question[];

    // ── Selected question for detail ──
    selectedQuestion: Question | null;
    selectQuestion: (q: Question | null) => void;
}

export const useQuestionStore = create<QuestionStore>((set, get) => ({
    questions: getAllQuestionsForUI(),
    filters: { level: null, difficulty: null, type: null, showNewOnly: false },

    setLevel: (level) =>
        set((s) => ({ filters: { ...s.filters, level } })),
    setDifficulty: (difficulty) =>
        set((s) => ({ filters: { ...s.filters, difficulty } })),
    setType: (type) =>
        set((s) => ({ filters: { ...s.filters, type } })),
    setShowNewOnly: (showNewOnly) =>
        set((s) => ({ filters: { ...s.filters, showNewOnly } })),
    clearFilters: () =>
        set({ filters: { level: null, difficulty: null, type: null, showNewOnly: false } }),

    filteredQuestions: () => {
        const { questions, filters } = get();
        return questions.filter((q) => {
            if (filters.level !== null && q.level !== filters.level) return false;
            if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
            if (filters.type && q.type !== filters.type) return false;
            if (filters.showNewOnly && !q.tags?.includes('yeni-sorular-tdk')) return false;
            return true;
        });
    },

    getByLevel: (level) => get().questions.filter((q) => q.level === level),
    getByDifficulty: (d) => get().questions.filter((q) => q.difficulty === d),
    getByType: (t) => get().questions.filter((q) => q.type === t),

    getRandomSet: (count) => {
        const shuffled = [...get().questions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    selectedQuestion: null,
    selectQuestion: (q) => set({ selectedQuestion: q }),
}));
