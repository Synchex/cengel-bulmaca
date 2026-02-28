import questionsData from '../data/questions_db.json';
import { questions as oldQuestions } from '../data/questions';

export interface Question {
    id: string;
    type: string;
    difficulty: 'easy' | 'medium' | 'hard';
    level: number;
    answer: string;
    answerLength: number;
    category: string;
    clue: string;
    tags: string[];
    createdAt: string;
}

const questions = questionsData as Question[];
console.log('Loaded questions from JSON:', questions.length);

/**
 * Get random questions for a specific difficulty.
 * Used to construct levels dynamically.
 */
export function getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard', count: number): Question[] {
    const filtered = questions.filter(q => q.difficulty === difficulty);
    // Shuffle array (Fisher-Yates)
    for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    return filtered.slice(0, count);
}

/**
 * Get questions specifically tagged for a certain level if available,
 * otherwise fallback to difficulty based.
 */
export function getQuestionsForLevel(levelId: number, count: number = 8): Question[] {
    // 1. Try to find questions with exact level match
    let levelQuestions = questions.filter(q => q.level === levelId);

    // 2. If not enough, fill with difficulty appropriate questions
    if (levelQuestions.length < count) {
        let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
        if (levelId > 10) difficulty = 'medium';
        if (levelId > 20) difficulty = 'hard';

        const extras = getQuestionsByDifficulty(difficulty, count - levelQuestions.length);
        levelQuestions = [...levelQuestions, ...extras];
    }

    // Shuffle
    for (let i = levelQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [levelQuestions[i], levelQuestions[j]] = [levelQuestions[j], levelQuestions[i]];
    }

    return levelQuestions.slice(0, count);
}

// ── Practice Mode ──

/**
 * Get a random question for practice mode.
 * Only returns answers between 3-7 characters.
 * Excludes any IDs already used in the current session.
 */
export function getRandomPracticeQuestion(excludeIds: Set<string>): Question | null {
    const eligible = questions.filter(
        (q) => q.answer.length >= 3 && q.answer.length <= 7 && !excludeIds.has(q.id)
    );
    if (eligible.length === 0) return null;
    const idx = Math.floor(Math.random() * eligible.length);
    return eligible[idx];
}

// ── UI Adapter ──

export type QuestionType = 'crossword' | 'multipleChoice' | 'wordFill';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface UIQuestion {
    id: string;
    type: QuestionType;
    difficulty: Difficulty;
    level: number;
    prompt: string;
    options?: string[];
    correctAnswer: string;
    createdAt: string;
    tags?: string[];
}



// ... (existing imports)

// ...

/**
 * Returns all questions formatted for the UI (Questions Tab).
 * Adapts strict crossword data to the generic UI format.
 */
export function getAllQuestionsForUI(): UIQuestion[] {
    const newQuestions: UIQuestion[] = questions.map(q => ({
        id: q.id,
        type: 'crossword',
        difficulty: q.difficulty,
        level: q.level,
        prompt: `${q.clue} (${q.answerLength} harf)`,
        correctAnswer: q.answer,
        createdAt: q.createdAt,
        tags: q.tags,
    }));

    const oldConverted: UIQuestion[] = oldQuestions.map(q => ({
        id: q.id,
        type: q.type as QuestionType,
        difficulty: q.difficulty as Difficulty,
        level: q.level,
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        createdAt: q.createdAt,
        tags: (q as any).tags,
    }));

    return [...newQuestions, ...oldConverted];
}
