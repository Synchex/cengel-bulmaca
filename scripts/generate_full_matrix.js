#!/usr/bin/env node
/**
 * Full Matrix Crossword Generator
 *
 * Generates puzzles for ALL combinations:
 *   4 themes × 3 grid sizes × 3 difficulties × N chapters
 *   = 360 puzzles (N=10)
 *
 * Theme-aware: themed words placed first, Genel fill words complete the grid.
 *
 * Output: src/data/puzzle_matrix.json
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════
const CHAPTERS_PER_COMBO = 10;
const MAX_ANSWER_LEN = 13;
const MAX_CLUE_WORDS = 16;

const DB_PATH = path.join(__dirname, '../src/data/questions_db.json');
const OUT_PATH = path.join(__dirname, '../src/data/puzzle_matrix.json');

const GRID_CONFIGS = {
    15: { minWords: 20, targetWords: 30, attempts: 20, pool: 120 },
    17: { minWords: 28, targetWords: 40, attempts: 25, pool: 160 },
    20: { minWords: 40, targetWords: 55, attempts: 30, pool: 200 },
};

const DIFF_CONFIGS = {
    easy: { minLen: 3, maxLen: 7, scoreBand: [20, 45], diffTR: 'Kolay' },
    medium: { minLen: 4, maxLen: 9, scoreBand: [40, 70], diffTR: 'Orta' },
    hard: { minLen: 5, maxLen: 13, scoreBand: [65, 95], diffTR: 'Zor' },
};

// Category → Theme mapping
const CATEGORY_TO_THEME = {
    // Bilim
    'Bilim': 'Bilim', 'Fizik': 'Bilim', 'Kimya': 'Bilim', 'Biyoloji': 'Bilim',
    'Teknoloji': 'Bilim', 'Uzay': 'Bilim', 'Geometri': 'Bilim', 'Sağlık': 'Bilim',
    'Akademi': 'Bilim', 'Teknik': 'Bilim', 'Doğa': 'Bilim', 'Madde': 'Bilim',
    // Tarih
    'Tarih': 'Tarih', 'Siyaset': 'Tarih', 'Askeri': 'Tarih', 'Millet': 'Tarih',
    'Halk': 'Tarih', 'Yönetim': 'Tarih', 'Hukuk': 'Tarih', 'Mitoloji': 'Tarih',
    // Spor
    'Spor': 'Spor', 'Oyun': 'Spor',
};

const THEMES = ['Genel', 'Bilim', 'Tarih', 'Spor'];
const GRID_SIZES = [15, 17, 20];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

// ═══════════════════════════════════════════════════
//  PRNG
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

        const theme = CATEGORY_TO_THEME[q.category] || 'Genel';
        seen.add(w);
        bank.push({ word: w, clue: q.clue, length: w.length, theme });
    }
    return bank;
}

/**
 * Build a themed word pool.
 * For non-Genel themes: themed words first, then Genel fill.
 * Filter by difficulty length range.
 */
function buildThemedPool(bank, theme, diff) {
    const { minLen, maxLen } = DIFF_CONFIGS[diff];
    const lenFilter = (e) => e.length >= minLen && e.length <= maxLen;

    if (theme === 'Genel') {
        return bank.filter(lenFilter);
    }

    // Themed words first, then Genel fill
    const themed = bank.filter(e => e.theme === theme && lenFilter(e));
    const general = bank.filter(e => e.theme === 'Genel' && lenFilter(e));
    return [...themed, ...general];
}

// ═══════════════════════════════════════════════════
//  GREEDY GRID BUILDER
// ═══════════════════════════════════════════════════
function canPlace(grid, word, r, c, dir, size) {
    const len = word.length;
    if (dir === 'across') {
        if (c < 0 || c + len > size || r < 0 || r >= size) return false;
    } else {
        if (r < 0 || r + len > size || c < 0 || c >= size) return false;
    }

    for (let i = 0; i < len; i++) {
        const cr = dir === 'across' ? r : r + i;
        const cc = dir === 'across' ? c + i : c;
        const existing = grid[cr][cc];

        if (existing !== null) {
            if (existing !== word[i]) return false;
        } else {
            if (dir === 'across') {
                if (cr > 0 && grid[cr - 1][cc] !== null) return false;
                if (cr < size - 1 && grid[cr + 1][cc] !== null) return false;
            } else {
                if (cc > 0 && grid[cr][cc - 1] !== null) return false;
                if (cc < size - 1 && grid[cr][cc + 1] !== null) return false;
            }
        }
    }

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
                placed.push({ word: entry.word, clue: entry.clue, row: mid, col: c, direction: 'across', theme: entry.theme });
                usedWords.add(entry.word);
            }
            continue;
        }

        const best = findBestPlacement(grid, entry.word, size);
        if (best && best.intersections > 0) {
            placeWord(grid, entry.word, best.r, best.c, best.dir);
            placed.push({ word: entry.word, clue: entry.clue, row: best.r, col: best.c, direction: best.dir, theme: entry.theme });
            usedWords.add(entry.word);
        }
    }

    return { grid, placed, usedWords };
}

// ═══════════════════════════════════════════════════
//  NUMBERING & LAYOUT
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
            number: num,
            direction: p.direction,
            answer: p.word,
            clue: p.clue,
            startRow: p.row,
            startCol: p.col,
            difficulty_score: Math.round(p.word.length * 8 + p.clue.split(/\s+/).length * 2),
        });
    }
    return words;
}

function gridToLayout(grid) {
    return grid.map(row => row.map(cell => cell !== null ? 1 : 0));
}

// ═══════════════════════════════════════════════════
//  VALIDATION
// ═══════════════════════════════════════════════════
function validatePuzzle(answers, minWords) {
    const errors = [];
    if (answers.length < minWords) errors.push(`Too few: ${answers.length} < ${minWords}`);
    const ansSet = answers.map(a => a.answer);
    if (new Set(ansSet).size !== ansSet.length) errors.push('Duplicates');
    for (const a of answers) {
        if (a.answer.length >= 4 && a.clue.toUpperCase().includes(a.answer)) errors.push(`Leak: ${a.answer}`);
        if (a.clue.trim().split(/\s+/).length > MAX_CLUE_WORDS) errors.push(`Long clue: ${a.answer}`);
    }
    return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════
//  GENERATE ONE COMBO
// ═══════════════════════════════════════════════════
function generateCombo(theme, gridSize, diff, bank, startSeed) {
    const gc = GRID_CONFIGS[gridSize];
    const dc = DIFF_CONFIGS[diff];
    const pool = buildThemedPool(bank, theme, diff);
    const chapters = [];
    let seed = startSeed;
    let failures = 0;
    const maxFailures = CHAPTERS_PER_COMBO * 300;

    while (chapters.length < CHAPTERS_PER_COMBO) {
        seed++;
        if (failures > maxFailures) break;

        let bestPlaced = [];
        let bestGrid = null;

        for (let attempt = 0; attempt < gc.attempts; attempt++) {
            const rng = mulberry32(seed * 100 + attempt);
            const shuffled = seededShuffle(pool, rng).slice(0, gc.pool);
            const result = buildSinglePuzzle(shuffled, gridSize);

            if (result.placed.length > bestPlaced.length) {
                bestPlaced = result.placed;
                bestGrid = result.grid;
            }
        }

        if (bestPlaced.length < gc.minWords) {
            failures++;
            continue;
        }

        const answers = numberWords(bestPlaced);
        const validation = validatePuzzle(answers, gc.minWords);

        if (!validation.valid) {
            failures++;
            continue;
        }

        const chapterNum = chapters.length + 1;
        const layout = bestGrid ? gridToLayout(bestGrid) : [];

        chapters.push({
            theme,
            grid_size: `${gridSize}x${gridSize}`,
            difficulty: diff,
            chapter: chapterNum,
            layout,
            answers,
            metadata: {
                total_words: answers.length,
                average_answer_length: Math.round(answers.reduce((s, a) => s + a.answer.length, 0) / answers.length * 10) / 10,
                difficulty_score: Math.round(answers.reduce((s, a) => s + a.difficulty_score, 0) / answers.length),
            },
        });
    }

    return { chapters, failures };
}

// ═══════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════
function main() {
    console.log('═══════════════════════════════════════════════');
    console.log(' Full Matrix Crossword Generator');
    console.log(' 4 themes × 3 sizes × 3 difficulties × 10 ch');
    console.log('═══════════════════════════════════════════════');

    const bank = loadWordBank();
    console.log(`Word bank: ${bank.length} entries`);

    // Show themed pool sizes
    for (const theme of THEMES) {
        const count = bank.filter(e => e.theme === theme).length;
        console.log(`  ${theme}: ${count} words`);
    }

    const t0 = Date.now();
    const allPuzzles = [];
    let seedOffset = 100000;

    for (const theme of THEMES) {
        for (const gridSize of GRID_SIZES) {
            for (const diff of DIFFICULTIES) {
                const tag = `${theme} ${gridSize}x${gridSize} ${diff}`;
                process.stdout.write(`  ${tag}... `);

                const { chapters, failures } = generateCombo(theme, gridSize, diff, bank, seedOffset);
                seedOffset += 1000;

                console.log(`${chapters.length}/${CHAPTERS_PER_COMBO} (${failures} retries)`);
                allPuzzles.push(...chapters);
            }
        }
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    // ── Report ──
    console.log('\n═══════════════════════════════════════════════');
    console.log(' REPORT');
    console.log('═══════════════════════════════════════════════');

    const totalAnswers = allPuzzles.reduce((s, p) => s + p.answers.length, 0);
    const uniqueAnswers = new Set(allPuzzles.flatMap(p => p.answers.map(a => a.answer)));
    let leaks = 0;
    for (const p of allPuzzles) {
        for (const a of p.answers) {
            if (a.answer.length >= 4 && a.clue.toUpperCase().includes(a.answer)) leaks++;
        }
    }

    for (const theme of THEMES) {
        const tp = allPuzzles.filter(p => p.theme === theme);
        const avgW = tp.length > 0 ? Math.round(tp.reduce((s, p) => s + p.metadata.total_words, 0) / tp.length) : 0;
        console.log(`  ${theme}: ${tp.length} puzzles, avg ${avgW} words`);
    }

    console.log(`\n  Total: ${allPuzzles.length} puzzles`);
    console.log(`  Total answers: ${totalAnswers}`);
    console.log(`  Unique answers: ${uniqueAnswers.size}`);
    console.log(`  Answer leaks: ${leaks}`);
    console.log(`  Time: ${elapsed}s`);

    fs.writeFileSync(OUT_PATH, JSON.stringify(allPuzzles, null, 2), 'utf8');
    const mb = (fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(2);
    console.log(`  Output: ${OUT_PATH} (${mb} MB)`);
}

main();
