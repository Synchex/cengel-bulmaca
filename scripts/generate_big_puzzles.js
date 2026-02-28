#!/usr/bin/env node
/**
 * 15×15 Crossword Batch Generator v3
 *
 * Uses greedy word placement (like existing gridGenerator.ts) instead of
 * pattern-based backtracking. Places words one by one, maximizing intersections.
 *
 * This mirrors the proven approach in src/utils/gridGenerator.ts that
 * already works for the app's existing puzzles.
 *
 * Output: src/data/big_puzzles_generated.json
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════
const PUZZLE_COUNT_PER_TIER = 50;
const GRID_SIZE = 15;
const MIN_WORDS_PER_PUZZLE = 20;
const TARGET_WORDS_PER_PUZZLE = 30;
const MAX_CLUE_WORDS = 16;
const ATTEMPTS_PER_PUZZLE = 15;  // generate N, keep densest
const CANDIDATE_WORDS = 100;     // words to attempt per puzzle

const DB_PATH = path.join(__dirname, '../src/data/questions_db.json');
const OUT_PATH = path.join(__dirname, '../src/data/big_puzzles_generated.json');

const TIERS = {
    easy: { label: 'easy', minLen: 3, maxLen: 7, scoreBand: [20, 45], diffTR: 'Kolay' },
    medium: { label: 'medium', minLen: 4, maxLen: 9, scoreBand: [40, 70], diffTR: 'Orta' },
    hard: { label: 'hard', minLen: 5, maxLen: 12, scoreBand: [65, 90], diffTR: 'Zor' },
};

// ═══════════════════════════════════════════════════
//  SEEDED PRNG
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
        if (w.length < 3 || w.length > 12) continue;
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
//  GREEDY GRID BUILDER
//  Places words one by one, maximizing intersections.
//  Same strategy as src/utils/gridGenerator.ts
// ═══════════════════════════════════════════════════
function canPlace(grid, word, r, c, dir, size) {
    const len = word.length;
    // Check bounds
    if (dir === 'across') {
        if (c < 0 || c + len > size || r < 0 || r >= size) return false;
    } else {
        if (r < 0 || r + len > size || c < 0 || c >= size) return false;
    }

    let intersections = 0;
    let hasIntersection = false;

    for (let i = 0; i < len; i++) {
        const cr = dir === 'across' ? r : r + i;
        const cc = dir === 'across' ? c + i : c;

        const existing = grid[cr][cc];
        if (existing !== null) {
            if (existing !== word[i]) return false; // conflict
            intersections++;
            hasIntersection = true;
        } else {
            // Check adjacent cells perpendicular to direction
            if (dir === 'across') {
                // Check above and below for non-intersection cells
                if (cr > 0 && grid[cr - 1][cc] !== null) {
                    // There's a letter above — this cell must be an intersection
                    // But it's empty, so this would create an unintended adjacency
                    // Only allow if this is creating a valid cross
                    return false;
                }
                if (cr < size - 1 && grid[cr + 1][cc] !== null) {
                    return false;
                }
            } else {
                if (cc > 0 && grid[cr][cc - 1] !== null) {
                    return false;
                }
                if (cc < size - 1 && grid[cr][cc + 1] !== null) {
                    return false;
                }
            }
        }
    }

    // Check cell before start (must be empty or out of bounds)
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

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            for (const dir of ['across', 'down']) {
                if (canPlace(grid, word, r, c, dir, size)) {
                    // Count intersections
                    let inters = 0;
                    const len = word.length;
                    for (let i = 0; i < len; i++) {
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

    // Sort: prefer placements with more intersections, centered
    candidates.sort((a, b) => {
        if (b.intersections !== a.intersections) return b.intersections - a.intersections;
        // Prefer more centered placements
        const aDist = Math.abs(a.r - 7) + Math.abs(a.c - 7);
        const bDist = Math.abs(b.r - 7) + Math.abs(b.c - 7);
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
            // Place first word in center
            const r = Math.floor((size - 1) / 2);
            const c = Math.floor((size - entry.word.length) / 2);
            if (c >= 0 && c + entry.word.length <= size) {
                placeWord(grid, entry.word, r, c, 'across');
                placed.push({ word: entry.word, clue: entry.clue, row: r, col: c, direction: 'across' });
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
function gridToLayout(grid, size) {
    return grid.map(row => row.map(cell => cell !== null ? 1 : 0));
}

// ═══════════════════════════════════════════════════
//  DIFFICULTY EVALUATOR
// ═══════════════════════════════════════════════════
function difficultyEvaluator(words) {
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
function puzzleValidator(words) {
    const errors = [];
    if (words.length < MIN_WORDS_PER_PUZZLE) errors.push(`Too few: ${words.length}`);
    const answers = words.map(w => w.answer);
    if (new Set(answers).size !== answers.length) errors.push('Duplicates');
    for (const w of words) {
        if (w.answer.length >= 4 && w.clue.toUpperCase().includes(w.answer)) errors.push(`Leak: ${w.answer}`);
        if (w.clue.trim().split(/\s+/).length > MAX_CLUE_WORDS) errors.push(`Long clue: ${w.answer}`);
    }
    return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════
//  CLAMP PUZZLE TO GRID BOUNDS
// ═══════════════════════════════════════════════════
function clampToGrid(words, gridSize) {
    return words.filter(w => {
        if (w.direction === 'across') {
            return w.startRow >= 0 && w.startRow < gridSize &&
                w.startCol >= 0 && w.startCol + w.answer.length <= gridSize;
        } else {
            return w.startCol >= 0 && w.startCol < gridSize &&
                w.startRow >= 0 && w.startRow + w.answer.length <= gridSize;
        }
    });
}

// ═══════════════════════════════════════════════════
//  GENERATE PUZZLES FOR TIER
// ═══════════════════════════════════════════════════
function generatePuzzlesForTier(tier, bank, startSeed, globalUsed) {
    const tierCfg = TIERS[tier];
    const pool = buildPool(bank, tier);
    const puzzles = [];
    let seed = startSeed;
    let failures = 0;

    console.log(`\n── ${tier.toUpperCase()} ──`);
    console.log(`  Pool: ${pool.length} words (len ${tierCfg.minLen}-${tierCfg.maxLen})`);

    while (puzzles.length < PUZZLE_COUNT_PER_TIER) {
        seed++;
        if (failures > PUZZLE_COUNT_PER_TIER * 50) {
            console.log(`  ⚠ Giving up after ${failures} failures`);
            break;
        }

        let bestPlaced = [];
        let bestGrid = null;
        let bestUsed = new Set();

        for (let attempt = 0; attempt < ATTEMPTS_PER_PUZZLE; attempt++) {
            const rng = mulberry32(seed * 100 + attempt);
            const shuffled = seededShuffle(pool, rng).slice(0, CANDIDATE_WORDS);
            const result = buildSinglePuzzle(shuffled, GRID_SIZE);

            if (result.placed.length > bestPlaced.length) {
                bestPlaced = result.placed;
                bestGrid = result.grid;
                bestUsed = result.usedWords;
            }
        }

        if (bestPlaced.length < MIN_WORDS_PER_PUZZLE) {
            failures++;
            continue;
        }

        const words = numberWords(bestPlaced);
        const clamped = clampToGrid(words, GRID_SIZE);

        // Re-number after clamping
        const renumbered = numberWords(clamped.map(w => ({
            word: w.answer, clue: w.clue, row: w.startRow, col: w.startCol, direction: w.direction,
        })));

        const validation = puzzleValidator(renumbered);
        if (!validation.valid) {
            failures++;
            continue;
        }

        const puzzleNum = puzzles.length + 1;
        const puzzleId = `big_${tier}_${String(puzzleNum).padStart(3, '0')}`;

        for (const w of bestUsed) globalUsed.add(w);

        const evaluation = difficultyEvaluator(renumbered);
        const layout = bestGrid ? gridToLayout(bestGrid, GRID_SIZE) : [];

        puzzles.push({
            tier: tierCfg.label,
            puzzle_id: puzzleId,
            difficulty_band: `${tierCfg.scoreBand[0]}-${tierCfg.scoreBand[1]}`,
            grid_size: '15x15',
            layout,
            answers: renumbered.map(w => ({
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
        });

        if (puzzles.length % 10 === 0) {
            process.stdout.write(`  ✓ ${puzzles.length}/${PUZZLE_COUNT_PER_TIER}\n`);
        }
    }

    console.log(`  Done: ${puzzles.length} puzzles (${failures} retries)`);
    return puzzles;
}

// ═══════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════
function main() {
    console.log('═══════════════════════════════════════');
    console.log(' 15×15 Crossword Batch Generator v3');
    console.log('═══════════════════════════════════════');
    console.log(`Target: ${PUZZLE_COUNT_PER_TIER * 3} puzzles (${PUZZLE_COUNT_PER_TIER}/tier)`);

    const bank = loadWordBank();
    console.log(`Word bank: ${bank.length} entries`);

    const t0 = Date.now();
    const globalUsed = new Set();

    const easy = generatePuzzlesForTier('easy', bank, 10000, globalUsed);
    const medium = generatePuzzlesForTier('medium', bank, 20000, globalUsed);
    const hard = generatePuzzlesForTier('hard', bank, 30000, globalUsed);

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
        if (tp.length === 0) { console.log(`  ${tier.toUpperCase()}: 0 puzzles`); continue; }
        const avgW = Math.round(tp.reduce((s, p) => s + p.metadata.total_words, 0) / tp.length);
        const avgL = Math.round(tp.reduce((s, p) => s + p.metadata.average_answer_length, 0) / tp.length * 10) / 10;
        const avgS = Math.round(tp.reduce((s, p) => s + p.metadata.difficulty_score, 0) / tp.length);
        const minW = Math.min(...tp.map(p => p.metadata.total_words));
        const maxW = Math.max(...tp.map(p => p.metadata.total_words));
        console.log(`  ${tier.toUpperCase()}: ${tp.length} puzzles | words ${minW}-${maxW} (avg ${avgW}) | avg len ${avgL} | score ${avgS}`);
    }

    console.log(`\n  Total: ${all.length} puzzles`);
    console.log(`  Unique answers: ${uniqueAnswers.size} / ${allAnswers.length} total`);
    console.log(`  Answer leaks: ${leaks}`);
    console.log(`  Time: ${elapsed}s`);

    fs.writeFileSync(OUT_PATH, JSON.stringify(all, null, 2), 'utf8');
    const mb = (fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(2);
    console.log(`  Output: ${OUT_PATH} (${mb} MB)`);
}

main();
