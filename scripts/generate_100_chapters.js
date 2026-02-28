const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../src/data/questions_db.json');
const OUT_PATH = path.join(__dirname, '../src/data/regenerated_chapters_100.json');

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
console.log(`DB: ${db.length} items`);

// ── STRICT quality filter ──
const CLUE_BLACKLIST = [
    '(zor)', '(orta)', '(kolay)', 'level', 'cevap', 'bulmaca',
    'harf sayısı', 'harf)', 'hrf)', 'CLUE=', 'Clue=', 'clue=',
    'şu anlamlara gelebilir', 'aşağıdaki anlamlara', 'kastedilmiş olabilir',
    'sözlüğümüzde yer alan', 'günlük hayat dağarcığımıza', 'Bölüm Sonu',
    'Bilinmeyen veya eski Türkçe', 'Sözlük anlamı:', '2. paket',
    'Şifreli ipucu', 'kelimesinin kökeni', 'mecaz kullanımı', 'seviye)',
    'Osmanlıca veya eski Türkçe', 'edebi bir sözcük', 'kökenli edebi',
    '🔥', '✨', 'undefined', 'null',
    'vs vs', 'vb vb', 'filan falan', 'vb vs falan',
    'bs ns', 'cb fb', 'ds ns', 'gf bd', 'cf ns',
    'bs ms', 'hd vd', 'nd vf', 'bd fb', 'bs fs', 'md nb',
    'vf k cs', 'cb bc', 'nb ms', 'mf bs', 'nd vd',
    'hb vg', 'cf cg', 'fb b', 'vs bc', 'fd sb',
    'falan', 'filandır', 'falandır', 'vs tır', 'vs dır',
    'fasa makamdı', 'adıdır markasıdır',
    'eylemcisidir kişi', 'edimidir', 'teşebbüsüdür',
    'hissiyatrıdır', 'cesaretliliğihissiyat',
];

function isClueClean(clue) {
    if (!clue || typeof clue !== 'string') return false;
    const lower = clue.toLowerCase();
    for (const bl of CLUE_BLACKLIST) {
        if (lower.includes(bl.toLowerCase())) return false;
    }
    if (clue.length < 12 || clue.length > 150) return false;

    const words = clue.split(/\s+/);
    if (words.length < 2 || words.length > 16) return false;

    // Gibberish: too many 1-2 letter words
    const tinyWords = words.filter(w => w.length <= 2).length;
    if (tinyWords > words.length * 0.5) return false;

    // Check for random letter sequences (gibberish)
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(clue)) return false;

    return true;
}

function isAnswerValid(answer) {
    if (!answer || typeof answer !== 'string') return false;
    if (answer.length < 3 || answer.length > 12) return false;
    if (/[0-9_\-().]/.test(answer)) return false;
    if (!/^[A-ZÇĞIİÖŞÜ]+$/i.test(answer.toLocaleUpperCase('tr-TR'))) return false;
    // Filter out known nonsense words
    if (/^[A-Z]{3,4}$/.test(answer) && !isCommonShortWord(answer)) return false;
    return true;
}

// Common 3-4 letter Turkish words
const COMMON_SHORT = new Set([
    'BAŞ', 'TOZ', 'HAK', 'DÜZ', 'GÖK', 'DIŞ', 'GÜL', 'KUŞ', 'YAZ', 'YÜZ',
    'GÜN', 'GÖL', 'KAR', 'DAĞ', 'TAŞ', 'SAĞ', 'SOL', 'YOL', 'KOL', 'GÖZ',
    'BUZ', 'CAN', 'DİL', 'DİŞ', 'DUŞ', 'FİL', 'GEÇ', 'GİT', 'HAL', 'İPE',
    'KAŞ', 'KUL', 'MİL', 'NEM', 'OCA', 'ÖRS', 'SAÇ', 'SIR', 'TAM', 'TUZ',
    'VAN', 'YAĞ', 'ZAR', 'ACI', 'ANA', 'ARA', 'ARI', 'ARŞ', 'ATA', 'AYI',
    'BEL', 'BEN', 'BEY', 'BİR', 'BOŞ', 'BOY', 'BUĞ', 'ÇAĞ', 'ÇAM', 'ÇAP',
    'ÇAY', 'ÇİM', 'DAL', 'DAM', 'DAR', 'DEN', 'DEV', 'DİK', 'DİP', 'DOĞ',
    'DON', 'DUR', 'DUY', 'EDİ', 'EKİ', 'ELİ', 'GEL', 'GİR', 'GÜÇ', 'HAM',
    'HEM', 'HER', 'HIZ', 'HOŞ', 'İLK', 'İYİ', 'KAP', 'KAT', 'KAY', 'KEL',
    'KIŞ', 'KIZ', 'KOÇ', 'KOK', 'KOR', 'KUP', 'KUR', 'KÜL', 'MAL', 'MAT',
    'MEY', 'NAR', 'NEF', 'ORT', 'OYA', 'ÖRÜ', 'PEK', 'PUL', 'RAZ', 'RUH',
    'SAF', 'SAN', 'SAT', 'SEL', 'SES', 'SİS', 'SOM', 'SOR', 'SOY', 'SÖZ',
    'SUÇ', 'SUN', 'SÜR', 'SÜT', 'ŞAH', 'ŞAP', 'TAS', 'TAT', 'TEK', 'TEN',
    'TER', 'TIR', 'TIP', 'TOR', 'TUR', 'TÜR', 'UÇA', 'ULU', 'UNU', 'UYU',
    'VAR', 'YAN', 'YAR', 'YAS', 'YAT', 'YEM', 'YEN', 'YER', 'YIL',
]);

function isCommonShortWord(answer) {
    return COMMON_SHORT.has(answer.toLocaleUpperCase('tr-TR'));
}

function clueLeaksAnswer(clue, answer) {
    if (!clue || !answer) return true;
    const clueL = clue.toLocaleLowerCase('tr-TR');
    const ansL = answer.toLocaleLowerCase('tr-TR');
    if (clueL.includes(ansL)) return true;
    return false;
}

// ── Filter ──
let pool = db.filter(q => {
    if (!isAnswerValid(q.answer)) return false;
    if (!isClueClean(q.clue)) return false;
    if (clueLeaksAnswer(q.clue, q.answer)) return false;
    return true;
});

const seen = new Set();
pool = pool.filter(q => {
    const key = q.answer.toLocaleUpperCase('tr-TR');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
});

console.log(`Clean pool: ${pool.length}`);

// ── Score calculation ──
// We want scores to genuinely span 5-95
function calcScore(q) {
    let score = 10;

    // Answer length: huge factor (3→0, 12→54)
    score += (q.answer.length - 3) * 6;

    // Difficulty from DB
    if (q.difficulty === 'hard') score += 20;
    else if (q.difficulty === 'medium') score += 10;

    // Clue complexity
    const words = q.clue.split(/\s+/).length;
    score += Math.min(words, 14) * 1.5;

    // Random jitter
    score += Math.random() * 10 - 5;

    return Math.max(5, Math.min(95, Math.round(score)));
}

pool.forEach(q => { q._score = calcScore(q); });
pool.sort((a, b) => a._score - b._score);

// ── Build 100 chapters ──
const TOTAL = 100, PER = 30, NEEDED = TOTAL * PER;
console.log(`Need: ${NEEDED}. Have: ${pool.length}. ${pool.length >= NEEDED ? '✓' : '✗'}`);

const selected = pool.slice(0, Math.min(pool.length, NEEDED));

function tag(s) {
    if (s < 30) return 'easy';
    if (s < 50) return 'medium';
    if (s < 70) return 'hard';
    return 'expert';
}

const output = { regenerated_from_chapter: 5, chapters: [] };

for (let c = 0; c < TOTAL; c++) {
    const ch = c + 5;
    const bandL = Math.round(15 + (c / 99) * 70);
    const bandH = bandL + 12;
    const items = selected.slice(c * PER, c * PER + PER).map(q => ({
        answer: q.answer,
        clue: q.clue.replace(/\s+/g, ' ').trim(),
        difficulty_tag: tag(q._score),
        difficulty_score: q._score
    }));
    output.chapters.push({ chapter: ch, target_band: `${bandL}-${bandH}`, items });
}

// ── Validate ──
let tot = 0, dup = 0, leak = 0;
const final = new Set();
for (const ch of output.chapters) {
    for (const it of ch.items) {
        tot++;
        if (final.has(it.answer)) dup++;
        final.add(it.answer);
        if (it.clue.toLocaleLowerCase('tr-TR').includes(it.answer.toLocaleLowerCase('tr-TR'))) leak++;
    }
}

const scores = output.chapters.map(ch => ch.items.map(i => i.difficulty_score));
const flat = scores.flat();

console.log(`\n=== REPORT ===`);
console.log(`Chapters: ${output.chapters.length} | Items: ${tot} | Unique: ${final.size}`);
console.log(`Dupes: ${dup} | Leaks: ${leak}`);
console.log(`Score range: ${Math.min(...flat)} – ${Math.max(...flat)}`);
console.log(`Ch5 avg: ${Math.round(scores[0].reduce((a, b) => a + b, 0) / 30)}`);
console.log(`Ch54 avg: ${Math.round(scores[49].reduce((a, b) => a + b, 0) / 30)}`);
console.log(`Ch104 avg: ${Math.round(scores[99].reduce((a, b) => a + b, 0) / 30)}`);
console.log(`Sample Ch5: ${output.chapters[0].items.slice(0, 3).map(i => `${i.answer}(${i.difficulty_score})`).join(', ')}`);
console.log(`Sample Ch104: ${output.chapters[99].items.slice(0, 3).map(i => `${i.answer}(${i.difficulty_score})`).join(', ')}`);

fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
console.log(`\nSaved: ${OUT_PATH} (${(fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(2)} MB)`);
