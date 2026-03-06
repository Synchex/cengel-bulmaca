/**
 * generate_crosswords.js — Builds 295 newspaper-quality crossword puzzles (ch6–ch300).
 *
 * Algorithm:
 *   1. Place first word horizontally near grid center
 *   2. For each subsequent word, find best intersecting placement
 *   3. Clue cell = one cell before first letter
 *   4. Reject poorly-connected puzzles
 *
 * Output: writes src/cengel/puzzles/generated.ts
 */
const fs = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────
const TIERS = [
    { range: [6, 40], diff: 'easy', gridSize: 7, wordCount: [5, 7], ansLens: [3, 6] },
    { range: [41, 120], diff: 'medium', gridSize: 9, wordCount: [6, 9], ansLens: [3, 7] },
    { range: [121, 220], diff: 'hard', gridSize: 11, wordCount: [8, 11], ansLens: [4, 8] },
    { range: [221, 300], diff: 'hard', gridSize: 13, wordCount: [9, 12], ansLens: [4, 10] },
];

const TITLES = [
    'Başlangıç', 'Adım', 'Dalga', 'Güneş', 'Keşif', 'Nefes', 'Yıldız', 'Pusula',
    'Atlas', 'Rüzgar', 'Çınar', 'Köprü', 'Kıvılcım', 'Deniz Feneri', 'Labirent',
    'Meridyen', 'Kaşif', 'Fırtına', 'Şafak', 'Derin Sular', 'Ustalık', 'Sözcük Avı',
    'Zeka Oyunu', 'Zihin', 'Bilgi Küpü', 'Cesaret', 'Kelime Ustası', 'Çapraz Düşün',
    'Horizon', 'Aydınlık', 'Kalem Ucu', 'Meydan', 'Ufuk', 'Sabah', 'Deniz Kabuğu',
    'Rüzgar Gülü', 'Yeni Ufuk', 'Son Perde', 'Zirve', 'Altın Çağ', 'Efsane',
    'Kale', 'Taş Duvar', 'Derin Düşün', 'Çelik İrade', 'Mega Güç', 'Gizem',
    'Büyük Sınav', 'Doruklarda', 'Şampiyon', 'Ultra Zirve', 'Süper Güç',
    'Son Mücadele', 'Düşün Kazan', 'Hız Testi', 'Sonsuz Yol', 'İlham', 'Zafer',
    'Elmas', 'Yakut', 'Zümrüt', 'Safir', 'İnci', 'Kristal', 'Mercan', 'Kehribar',
    'Opal', 'Akik', 'Oniks', 'Topaz', 'Ametist', 'Turkuaz', 'Lapis', 'Kuvars',
    'Kaplan Gözü', 'Ay Taşı', 'Yıldız Taşı', 'Ateş Opali', 'Altın', 'Gümüş',
    'Bronz', 'Platin', 'Bakır', 'Çelik', 'Titanyum', 'Kobalt', 'Nikel', 'Krom',
    'Okyanus', 'Nehir', 'Göl', 'Şelale', 'Pınar', 'Dere', 'Çay', 'Akarsu',
    'Girdap', 'Akıntı', 'Dalga Kıran', 'Med Cezir', 'Fırtına Dalgası', 'Gel Git',
    'Tsunami', 'Gel', 'Git', 'Marina', 'İskele', 'Liman', 'Rıhtım', 'Fener',
    'Deniz Yıldızı', 'Yunus', 'Balina', 'Mercan Adası', 'Ahtapot', 'Deniz Atı',
    'Midye', 'İstiridye', 'Uskumru', 'Levrek', 'Hamsi', 'Çipura', 'Barbun', 'Sardalya',
    'Palamut', 'Kefal', 'Mezgit', 'Lüfer', 'Somon', 'Orkinos', 'Kalkan', 'Turbot',
    'Fener Balığı', 'İstakoz', 'Karides', 'Pavurya', 'Yengeç', 'Gergedan', 'Flamingo',
    'Pelikan', 'Martı', 'Kartal', 'Şahin', 'Doğan', 'Atmaca', 'Baykuş', 'Guguk',
    'Bülbül', 'Kumru', 'Serçe', 'Saka', 'İspinoz', 'Çalıkuşu', 'Kırlangıç',
    'Turna', 'Leylek', 'Karga', 'Saksağan', 'Ötleğen', 'Kanarya', 'Papağan',
    'Tavus', 'Devekuşu', 'Penguen', 'Albatros', 'Çakal', 'Tilki', 'Tavşan',
    'Ceylan', 'Geyik', 'Ayı', 'Kurt', 'Panter', 'Jaguar', 'Leopar', 'Çita',
    'Bizon', 'Ceylan B', 'Karaca', 'Dağ Keçisi', 'Dağ Koyunu', 'Yaban Domuzu',
    'Porsuk', 'Samur', 'Su Samuru', 'Kunduz', 'Gelincik', 'Kokarca', 'Sansar',
    'Sincap', 'Kirpi', 'Fare', 'Yarasa', 'Fil', 'Gergedan B', 'Zebra',
    'Okapi', 'Zürafa', 'Hipopotam', 'Tapir', 'Lama', 'Alpaka', 'Bizon B',
    'Deve A', 'Yak', 'Manda', 'Antilop', 'İmpala', 'Gazel', 'Kudu', 'Eland',
    'Dikdik', 'Springbok', 'Rafya', 'Bambu', 'Söğüt', 'Akasya', 'Çam', 'Sedir',
    'Meşe', 'Kayın', 'Kavak', 'Dişbudak', 'Gürgen', 'Karaağaç', 'Kestane',
    'Ceviz', 'Badem', 'Fıstık', 'Fındık', 'Zeytin', 'İncir', 'Nar', 'Üzüm',
    'Kayısı', 'Şeftali', 'Erik', 'Kiraz', 'Vişne', 'Elma', 'Armut', 'Ayva',
    'Muşmula', 'Dut', 'Böğürtlen', 'Ahududu', 'Çilek', 'Kavun', 'Karpuz',
    'Portakal', 'Mandalina', 'Limon', 'Greyfurt', 'Mango', 'Avokado', 'Ananas',
    'Papaya', 'Guava', 'Hurma', 'Hindistan', 'Vanilya', 'Tarçın', 'Karanfil',
    'Safran', 'Zencefil', 'Kekik', 'Nane', 'Biberiye', 'Adaçayı', 'Lavanta',
    'Papatya', 'Menekşe', 'Sümbül', 'Lale', 'Gül', 'Karanfil B', 'Yasemin',
];

const GROUP_TITLES = [
    { title: 'Yeni Başlangıç', subtitle: 'Kolay turlar' },
    { title: 'Keşif Yolu', subtitle: 'Keşfetmeye devam' },
    { title: 'Macera', subtitle: 'Heyecan dorukta' },
    { title: 'İlerleme', subtitle: 'Daha da ilerle' },
    { title: 'Güçlenme', subtitle: 'Gücünü göster' },
    { title: 'Ustalık Yolu', subtitle: 'Ustalığını kanıtla' },
    { title: 'Derinlik', subtitle: 'Derinlere dal' },
    { title: 'Çelik İrade', subtitle: 'İradenle kazan' },
    { title: 'Doruklarda', subtitle: 'Doruklara çık' },
    { title: 'Zirve Ötesi', subtitle: 'Zirveyi aş' },
    { title: 'Altın Çağ', subtitle: 'Altın dönem' },
    { title: 'Efsane Ötesi', subtitle: 'Efsanelerin ötesi' },
    { title: 'Büyük Meydan', subtitle: 'Büyük sınav' },
    { title: 'Son Sınav', subtitle: 'Son mücadele' },
    { title: 'Şampiyon', subtitle: 'Şampiyonluk' },
    { title: 'Ultra Zirve', subtitle: 'Ötesine geç' },
    { title: 'Mega Fırtına', subtitle: 'Fırtınayı aş' },
    { title: 'Yıldız Tozu', subtitle: 'Yıldızlara uzan' },
    { title: 'Kristal Kubbe', subtitle: 'Parıltılı zafer' },
    { title: 'Son Perde', subtitle: 'Final perdesi' },
];

// ─── BAD CLUE FILTER ─────────────────────────────────────────
const BAD_PATTERNS = [
    /sözlük anlamı/i, /bilinmeyen veya/i, /eski türkçe kökenli/i,
    /kökenli kelime/i, /\d+\.\s*paket/i, /halk ağzında/i,
    /eski dilde/i, /eskimiş söz/i, /osmanlıca/i,
    /kategori:/i, /bilinmeyen kelime/i, /şifreli ipucu/i,
    /vikipedi/i, /wikipedia/i, /altfamil/i, /taksonomi/i,
    /御節/i, /ryōri/i, /osechi/i, /\(çekim\)/i, /► /i,
    /latince adı/i, /4 harfli/i, /\d\s*hrf/i, /\d\s*Hrf/i,
    /\d\s*harf/i, /Clue\s*=/i, /Clue\s*:/i, /Script hata/i,
    /vb\s+vs\s+/i, /falan\s+filan/i, /falan\s+vs/i,
    /filn\s+vs/i, /ds\s+fb\s+/i, /cd\s+bd\s+/i,
    /Msss\s+/i, /aksoy şu anlamlara/i, /romanize:/i,
    /Arapça:/i, /Yunanca:/i, /Farsça:/i, /İbranice/i,
    /Rusça:/i, /romanize/i,
];

function isBadClue(clue) {
    if (!clue || clue.length < 5) return true;
    if (clue.length > 120) return true; // too long for crossword
    if (BAD_PATTERNS.some(p => p.test(clue))) return true;
    // Check for gibberish-looking clues (too many consonant clusters)
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(clue)) return true;
    return false;
}

function isBadAnswer(answer) {
    if (!answer || answer.length < 2) return true;
    if (!/^[A-ZÇĞİÖŞÜ]+$/.test(answer)) return true;
    return false;
}

// ─── LOAD QUESTIONS ──────────────────────────────────────────
const dbPath = path.join(__dirname, '..', 'src', 'data', 'questions_db.json');
const rawDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const cleanDB = rawDB.filter(q => !isBadClue(q.clue) && !isBadAnswer(q.answer));
console.log(`Loaded ${rawDB.length} questions, ${cleanDB.length} after filtering`);

// Group by length
const byLen = {};
cleanDB.forEach(q => {
    const l = q.answer.length;
    if (!byLen[l]) byLen[l] = [];
    byLen[l].push(q);
});
// Shuffle each bucket
for (const l in byLen) byLen[l].sort(() => Math.random() - 0.5);

// ─── CROSSWORD GENERATOR ────────────────────────────────────
const EMPTY = 0;
const BLOCK = -1;
const CLUE_CELL = -2;

class CrosswordGrid {
    constructor(size) {
        this.size = size;
        this.grid = Array.from({ length: size }, () => new Array(size).fill(EMPTY));
        this.words = []; // { answer, clue, row, col, direction, cells[] }
    }

    getCell(r, c) {
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) return null;
        return this.grid[r][c];
    }

    // Try to place a word. Returns true if successful.
    placeWord(answer, clue, row, col, direction) {
        const cells = [];
        const len = answer.length;

        // Compute clue cell position
        let clueR, clueC;
        if (direction === 'across') {
            clueR = row;
            clueC = col - 1;
        } else {
            clueR = row - 1;
            clueC = col;
        }

        // Check clue cell is valid
        if (clueR < 0 || clueC < 0 || clueR >= this.size || clueC >= this.size) return false;
        const clueCell = this.grid[clueR][clueC];
        if (clueCell !== EMPTY && clueCell !== CLUE_CELL) return false;

        // Check all letter positions
        for (let i = 0; i < len; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;

            if (r >= this.size || c >= this.size) return false;

            const existing = this.grid[r][c];
            if (existing === EMPTY) {
                // OK - empty cell
            } else if (typeof existing === 'string') {
                // Already a letter - must match
                if (existing !== answer[i]) return false;
            } else {
                // BLOCK or CLUE_CELL - can't place here
                return false;
            }

            cells.push({ r, c, letter: answer[i] });
        }

        // Check adjacency rules: the cell AFTER the last letter shouldn't be a letter
        // (to avoid unintended word extensions)
        if (direction === 'across') {
            const afterC = col + len;
            if (afterC < this.size && typeof this.grid[row][afterC] === 'string') return false;
        } else {
            const afterR = row + len;
            if (afterR < this.size && typeof this.grid[afterR][col] === 'string') return false;
        }

        // All checks passed - commit
        this.grid[clueR][clueC] = CLUE_CELL;
        for (const cell of cells) {
            this.grid[cell.r][cell.c] = cell.letter;
        }

        this.words.push({
            answer, clue,
            clueRow: clueR, clueCol: clueC,
            direction,
            startRow: cells[0].r, startCol: cells[0].c,
        });

        return true;
    }

    // Find all valid placements for a word that intersect with existing words
    findIntersectingPlacements(answer) {
        const placements = [];
        const len = answer.length;

        for (let i = 0; i < len; i++) {
            const letter = answer[i];
            // Find all cells on grid with this letter
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    if (this.grid[r][c] !== letter) continue;

                    // Try placing across: letter i of answer at (r, c), so word starts at (r, c-i)
                    const acrossStart = c - i;
                    if (acrossStart >= 1) { // Need room for clue cell at acrossStart-1
                        if (this.canPlace(answer, r, acrossStart, 'across')) {
                            placements.push({ row: r, col: acrossStart, direction: 'across', intersections: this.countIntersections(answer, r, acrossStart, 'across') });
                        }
                    }

                    // Try placing down: letter i of answer at (r, c), so word starts at (r-i, c)
                    const downStart = r - i;
                    if (downStart >= 1) { // Need room for clue cell at downStart-1
                        if (this.canPlace(answer, downStart, c, 'down')) {
                            placements.push({ row: downStart, col: c, direction: 'down', intersections: this.countIntersections(answer, downStart, c, 'down') });
                        }
                    }
                }
            }
        }

        // Sort by intersections (most first)
        placements.sort((a, b) => b.intersections - a.intersections);
        return placements;
    }

    canPlace(answer, row, col, direction) {
        const len = answer.length;

        // Check clue cell
        let clueR = direction === 'across' ? row : row - 1;
        let clueC = direction === 'across' ? col - 1 : col;
        if (clueR < 0 || clueC < 0 || clueR >= this.size || clueC >= this.size) return false;
        const clueCell = this.grid[clueR][clueC];
        if (clueCell !== EMPTY && clueCell !== CLUE_CELL) return false;

        let hasIntersection = false;

        for (let i = 0; i < len; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;

            if (r >= this.size || c >= this.size) return false;

            const existing = this.grid[r][c];
            if (existing === EMPTY) {
                // Check parallel adjacency: avoid placing next to parallel words
                if (direction === 'across') {
                    if (r > 0 && typeof this.grid[r - 1][c] === 'string' && !hasIntersection) { /* adjacent above */ }
                    if (r < this.size - 1 && typeof this.grid[r + 1][c] === 'string') { /* adjacent below */ }
                }
            } else if (typeof existing === 'string') {
                if (existing !== answer[i]) return false;
                hasIntersection = true;
            } else {
                return false;
            }
        }

        // Must have at least one intersection with existing words
        if (this.words.length > 0 && !hasIntersection) return false;

        // Check cell after last letter
        if (direction === 'across') {
            const afterC = col + len;
            if (afterC < this.size && typeof this.grid[row][afterC] === 'string') return false;
        } else {
            const afterR = row + len;
            if (afterR < this.size && typeof this.grid[afterR][col] === 'string') return false;
        }

        return true;
    }

    countIntersections(answer, row, col, direction) {
        let count = 0;
        for (let i = 0; i < answer.length; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;
            if (r < this.size && c < this.size && this.grid[r][c] === answer[i]) {
                count++;
            }
        }
        return count;
    }
}

// ─── PUZZLE GENERATOR ────────────────────────────────────────
function getTier(levelNum) {
    for (const t of TIERS) {
        if (levelNum >= t.range[0] && levelNum <= t.range[1]) return t;
    }
    return TIERS[TIERS.length - 1];
}

function getWordPool(tier) {
    const pool = [];
    for (let len = tier.ansLens[0]; len <= tier.ansLens[1]; len++) {
        if (byLen[len]) pool.push(...byLen[len]);
    }
    return pool.sort(() => Math.random() - 0.5);
}

const globalUsedAnswers = new Set();

function generatePuzzle(levelNum) {
    const tier = getTier(levelNum);
    const gridSize = tier.gridSize;
    const [minWords, maxWords] = tier.wordCount;
    const targetWords = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));

    // Get shuffled word pool for this tier
    const pool = getWordPool(tier);

    for (let attempt = 0; attempt < 20; attempt++) {
        const cw = new CrosswordGrid(gridSize);
        const usedInPuzzle = new Set();

        // Shuffle pool each attempt
        pool.sort(() => Math.random() - 0.5);

        // Place first word horizontally in the center area
        let firstPlaced = false;
        for (const q of pool) {
            if (globalUsedAnswers.has(q.answer) && Math.random() > 0.3) continue;
            if (q.answer.length > gridSize - 2) continue; // Need room for clue cell

            const row = Math.floor(gridSize / 2);
            const col = 1; // clue cell at col 0

            if (col + q.answer.length <= gridSize) {
                if (cw.placeWord(q.answer, q.clue, row, col, 'across')) {
                    usedInPuzzle.add(q.answer);
                    firstPlaced = true;
                    break;
                }
            }
        }

        if (!firstPlaced) continue;

        // Try to add more words
        let failures = 0;
        for (const q of pool) {
            if (cw.words.length >= targetWords) break;
            if (failures > 200) break;
            if (usedInPuzzle.has(q.answer)) { continue; }
            if (globalUsedAnswers.has(q.answer) && Math.random() > 0.3) { continue; }
            if (q.answer.length > gridSize - 2) { continue; }

            const placements = cw.findIntersectingPlacements(q.answer);
            if (placements.length > 0) {
                const best = placements[0];
                if (cw.placeWord(q.answer, q.clue, best.row, best.col, best.direction)) {
                    usedInPuzzle.add(q.answer);
                    failures = 0;
                } else {
                    failures++;
                }
            } else {
                failures++;
            }
        }

        if (cw.words.length >= minWords) {
            // Mark used
            for (const w of cw.words) globalUsedAnswers.add(w.answer);
            return cw;
        }
    }

    // Fallback: smaller puzzle
    return null;
}

// ─── MAIN: GENERATE ALL LEVELS ──────────────────────────────
console.log('\n=== Generating 295 crossword puzzles ===\n');

const puzzles = [];
let totalWords = 0;

for (let level = 6; level <= 300; level++) {
    const cw = generatePuzzle(level);
    if (!cw) {
        console.log(`Level ${level}: FAILED to generate, retrying with relaxed constraints...`);
        // Retry with allowing reuse
        globalUsedAnswers.clear();
        const cw2 = generatePuzzle(level);
        if (!cw2) {
            console.log(`Level ${level}: STILL FAILED, skipping`);
            continue;
        }
        puzzles.push({ level, cw: cw2 });
        totalWords += cw2.words.length;
        continue;
    }
    puzzles.push({ level, cw });
    totalWords += cw.words.length;
    if (level % 50 === 0) console.log(`  Generated level ${level} (${cw.words.length} words)`);
}

console.log(`\nGenerated ${puzzles.length} puzzles with ${totalWords} total words`);

// ─── OUTPUT: WRITE generated.ts ─────────────────────────────
const outPath = path.join(__dirname, '..', 'src', 'cengel', 'puzzles', 'generated.ts');
const existingContent = fs.readFileSync(outPath, 'utf8');

// Extract ch1-ch5 (keep them)
const ch5EndMatch = existingContent.match(/export const ch5:[\s\S]*?^\};/m);
if (!ch5EndMatch) {
    console.error('Could not find ch5 in generated.ts!');
    process.exit(1);
}
const ch5End = existingContent.indexOf(ch5EndMatch[0]) + ch5EndMatch[0].length;
const keptContent = existingContent.substring(0, ch5End);

// Build new content
let newContent = keptContent + '\n\n';

for (const { level, cw } of puzzles) {
    const tier = getTier(level);
    const title = TITLES[(level - 6) % TITLES.length];

    newContent += `export const ch${level}: PuzzleSpec = {\n`;
    newContent += `    id: 'ch${level}',\n`;
    newContent += `    title: '${title.replace(/'/g, "\\'")}',\n`;
    newContent += `    rows: ${cw.size},\n`;
    newContent += `    cols: ${cw.size},\n`;
    newContent += `    theme: 'Genel',\n`;
    newContent += `    difficulty: '${tier.diff}',\n`;
    newContent += `    placements: [\n`;

    for (const w of cw.words) {
        const safeClue = w.clue.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        newContent += `        { clueRow: ${w.clueRow}, clueCol: ${w.clueCol}, direction: '${w.direction}', clue: "${safeClue}", answer: '${w.answer}' },\n`;
    }

    newContent += `    ],\n`;
    newContent += `};\n\n`;
}

// allNewSpecs array
newContent += 'export const allNewSpecs: PuzzleSpec[] = [\n';
newContent += '    ch1, ch2, ch3, ch4, ch5,\n';
for (const { level } of puzzles) {
    newContent += `    ch${level},\n`;
}
newContent += '];\n\n';

// Chapter groups (5 per group)
const allLevelNums = [1, 2, 3, 4, 5, ...puzzles.map(p => p.level)];
newContent += 'export const newChapterGroups = [\n';
for (let i = 0; i < allLevelNums.length; i += 5) {
    const chunk = allLevelNums.slice(i, i + 5);
    const groupIdx = Math.floor(i / 5) % GROUP_TITLES.length;
    const g = GROUP_TITLES[groupIdx];
    const ids = chunk.map(n => `'ch${n}'`).join(', ');
    newContent += `    { title: '${g.title}', subtitle: '${g.subtitle}', puzzleIds: [${ids}] },\n`;
}
newContent += '];\n';

fs.writeFileSync(outPath, newContent, 'utf8');
console.log(`\nWrote ${outPath}`);
console.log(`Total levels: ${5 + puzzles.length}`);
