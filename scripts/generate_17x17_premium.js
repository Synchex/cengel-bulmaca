#!/usr/bin/env node
/**
 * 17×17 Premium Crossword Chapter Generator
 *
 * Generates 60 premium 17×17 crossword puzzles organized into chapters:
 *   - 20 EASY chapters
 *   - 20 MEDIUM chapters
 *   - 20 HARD chapters
 *
 * Uses greedy word placement with intersection maximization.
 * Feeds from the cleaned 8K+ question database.
 *
 * Output: src/data/premium_17x17.json
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════
const CHAPTERS_PER_TIER = 20;
const GRID_SIZE = 17;
const MIN_WORDS = 28;
const TARGET_WORDS = 45;
const MAX_ANSWER_LEN = 13;
const MAX_CLUE_WORDS = 16;
const ATTEMPTS_PER_PUZZLE = 25;
const CANDIDATE_POOL = 160;

const DB_PATH = path.join(__dirname, '../src/data/questions_db.json');
const OUT_PATH = path.join(__dirname, '../src/data/premium_17x17.json');

const TIERS = {
    easy: { label: 'easy', minLen: 3, maxLen: 7, scoreBand: [20, 45], diffTR: 'Kolay' },
    medium: { label: 'medium', minLen: 4, maxLen: 9, scoreBand: [40, 70], diffTR: 'Orta' },
    hard: { label: 'hard', minLen: 5, maxLen: 13, scoreBand: [65, 95], diffTR: 'Zor' },
};

// ═══════════════════════════════════════════════════
//  SEEDED PRNG (mulberry32)
// ═══════════════════════════════════════════════════
function mulberry32(seed) {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function seededShuffle(arr, rng) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ═══════════════════════════════════════════════════
//  WORD BANK
// ═══════════════════════════════════════════════════
function loadWordBank() {
    const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const seen = new Set();
    const bank = [];
    const blacklist = [/şifreli ipucu/i, /osmanlıca/i, /eski türkçe kökenli/i, /edebi bir sözcük/i];

    for (const q of raw) {
        if (!q.answer || !q.clue) continue;
        const w = q.answer.toUpperCase().trim();
        if (w.length < 3 || w.length > MAX_ANSWER_LEN) continue;
        if (/[\s\-'.]/.test(w)) continue;
        if (seen.has(w)) continue;
        if (q.clue.length < 5) continue;
        if (blacklist.some(re => re.test(q.clue))) continue;
        if (w.length >= 4 && q.clue.toUpperCase().includes(w)) continue;

        seen.add(w);
        bank.push({ word: w, clue: q.clue, length: w.length });
    }
    return bank;
}

function buildPool(bank, tier) {
    const { minLen, maxLen } = TIERS[tier];
    return bank.filter(e => e.length >= minLen && e.length <= maxLen);
}

// ═══════════════════════════════════════════════════
//  GREEDY GRID BUILDER (17×17)
// ═══════════════════════════════════════════════════
function canPlace(grid, word, r, c, dir, size) {
    const len = word.length;
    if (dir === 'across') {
        if (c < 0 || c + len > size || r < 0 || r >= size) return false;
    } else {
        if (r < 0 || r + len > size || c < 0 || c >= size) return false;
    }

    let hasIntersection = false;

    for (let i = 0; i < len; i++) {
        const cr = dir === 'across' ? r : r + i;
        const cc = dir === 'across' ? c + i : c;
        const existing = grid[cr][cc];

        if (existing !== null) {
            if (existing !== word[i]) return false;
            hasIntersection = true;
        } else {
            // Check perpendicular adjacency (no unintended touching)
            if (dir === 'across') {
                if (cr > 0 && grid[cr - 1][cc] !== null) return false;
                if (cr < size - 1 && grid[cr + 1][cc] !== null) return false;
            } else {
                if (cc > 0 && grid[cr][cc - 1] !== null) return false;
                if (cc < size - 1 && grid[cr][cc + 1] !== null) return false;
            }
        }
    }

    // Check before/after the word
    if (dir === 'across') {
        if (c > 0 && grid[r][c - 1] !== null) return false;
        if (c + len < size && grid[r][c + len] !== null) return false;
    } else {
        if (r > 0 && grid[r - 1][c] !== null) return false;
        if (r + len < size && grid[r + len][c] !== null) return false;
    }

    return true;
}

function findBestPlacement(grid, word, size) {
    const candidates = [];
    const center = Math.floor(size / 2);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            for (const dir of ['across', 'down']) {
                if (canPlace(grid, word, r, c, dir, size)) {
                    let inters = 0;
                    for (let i = 0; i < word.length; i++) {
                        const cr = dir === 'across' ? r : r + i;
                        const cc = dir === 'across' ? c + i : c;
                        if (grid[cr][cc] !== null) inters++;
                    }
                    candidates.push({ r, c, dir, intersections: inters });
                }
            }
        }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
        if (b.intersections !== a.intersections) return b.intersections - a.intersections;
        const aDist = Math.abs(a.r - center) + Math.abs(a.c - center);
        const bDist = Math.abs(b.r - center) + Math.abs(b.c - center);
        return aDist - bDist;
    });

    return candidates[0];
}

function placeWord(grid, word, r, c, dir) {
    for (let i = 0; i < word.length; i++) {
        const cr = dir === 'across' ? r : r + i;
        const cc = dir === 'across' ? c + i : c;
        grid[cr][cc] = word[i];
    }
}

function buildSinglePuzzle(words, size) {
    const grid = Array.from({ length: size }, () => Array(size).fill(null));
    const placed = [];
    const usedWords = new Set();

    for (const entry of words) {
        if (usedWords.has(entry.word)) continue;

        if (placed.length === 0) {
            const mid = Math.floor(size / 2);
            const c = Math.floor((size - entry.word.length) / 2);
            if (c >= 0 && c + entry.word.length <= size) {
                placeWord(grid, entry.word, mid, c, 'across');
                placed.push({ word: entry.word, clue: entry.clue, row: mid, col: c, direction: 'across' });
                usedWords.add(entry.word);
            }
            continue;
        }

        const best = findBestPlacement(grid, entry.word, size);
        if (best && best.intersections > 0) {
            placeWord(grid, entry.word, best.r, best.c, best.dir);
            placed.push({ word: entry.word, clue: entry.clue, row: best.r, col: best.c, direction: best.dir });
            usedWords.add(entry.word);
        }
    }

    return { grid, placed, usedWords };
}

// ═══════════════════════════════════════════════════
//  NUMBERING
// ═══════════════════════════════════════════════════
function numberWords(placed) {
    const sorted = [...placed].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });

    const startPositions = new Map();
    let nextNum = 1;
    const words = [];

    for (const p of sorted) {
        const key = `${p.row},${p.col}`;
        if (!startPositions.has(key)) startPositions.set(key, nextNum++);
        const num = startPositions.get(key);
        words.push({
            id: `${p.direction}_${num}`,
            direction: p.direction,
            startRow: p.row,
            startCol: p.col,
            answer: p.word,
            clue: p.clue,
            num,
        });
    }
    return words;
}

// ═══════════════════════════════════════════════════
//  GRID → LAYOUT MATRIX
// ═══════════════════════════════════════════════════
function gridToLayout(grid) {
    return grid.map(row => row.map(cell => cell !== null ? 1 : 0));
}

// ═══════════════════════════════════════════════════
//  DIFFICULTY EVALUATOR
// ═══════════════════════════════════════════════════
function evaluateDifficulty(words) {
    if (words.length === 0) return { score: 0, avgLen: 0, crossDensity: 0, totalWords: 0 };

    const avgLen = words.reduce((s, w) => s + w.answer.length, 0) / words.length;
    const cellMap = new Map();
    for (const w of words) {
        for (let i = 0; i < w.answer.length; i++) {
            const r = w.direction === 'across' ? w.startRow : w.startRow + i;
            const c = w.direction === 'across' ? w.startCol + i : w.startCol;
            cellMap.set(`${r},${c}`, (cellMap.get(`${r},${c}`) || 0) + 1);
        }
    }
    const crossings = [...cellMap.values()].filter(v => v > 1).length;
    const crossDensity = cellMap.size > 0 ? crossings / cellMap.size : 0;
    const score = (avgLen * 6) + (crossDensity * 25) + (words.length * 0.3);

    return {
        score: Math.round(score),
        avgLen: Math.round(avgLen * 10) / 10,
        crossDensity: Math.round(crossDensity * 100) / 100,
        totalWords: words.length,
    };
}

// ═══════════════════════════════════════════════════
//  PUZZLE VALIDATOR
// ═══════════════════════════════════════════════════
function validatePuzzle(words) {
    const errors = [];
    if (words.length < MIN_WORDS) errors.push(`Too few: ${words.length} < ${MIN_WORDS}`);
    const answers = words.map(w => w.answer);
    if (new Set(answers).size !== answers.length) errors.push('Duplicates inside puzzle');
    for (const w of words) {
        if (w.answer.length >= 4 && w.clue.toUpperCase().includes(w.answer)) errors.push(`Leak: ${w.answer}`);
        if (w.clue.trim().split(/\s+/).length > MAX_CLUE_WORDS) errors.push(`Long clue: ${w.answer}`);
        if (w.answer.length > MAX_ANSWER_LEN) errors.push(`Too long: ${w.answer}`);
    }
    return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════
//  EXPORT CHAPTER
// ═══════════════════════════════════════════════════
function exportChapter(tier, chapterNum, words, layout, evaluation) {
    const tierCfg = TIERS[tier];
    return {
        tier: tierCfg.label,
        chapter: chapterNum,
        grid_size: '17x17',
        difficulty_band: `${tierCfg.scoreBand[0]}-${tierCfg.scoreBand[1]}`,
        layout,
        answers: words.map(w => ({
            number: w.num,
            direction: w.direction,
            answer: w.answer,
            clue: w.clue,
            startRow: w.startRow,
            startCol: w.startCol,
            difficulty_score: Math.round(w.answer.length * 8 + w.clue.split(/\s+/).length * 2),
        })),
        metadata: {
            average_answer_length: evaluation.avgLen,
            cross_density: evaluation.crossDensity,
            total_words: evaluation.totalWords,
            difficulty_score: evaluation.score,
        },
    };
}

// ═══════════════════════════════════════════════════
//  GENERATE CHAPTERS FOR TIER
// ═══════════════════════════════════════════════════
function generateChapters(tier, bank, startSeed, globalUsed) {
    const tierCfg = TIERS[tier];
    const pool = buildPool(bank, tier);
    const chapters = [];
    let seed = startSeed;
    let failures = 0;

    console.log(`\n── ${tier.toUpperCase()} (${CHAPTERS_PER_TIER} chapters) ──`);
    console.log(`  Pool: ${pool.length} words (len ${tierCfg.minLen}-${tierCfg.maxLen})`);

    while (chapters.length < CHAPTERS_PER_TIER) {
        seed++;
        if (failures > CHAPTERS_PER_TIER * 200) {
            console.log(`  ⚠ Stopping after ${failures} failures`);
            break;
        }

        let bestPlaced = [];
        let bestGrid = null;
        let bestUsed = new Set();

        for (let attempt = 0; attempt < ATTEMPTS_PER_PUZZLE; attempt++) {
            const rng = mulberry32(seed * 100 + attempt);
            const shuffled = seededShuffle(pool, rng).slice(0, CANDIDATE_POOL);
            const result = buildSinglePuzzle(shuffled, GRID_SIZE);

            if (result.placed.length > bestPlaced.length) {
                bestPlaced = result.placed;
                bestGrid = result.grid;
                bestUsed = result.usedWords;
            }
        }

        if (bestPlaced.length < MIN_WORDS) {
            failures++;
            continue;
        }

        const words = numberWords(bestPlaced);
        const validation = validatePuzzle(words);

        if (!validation.valid) {
            failures++;
            continue;
        }

        const chapterNum = chapters.length + 1;
        for (const w of bestUsed) globalUsed.add(w);

        const evaluation = evaluateDifficulty(words);
        const layout = bestGrid ? gridToLayout(bestGrid) : [];
        const chapter = exportChapter(tier, chapterNum, words, layout, evaluation);

        chapters.push(chapter);

        if (chapters.length % 5 === 0) {
            process.stdout.write(`  ✓ ${chapters.length}/${CHAPTERS_PER_TIER}\n`);
        }
    }

    console.log(`  Done: ${chapters.length} chapters (${failures} retries)`);
    return chapters;
}

// ═══════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════
function main() {
    console.log('═══════════════════════════════════════');
    console.log(' 17×17 Premium Crossword Generator');
    console.log('═══════════════════════════════════════');
    console.log(`Target: ${CHAPTERS_PER_TIER * 3} chapters (${CHAPTERS_PER_TIER}/tier)`);
    console.log(`Grid: ${GRID_SIZE}×${GRID_SIZE}, min ${MIN_WORDS} words/puzzle`);

    const bank = loadWordBank();
    console.log(`Word bank: ${bank.length} entries`);

    const t0 = Date.now();
    const globalUsed = new Set();

    const easy = generateChapters('easy', bank, 50000, globalUsed);
    const medium = generateChapters('medium', bank, 60000, globalUsed);
    const hard = generateChapters('hard', bank, 70000, globalUsed);

    const all = [...easy, ...medium, ...hard];
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    // ── Report ──
    console.log('\n═══════════════════════════════════════');
    console.log(' REPORT');
    console.log('═══════════════════════════════════════');

    const allAnswers = all.flatMap(p => p.answers.map(a => a.answer));
    const uniqueAnswers = new Set(allAnswers);
    let leaks = 0;
    for (const p of all) {
        for (const a of p.answers) {
            if (a.answer.length >= 4 && a.clue.toUpperCase().includes(a.answer)) leaks++;
        }
    }

    for (const tier of ['easy', 'medium', 'hard']) {
        const tp = all.filter(p => p.tier === tier);
        if (tp.length === 0) { console.log(`  ${tier.toUpperCase()}: 0`); continue; }
        const avgW = Math.round(tp.reduce((s, p) => s + p.metadata.total_words, 0) / tp.length);
        const avgL = Math.round(tp.reduce((s, p) => s + p.metadata.average_answer_length, 0) / tp.length * 10) / 10;
        const avgS = Math.round(tp.reduce((s, p) => s + p.metadata.difficulty_score, 0) / tp.length);
        const minW = Math.min(...tp.map(p => p.metadata.total_words));
        const maxW = Math.max(...tp.map(p => p.metadata.total_words));
        console.log(`  ${tier.toUpperCase()}: ${tp.length} ch | words ${minW}-${maxW} (avg ${avgW}) | avg len ${avgL} | score ${avgS}`);
    }

    console.log(`\n  Total: ${all.length} chapters`);
    console.log(`  Total answers placed: ${allAnswers.length}`);
    console.log(`  Unique answers: ${uniqueAnswers.size}`);
    console.log(`  Answer leaks: ${leaks}`);
    console.log(`  Time: ${elapsed}s`);

    fs.writeFileSync(OUT_PATH, JSON.stringify(all, null, 2), 'utf8');
    const mb = (fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(2);
    console.log(`  Output: ${OUT_PATH} (${mb} MB)`);
}

main();
