#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  LEVEL REBUILD PIPELINE
 *  Detects levels containing deleted clues, soft-deletes them,
 *  and regenerates replacements using only clean clues.
 * ═══════════════════════════════════════════════════════════════
 *
 *  Usage:
 *    node scripts/levelRebuild.js --dry-run     Report only
 *    node scripts/levelRebuild.js --apply        Execute rebuild
 */

const fs = require('fs');
const path = require('path');

// ── Paths ──
const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'questions_db.json');
const GENERATED_PATH = path.join(__dirname, '..', 'src', 'cengel', 'puzzles', 'generated.ts');
const REPORT_DIR = path.join(__dirname, '..', 'reports');

// ── Config ──
const MIN_ANSWER_LEN = 3;
const MAX_ATTEMPTS_PER_LEVEL = 80;
const MAX_PLACEMENT_TRIES = 300;

// ═══════════════════════════════════════════════════
//  1. PARSE EXISTING generated.ts
// ═══════════════════════════════════════════════════
function parseGeneratedLevels(content) {
    const levels = [];
    // Match each PuzzleSpec block
    const specRegex = /export const (ch\d+): PuzzleSpec = \{([\s\S]*?)\};\s*\n/g;
    let match;
    while ((match = specRegex.exec(content)) !== null) {
        const varName = match[1];
        const body = match[2];

        // Parse fields
        const id = (body.match(/id:\s*'([^']+)'/) || [])[1] || varName;
        const title = (body.match(/title:\s*'([^']+)'/) || [])[1] || '';
        const rows = parseInt((body.match(/rows:\s*(\d+)/) || [])[1] || '7');
        const cols = parseInt((body.match(/cols:\s*(\d+)/) || [])[1] || '7');
        const theme = (body.match(/theme:\s*'([^']+)'/) || [])[1] || 'Genel';
        const difficulty = (body.match(/difficulty:\s*'([^']+)'/) || [])[1] || 'easy';

        // Parse placements
        const placements = [];
        const placementRegex = /\{\s*clueRow:\s*(\d+),\s*clueCol:\s*(\d+),\s*direction:\s*'(\w+)',\s*clue:\s*'((?:[^'\\]|\\.)*)'\s*,\s*answer:\s*'([^']+)'\s*\}/g;
        let pm;
        while ((pm = placementRegex.exec(body)) !== null) {
            placements.push({
                clueRow: parseInt(pm[1]),
                clueCol: parseInt(pm[2]),
                direction: pm[3],
                clue: pm[4].replace(/\\'/g, "'"),
                answer: pm[5],
            });
        }

        levels.push({ id, title, rows, cols, theme, difficulty, placements });
    }
    return levels;
}

// ═══════════════════════════════════════════════════
//  2. DETECT IMPACTED LEVELS
// ═══════════════════════════════════════════════════
function findImpactedLevels(levels, cleanClueAnswers) {
    const impacted = [];
    const clean = [];

    for (const level of levels) {
        let hasDeletedClue = false;
        const badClues = [];

        for (const p of level.placements) {
            // A clue is "deleted" if its answer is NOT in the clean pool
            // (We match answer+clue text combo for precision)
            if (!cleanClueAnswers.has(p.answer)) {
                hasDeletedClue = true;
                badClues.push({ answer: p.answer, clue: p.clue.substring(0, 50) });
            }
        }

        if (hasDeletedClue) {
            impacted.push({ level, badClues });
        } else {
            clean.push(level);
        }
    }

    return { impacted, clean };
}

// ═══════════════════════════════════════════════════
//  3. CROSSWORD GENERATOR (from generate_levels.js)
// ═══════════════════════════════════════════════════
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function createGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(null));
}

function tryPlace(grid, size, answer, direction, clueRow, clueCol, usedAnswers) {
    if (usedAnswers.has(answer)) return null;
    if (clueRow < 0 || clueRow >= size || clueCol < 0 || clueCol >= size) return null;
    const clueCell = grid[clueRow][clueCol];
    if (clueCell !== null && clueCell !== 'CLUE') return null;

    let hasIntersection = false;
    for (let i = 0; i < answer.length; i++) {
        const r = direction === 'down' ? clueRow + 1 + i : clueRow;
        const c = direction === 'across' ? clueCol + 1 + i : clueCol;
        if (r < 0 || r >= size || c < 0 || c >= size) return null;
        const cell = grid[r][c];
        if (cell === 'CLUE') return null;
        if (cell !== null && cell !== answer[i]) return null;
        if (cell === answer[i]) hasIntersection = true;
    }
    return { clueRow, clueCol, direction, answer, hasIntersection };
}

function applyPlacement(grid, placement) {
    const { clueRow, clueCol, direction, answer } = placement;
    grid[clueRow][clueCol] = 'CLUE';
    for (let i = 0; i < answer.length; i++) {
        const r = direction === 'down' ? clueRow + 1 + i : clueRow;
        const c = direction === 'across' ? clueCol + 1 + i : clueCol;
        grid[r][c] = answer[i];
    }
}

function removePlacement(grid, placement, otherPlacements) {
    const { clueRow, clueCol, direction, answer } = placement;
    const prot = new Set();
    for (const p of otherPlacements) {
        prot.add(`${p.clueRow},${p.clueCol}`);
        for (let i = 0; i < p.answer.length; i++) {
            const r = p.direction === 'down' ? p.clueRow + 1 + i : p.clueRow;
            const c = p.direction === 'across' ? p.clueCol + 1 + i : p.clueCol;
            prot.add(`${r},${c}`);
        }
    }
    if (!prot.has(`${clueRow},${clueCol}`)) grid[clueRow][clueCol] = null;
    for (let i = 0; i < answer.length; i++) {
        const r = direction === 'down' ? clueRow + 1 + i : clueRow;
        const c = direction === 'across' ? clueCol + 1 + i : clueCol;
        if (!prot.has(`${r},${c}`)) grid[r][c] = null;
    }
}

function buildLetterIndex(qaList) {
    const idx = {};
    for (const q of qaList) {
        for (let i = 0; i < q.answer.length; i++) {
            const ch = q.answer[i];
            if (!idx[ch]) idx[ch] = {};
            if (!idx[ch][i]) idx[ch][i] = [];
            idx[ch][i].push(q);
        }
    }
    return idx;
}

function findCandidates(grid, size, usedAnswers, maxLen, letterIndex) {
    const candidates = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const letter = grid[r][c];
            if (!letter || letter === 'CLUE') continue;
            const entries = letterIndex[letter] || {};
            for (const [posStr, qaList] of Object.entries(entries)) {
                const pos = parseInt(posStr);
                for (const qa of qaList) {
                    if (qa.len > maxLen || usedAnswers.has(qa.answer)) continue;
                    // Across
                    let p = tryPlace(grid, size, qa.answer, 'across', r, c - pos - 1, usedAnswers);
                    if (p && p.hasIntersection) candidates.push({ ...p, clue: qa.clue });
                    // Down
                    p = tryPlace(grid, size, qa.answer, 'down', r - pos - 1, c, usedAnswers);
                    if (p && p.hasIntersection) candidates.push({ ...p, clue: qa.clue });
                }
            }
        }
    }
    return shuffle(candidates);
}

function generateLevel(gridSize, minWords, maxWords, qaPool, letterIndex, globalUsed) {
    const maxLen = gridSize - 1;
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_LEVEL; attempt++) {
        const grid = createGrid(gridSize);
        const placements = [];
        const usedAnswers = new Set(globalUsed);

        const seedCandidates = shuffle(
            qaPool.filter(q => q.len >= Math.min(4, maxLen) && q.len <= maxLen && !usedAnswers.has(q.answer))
        );
        if (seedCandidates.length === 0) continue;
        const seed = seedCandidates[0];
        const seedRow = Math.floor(gridSize / 2);
        const sp = tryPlace(grid, gridSize, seed.answer, 'across', seedRow, 0, usedAnswers);
        if (!sp) continue;
        applyPlacement(grid, sp);
        placements.push({ ...sp, clue: seed.clue });
        usedAnswers.add(seed.answer);

        let stuck = 0;
        while (placements.length < maxWords && stuck < MAX_PLACEMENT_TRIES) {
            const cands = findCandidates(grid, gridSize, usedAnswers, maxLen, letterIndex);
            if (cands.length === 0) break;
            let placed = false;
            for (const cand of cands.slice(0, 40)) {
                const chk = tryPlace(grid, gridSize, cand.answer, cand.direction, cand.clueRow, cand.clueCol, usedAnswers);
                if (chk) {
                    applyPlacement(grid, cand);
                    placements.push({ clueRow: cand.clueRow, clueCol: cand.clueCol, direction: cand.direction, answer: cand.answer, clue: cand.clue });
                    usedAnswers.add(cand.answer);
                    placed = true; stuck = 0; break;
                }
            }
            if (!placed) {
                stuck++;
                if (placements.length > 1 && stuck > 15) {
                    const removed = placements.pop();
                    usedAnswers.delete(removed.answer);
                    removePlacement(grid, removed, placements);
                }
            }
        }

        if (placements.length >= minWords) {
            return placements.map(p => ({ clueRow: p.clueRow, clueCol: p.clueCol, direction: p.direction, clue: p.clue, answer: p.answer }));
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════
//  4. TIER CONFIG (word count expectations per grid size)
// ═══════════════════════════════════════════════════
function getTierConfig(gridSize) {
    if (gridSize <= 6) return { minWords: 4, maxWords: 6 };
    if (gridSize <= 7) return { minWords: 5, maxWords: 8 };
    if (gridSize <= 9) return { minWords: 7, maxWords: 12 };
    if (gridSize <= 11) return { minWords: 10, maxWords: 18 };
    return { minWords: 14, maxWords: 24 };
}

// ═══════════════════════════════════════════════════
//  5. STRUCTURAL INTEGRITY CHECK
// ═══════════════════════════════════════════════════
function checkIntegrity(level) {
    const issues = [];
    const { placements, rows } = level;

    // Check word count
    if (placements.length < 3) issues.push(`Only ${placements.length} words`);

    // Check across/down balance
    const across = placements.filter(p => p.direction === 'across').length;
    const down = placements.filter(p => p.direction === 'down').length;
    if (across === 0 || down === 0) issues.push('Missing across or down words');

    // Check connectivity (at least 50% words should intersect)
    const letterCells = new Map(); // "r,c" -> Set<answer>
    for (const p of placements) {
        for (let i = 0; i < p.answer.length; i++) {
            const r = p.direction === 'down' ? p.clueRow + 1 + i : p.clueRow;
            const c = p.direction === 'across' ? p.clueCol + 1 + i : p.clueCol;
            const key = `${r},${c}`;
            if (!letterCells.has(key)) letterCells.set(key, new Set());
            letterCells.get(key).add(p.answer);
        }
    }
    const sharedCells = [...letterCells.values()].filter(s => s.size >= 2).length;
    const intersectionRatio = placements.length > 1 ? sharedCells / placements.length : 0;
    if (intersectionRatio < 0.3) issues.push(`Low intersection ratio: ${(intersectionRatio * 100).toFixed(0)}%`);

    // Check bounds
    for (const p of placements) {
        for (let i = 0; i < p.answer.length; i++) {
            const r = p.direction === 'down' ? p.clueRow + 1 + i : p.clueRow;
            const c = p.direction === 'across' ? p.clueCol + 1 + i : p.clueCol;
            if (r < 0 || r >= rows || c < 0 || c >= rows) {
                issues.push(`Out of bounds: ${p.answer} at (${r},${c})`);
                break;
            }
        }
    }

    // Check duplicate answers
    const answers = placements.map(p => p.answer);
    const dupes = answers.filter((a, i) => answers.indexOf(a) !== i);
    if (dupes.length > 0) issues.push(`Duplicate answers: ${dupes.join(', ')}`);

    return { valid: issues.length === 0, issues, intersectionRatio };
}

// ═══════════════════════════════════════════════════
//  6. WRITE BACK GENERATED.TS
// ═══════════════════════════════════════════════════
function writeGeneratedTs(levels) {
    let output = `// AUTO-GENERATED FILE — DO NOT EDIT MANUALLY
// Generated by scripts/levelRebuild.js
// ${new Date().toISOString()}

import { PuzzleSpec, WordPlacement } from '../puzzleBuilder';

`;
    for (const level of levels) {
        const ps = level.placements.map(p => {
            const clue = p.clue.replace(/'/g, "\\'");
            return `        { clueRow: ${p.clueRow}, clueCol: ${p.clueCol}, direction: '${p.direction}', clue: '${clue}', answer: '${p.answer}' }`;
        }).join(',\n');

        output += `export const ${level.id}: PuzzleSpec = {
    id: '${level.id}',
    title: '${level.title}',
    rows: ${level.rows},
    cols: ${level.cols},
    theme: '${level.theme}',
    difficulty: '${level.difficulty}',
    placements: [
${ps}
    ],
};

`;
    }

    // allNewSpecs
    output += `export const allNewSpecs: PuzzleSpec[] = [\n`;
    output += levels.map(l => `    ${l.id}`).join(',\n');
    output += `\n];\n\n`;

    // Chapter groups (5 per chapter)
    const chapterNames = [
        'Yeni Başlangıç', 'Keşif Yolu', 'Macera', 'İlerleme', 'Güçlenme',
        'Ustalık Yolu', 'Derinlik', 'Çelik İrade', 'Doruklarda', 'Zirve Ötesi',
        'Altın Çağ', 'Efsane Ötesi', 'Büyük Meydan', 'Son Sınav', 'Şampiyon',
        'Ultra Zirve', 'Mega Fırtına',
    ];
    const chapterSubs = [
        'Yeni maceralar başlıyor', 'Keşfetmeye devam', 'Heyecan dorukta',
        'Daha da ilerle', 'Gücünü göster', 'Ustalığını kanıtla',
        'Derinlere dal', 'İradenle kazan', 'Doruklara çık', 'Zirveyi aş',
        'Altın dönem', 'Efsanelerin ötesi', 'Büyük sınav', 'Son mücadele', 'Şampiyonluk',
        'Ötesine geç', 'Fırtınayı aş',
    ];
    output += `export const newChapterGroups = [\n`;
    for (let i = 0; i < levels.length; i += 5) {
        const chunk = levels.slice(i, i + 5);
        const ids = chunk.map(l => `'${l.id}'`).join(', ');
        const ci = Math.floor(i / 5);
        const name = chapterNames[ci % chapterNames.length];
        const sub = chapterSubs[ci % chapterSubs.length];
        output += `    { title: '${name}', subtitle: '${sub}', puzzleIds: [${ids}] },\n`;
    }
    output += `];\n`;

    return output;
}

// ═══════════════════════════════════════════════════
//  7. MAIN
// ═══════════════════════════════════════════════════
function main() {
    const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
    console.log(`\n🔧 LEVEL REBUILD PIPELINE — ${mode.toUpperCase()}\n${'═'.repeat(60)}\n`);

    // Load clean questions
    const questions = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const cleanAnswers = new Set(questions.map(q => q.answer.toUpperCase().replace(/\s+/g, '')));
    console.log(`📊 Clean clue pool: ${questions.length} clues (${cleanAnswers.size} unique answers)`);

    // Parse generated levels
    const genContent = fs.readFileSync(GENERATED_PATH, 'utf-8');
    const allLevels = parseGeneratedLevels(genContent);
    console.log(`📊 Existing levels: ${allLevels.length}\n`);

    // Detect impacted levels
    const { impacted, clean } = findImpactedLevels(allLevels, cleanAnswers);
    console.log(`📋 IMPACT ANALYSIS`);
    console.log('─'.repeat(50));
    console.log(`  ✅ Clean levels:    ${clean.length}`);
    console.log(`  ❌ Impacted levels: ${impacted.length}`);
    console.log(`  📊 Impact rate:     ${(impacted.length / allLevels.length * 100).toFixed(1)}%`);
    console.log();

    if (impacted.length > 0) {
        console.log('🗑️  IMPACTED LEVEL SAMPLES (first 15):');
        console.log('─'.repeat(80));
        impacted.slice(0, 15).forEach(({ level, badClues }) => {
            console.log(`  ${level.id} "${level.title}" (${level.rows}×${level.cols} ${level.difficulty})`);
            console.log(`    Bad clues: ${badClues.map(c => c.answer).join(', ')}`);
        });
        console.log();
    }

    // Prepare QA pool for regeneration
    const qaPool = questions
        .filter(q => q.answer && q.clue && q.answer.length >= MIN_ANSWER_LEN)
        .map(q => ({ answer: q.answer.toUpperCase().replace(/\s+/g, ''), clue: q.clue, len: q.answer.length }));
    const letterIndex = buildLetterIndex(qaPool);

    // Track answers used by clean levels to avoid heavy reuse
    const globalUsed = new Set();
    for (const level of clean) {
        for (const p of level.placements) globalUsed.add(p.answer);
    }

    // Rebuild impacted levels
    console.log('🔄 REBUILDING LEVELS...');
    console.log('─'.repeat(50));
    let rebuilt = 0, failed = 0;
    const rebuiltLevels = [];

    for (const { level } of impacted) {
        const tier = getTierConfig(level.rows);
        const newPlacements = generateLevel(level.rows, tier.minWords, tier.maxWords, qaPool, letterIndex, globalUsed);

        if (newPlacements) {
            const newLevel = { ...level, placements: newPlacements };
            const integrity = checkIntegrity(newLevel);

            if (integrity.valid) {
                rebuiltLevels.push(newLevel);
                for (const p of newPlacements) globalUsed.add(p.answer);
                rebuilt++;
                console.log(`  ✓ ${level.id} rebuilt — ${newPlacements.length} words, intersect=${(integrity.intersectionRatio * 100).toFixed(0)}%`);
            } else {
                // Try once more
                const retry = generateLevel(level.rows, tier.minWords, tier.maxWords, qaPool, letterIndex, globalUsed);
                if (retry) {
                    const retryLevel = { ...level, placements: retry };
                    const ri = checkIntegrity(retryLevel);
                    if (ri.valid) {
                        rebuiltLevels.push(retryLevel);
                        for (const p of retry) globalUsed.add(p.answer);
                        rebuilt++;
                        console.log(`  ✓ ${level.id} rebuilt (retry) — ${retry.length} words`);
                    } else {
                        failed++;
                        console.log(`  ✗ ${level.id} FAILED — integrity issues: ${ri.issues.join('; ')}`);
                    }
                } else {
                    failed++;
                    console.log(`  ✗ ${level.id} FAILED — could not generate`);
                }
            }
        } else {
            failed++;
            console.log(`  ✗ ${level.id} FAILED — no valid grid after ${MAX_ATTEMPTS_PER_LEVEL} attempts`);
        }
    }

    console.log();
    console.log('📋 REBUILD SUMMARY');
    console.log('─'.repeat(50));
    console.log(`  ✅ Rebuilt:  ${rebuilt}`);
    console.log(`  ❌ Failed:   ${failed}`);
    console.log(`  📊 Pool used: ${qaPool.length} clues`);
    console.log();

    // Save report
    if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
    const reportPath = path.join(REPORT_DIR, `level_rebuild_${mode}_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        mode,
        summary: {
            totalLevels: allLevels.length,
            cleanLevels: clean.length,
            impactedLevels: impacted.length,
            rebuilt, failed,
            cluePoolSize: qaPool.length,
        },
        impactedIds: impacted.map(i => i.level.id),
        rebuiltIds: rebuiltLevels.map(l => l.id),
        failedIds: impacted.filter((_, i) => i >= rebuilt).map(i => i.level.id),
    }, null, 2));
    console.log(`📄 Report: ${reportPath}\n`);

    // Apply
    if (mode === 'apply') {
        console.log('⚡ APPLYING...');
        const backupPath = GENERATED_PATH.replace('.ts', `_backup_${Date.now()}.ts`);
        fs.copyFileSync(GENERATED_PATH, backupPath);
        console.log(`  💾 Backup: ${path.basename(backupPath)}`);

        // Merge: clean levels + rebuilt levels, sorted by ID
        const finalLevels = [...clean, ...rebuiltLevels].sort((a, b) => {
            const numA = parseInt(a.id.replace('ch', ''));
            const numB = parseInt(b.id.replace('ch', ''));
            return numA - numB;
        });

        const output = writeGeneratedTs(finalLevels);
        fs.writeFileSync(GENERATED_PATH, output, 'utf-8');
        console.log(`  ✅ generated.ts rewritten: ${finalLevels.length} levels`);
        console.log(`     (${clean.length} kept + ${rebuiltLevels.length} rebuilt, ${failed} dropped)`);
        console.log('\n✅ DONE\n');
    } else {
        console.log('ℹ️  DRY RUN — no changes. Use --apply to execute.\n');
    }
}

main();
