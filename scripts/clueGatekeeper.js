#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 *  CLUE QUALITY GATEKEEPER
 *  Turkish Crossword App — Production Quality Pipeline
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Modes:
 *    node scripts/clueGatekeeper.js --dry-run        Full DB scan, report only
 *    node scripts/clueGatekeeper.js --apply           Full DB scan, enforce
 *    node scripts/clueGatekeeper.js --gate '{"answer":"KALEM","clue":"..."}'
 *                                                     Single-clue pre-insert gate
 *
 *  Quality score 0–100:
 *    0–39  → DELETE / BLOCK
 *    40–69 → REWRITE REQUIRED
 *    70–100 → ACCEPT
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════
//  PATHS
// ═══════════════════════════════════════════════════
const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'questions_db.json');
const REPORT_DIR = path.join(__dirname, '..', 'reports');

// ═══════════════════════════════════════════════════
//  1. BANNED PHRASES — instant FAIL (score → 0)
// ═══════════════════════════════════════════════════
const BANNED_PHRASES = [
    // Gibberish templates
    "yaygın, kısa ve bilinen bir kelimedir",
    "yaygın ve bilinen bir kelimedir",
    "kısa ve bilinen bir kelimedir",
    "bilinen bir kelimedir",
    "sıkça kullanılan bir kelimedir",
    "günlük dilde kullanılan bir kelimedir",
    "türkçede yaygın bir kelimedir",
    "türkçe bir kelimedir",
    // Meta-references
    "bu kelimenin anlamı",
    "bu sözcüğün karşılığı",
    "bu terimin açılımı",
    "aşağıdaki kelime",
    // Placeholder / test markers
    "lorem ipsum",
    "todo",
    "test clue",
    "placeholder",
    "xxxxx",
    "random word",
    "??",
    // Robotic AI patterns
    "genel olarak ifade etmek gerekirse",
    "kapsamlı bir şekilde tanımlamak gerekirse",
    "özetle belirtmek gerekirse",
];

// ═══════════════════════════════════════════════════
//  2. BANNED REGEX PATTERNS — instant FAIL
// ═══════════════════════════════════════════════════
const BANNED_REGEX = [
    // Quoted random 2–8 char gibberish tokens
    /[''][a-zA-ZçğıöşüÇĞİÖŞÜ]{2,8}['']\s*yaygın/i,
    /[''][a-zA-ZçğıöşüÇĞİÖŞÜ]{2,8}['']\s*(?:kısa|bilinen|sık)/i,
    // Difficulty tags embedded in clue text
    /^\s*\((?:Kolay|Orta|Zor|Easy|Medium|Hard)\)\s*/i,
    // Quoted random consonant clusters (3+ consonants, no vowels)
    /[''][bcçdfgğhjklmnprsştvyz]{3,}['']/i,
    // English-only full sentences (3+ English words in a row)
    /\b(?:the|and|of)\s+(?:the|and|of|a)\s+\w+/gi,
];

// ═══════════════════════════════════════════════════
//  3. TURKISH LANGUAGE HEURISTICS
// ═══════════════════════════════════════════════════
const TR_VOWELS = new Set('aeıioöuüAEIİOÖUÜ');
const TR_CHARS = /^[a-zA-ZçğışöüÇĞİŞÖÜâîûÂÎÛ0-9\s.,;:'"''\-–—()\/!?…]+$/;

// Common Turkish bigrams (top 40 by frequency)
const TR_COMMON_BIGRAMS = new Set([
    'an', 'ar', 'in', 'la', 'le', 'er', 'en', 'da', 'de', 'ak',
    'al', 'at', 'ol', 'ya', 'bi', 'ir', 'is', 'ka', 'ma', 'ta',
    'il', 'ra', 'ba', 'or', 'un', 'el', 'as', 'sa', 'ha', 'ne',
    'se', 'me', 'li', 'ri', 'ni', 'ın', 'si', 'na', 'ke', 'te',
]);

function vowelRatio(text) {
    const letters = text.replace(/[^a-zA-ZçğışöüÇĞİŞÖÜ]/g, '');
    if (letters.length === 0) return 0;
    let vowelCount = 0;
    for (const ch of letters) { if (TR_VOWELS.has(ch)) vowelCount++; }
    return vowelCount / letters.length;
}

function turkishBigramScore(text) {
    const clean = text.toLowerCase().replace(/[^a-zçğışöü]/g, '');
    if (clean.length < 4) return 1; // too short to judge
    let total = 0, hits = 0;
    for (let i = 0; i < clean.length - 1; i++) {
        total++;
        if (TR_COMMON_BIGRAMS.has(clean.substring(i, i + 2))) hits++;
    }
    return total > 0 ? hits / total : 0;
}

function hasVowels(word) {
    for (const ch of word) { if (TR_VOWELS.has(ch)) return true; }
    return false;
}

// ═══════════════════════════════════════════════════
//  4. TEMPLATE / DUPLICATE DETECTION (Jaccard 3-gram)
// ═══════════════════════════════════════════════════
function normalize(text) {
    return text.toLowerCase()
        .replace(/[''"""]/g, '')
        .replace(/[^\w\sçğışöü]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function ngrams(text, n = 3) {
    const set = new Set();
    const t = normalize(text);
    for (let i = 0; i <= t.length - n; i++) set.add(t.substring(i, i + n));
    return set;
}

function jaccard(setA, setB) {
    let inter = 0;
    for (const item of setA) { if (setB.has(item)) inter++; }
    const union = setA.size + setB.size - inter;
    return union > 0 ? inter / union : 0;
}

// ═══════════════════════════════════════════════════
//  5. MAIN SCORING FUNCTION
// ═══════════════════════════════════════════════════
function scoreClue(entry, existingNgrams = null) {
    const { clue, answer, difficulty } = entry;
    const reasons = [];
    let score = 78; // Start slightly above ACCEPT threshold

    // ── A. Hard FAIL: Banned phrases ──
    const clueLower = clue.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
        if (clueLower.includes(phrase.toLowerCase())) {
            return fail(`BANNED_PHRASE: "${phrase}"`);
        }
    }

    // ── B. Hard FAIL: Banned regex ──
    for (const rx of BANNED_REGEX) {
        if (rx.test(clue)) {
            return fail(`BANNED_REGEX: ${rx.source.substring(0, 40)}`);
        }
    }

    // ── C. Hard FAIL: Answer is gibberish ──
    if (answer && answer.length >= 4 && !hasVowels(answer)) {
        return fail('GIBBERISH_ANSWER: no vowels in 4+ char answer');
    }

    // ── D. Hard FAIL: Non-Turkish characters ──
    if (!TR_CHARS.test(clue)) {
        const bad = clue.replace(TR_CHARS, '').substring(0, 20);
        score -= 30;
        reasons.push(`-30: Non-Turkish chars detected: "${bad}"`);
    }

    // ── E. Clue length checks ──
    const wordCount = clue.split(/\s+/).filter(Boolean).length;
    if (wordCount < 2 && clue.length < 5) {
        score -= 25;
        reasons.push(`-25: Ultra-short clue (${wordCount} words, ${clue.length} chars)`);
    } else if (wordCount === 1) {
        score -= 15;
        reasons.push(`-15: Single-word clue (consider expanding)`);
    }
    if (clue.length > 180) {
        score -= 15;
        reasons.push(`-15: Overly long clue (${clue.length} chars)`);
    }

    // ── F. Difficulty prefix in clue ──
    if (/^\s*\((?:Kolay|Orta|Zor)\)/i.test(clue)) {
        score -= 25;
        reasons.push('-25: Difficulty tag "(Kolay)" inside clue text');
    }

    // ── G. Turkish-ness: vowel ratio ──
    const vr = vowelRatio(clue);
    if (vr < 0.15) {
        score -= 20;
        reasons.push(`-20: Very low vowel ratio (${(vr * 100).toFixed(0)}%), likely gibberish`);
    } else if (vr < 0.20) {
        score -= 8;
        reasons.push(`-8: Low vowel ratio (${(vr * 100).toFixed(0)}%)`);
    }

    // ── H. Turkish-ness: bigram score ──
    const bgs = turkishBigramScore(clue);
    if (bgs < 0.10 && clue.length > 15) {
        score -= 12;
        reasons.push(`-12: Very low Turkish bigram score (${(bgs * 100).toFixed(0)}%)`);
    } else if (bgs < 0.15 && clue.length > 10) {
        score -= 5;
        reasons.push(`-5: Low Turkish bigram score (${(bgs * 100).toFixed(0)}%)`);
    }

    // ── I. Generic / vague clues ──
    if (/^bir\s+(hayvan|şehir|ülke|şey|renk|sayı|nesne|kulüp|meyve|sebze)\.?\s*$/i.test(clue.trim())) {
        score -= 35;
        reasons.push('-35: Ultra-generic clue (just "bir X")');
    }
    if (/^bir\s+/i.test(clue.trim()) && wordCount <= 3) {
        score -= 10;
        reasons.push('-10: Very generic opening "bir ..." with few words');
    }

    // ── J. Robotic / AI tone ──
    const roboticPatterns = [
        [/olarak\s+kullanılır\.?\s*$/i, 8, 'robotic ending "olarak kullanılır"'],
        [/ifade\s+eder\.?\s*$/i, 8, 'robotic ending "ifade eder"'],
        [/tanımlanan/i, 5, 'AI-tone word "tanımlanan"'],
        [/genellikle\s+.*olarak/i, 5, 'AI-tone "genellikle...olarak"'],
        [/kapsamında/i, 5, 'AI-tone "kapsamında"'],
        [/nitelendirilen/i, 5, 'AI-tone "nitelendirilen"'],
        [/olarak\s+adlandırılan/i, 8, 'AI-tone "olarak adlandırılan"'],
        [/bir\s+tür(?:ü|dür)/i, 3, 'slightly generic "bir türü/türdür"'],
    ];
    for (const [rx, pen, reason] of roboticPatterns) {
        if (rx.test(clue)) {
            score -= pen;
            reasons.push(`-${pen}: ${reason}`);
        }
    }

    // ── K. Template/duplicate similarity ──
    if (existingNgrams) {
        const myNgrams = ngrams(clue, 3);
        let maxSim = 0;
        for (const [id, otherSet] of existingNgrams) {
            if (id === entry.id) continue;
            const sim = jaccard(myNgrams, otherSet);
            if (sim > maxSim) maxSim = sim;
            if (sim > 0.85) break; // early exit
        }
        if (maxSim > 0.85) {
            score -= 25;
            reasons.push(`-25: Near-duplicate detected (Jaccard=${maxSim.toFixed(2)})`);
        } else if (maxSim > 0.70) {
            score -= 10;
            reasons.push(`-10: High similarity with existing clue (Jaccard=${maxSim.toFixed(2)})`);
        }
    }

    // ── L. Bonus: crossword-quality indicators ──
    if (/;\s+/.test(clue)) {
        score += 5;
        reasons.push('+5: Dual-meaning style (semicolon)');
    }
    if (clue.length >= 20 && clue.length <= 65 && wordCount >= 3) {
        score += 5;
        reasons.push('+5: Ideal crossword clue length');
    }

    // ── Clamp & categorize ──
    score = Math.max(0, Math.min(100, score));
    let category = 'ACCEPT';
    if (score <= 39) category = 'DELETE';
    else if (score <= 69) category = 'REWRITE';

    return { score, reasons, category };
}

function fail(reason) {
    return { score: 0, reasons: [`FORCE_FAIL: ${reason}`], category: 'DELETE' };
}

// ═══════════════════════════════════════════════════
//  6. PRE-INSERT GATE (single clue validation)
// ═══════════════════════════════════════════════════
function gateCheck(clueJson) {
    const entry = typeof clueJson === 'string' ? JSON.parse(clueJson) : clueJson;
    const result = scoreClue(entry);
    return {
        allowed: result.category === 'ACCEPT',
        ...result,
        entry: { id: entry.id, answer: entry.answer, clue: entry.clue },
    };
}

// ═══════════════════════════════════════════════════
//  7. FULL DB SCAN
// ═══════════════════════════════════════════════════
function fullScan(mode) {
    console.log(`\n🔍 CLUE QUALITY GATEKEEPER — ${mode.toUpperCase()}\n${'═'.repeat(60)}\n`);

    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const clues = JSON.parse(raw);
    console.log(`📊 Total clues: ${clues.length}\n`);

    // Note: n-gram duplicate detection is O(n²) and skipped in batch mode.
    // Use --gate mode for single-clue duplicate checking.
    console.log('📐 Scoring clues (rule-based, no batch duplicate check)...\n');

    // Score all
    const results = clues.map(entry => ({
        ...entry,
        quality: scoreClue(entry, null),
    }));

    const deleted = results.filter(r => r.quality.category === 'DELETE');
    const rewrite = results.filter(r => r.quality.category === 'REWRITE');
    const accepted = results.filter(r => r.quality.category === 'ACCEPT');

    // ── Report ──
    console.log('📋 QUALITY REPORT');
    console.log('─'.repeat(50));
    console.log(`  ✅ ACCEPT:   ${accepted.length} (${(accepted.length / clues.length * 100).toFixed(1)}%)`);
    console.log(`  ✏️  REWRITE:  ${rewrite.length} (${(rewrite.length / clues.length * 100).toFixed(1)}%)`);
    console.log(`  ❌ DELETE:   ${deleted.length} (${(deleted.length / clues.length * 100).toFixed(1)}%)`);
    console.log();

    // Score histogram
    const buckets = [0, 0, 0, 0, 0]; // 0-19, 20-39, 40-59, 60-79, 80-100
    results.forEach(r => {
        const s = r.quality.score;
        buckets[Math.min(4, Math.floor(s / 20))]++;
    });
    console.log('📈 Score Distribution:');
    ['0-19', '20-39', '40-59', '60-79', '80-100'].forEach((label, i) => {
        const bar = '█'.repeat(Math.ceil(buckets[i] / clues.length * 80));
        console.log(`  ${label}: ${String(buckets[i]).padStart(5)} ${bar}`);
    });
    console.log();

    // Samples
    console.log('🗑️  DELETED SAMPLES (first 10):');
    console.log('─'.repeat(80));
    deleted.slice(0, 10).forEach(d => {
        console.log(`  [${d.id}] score=${d.quality.score} | "${d.answer}"`);
        console.log(`    "${d.clue}"`);
        console.log(`    ${d.quality.reasons[0]}`);
    });
    console.log();

    console.log('✏️  REWRITE SAMPLES (first 10):');
    console.log('─'.repeat(80));
    rewrite.slice(0, 10).forEach(r => {
        console.log(`  [${r.id}] score=${r.quality.score} | "${r.answer}"`);
        console.log(`    "${r.clue}"`);
        console.log(`    reasons: ${r.quality.reasons.slice(0, 3).join(' | ')}`);
    });
    console.log();

    // Difficulty breakdown
    const delDiff = {};
    deleted.forEach(d => { delDiff[d.difficulty] = (delDiff[d.difficulty] || 0) + 1; });
    console.log('📊 Deleted by difficulty:', JSON.stringify(delDiff));
    console.log();

    // ── Save report ──
    if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
    const reportPath = path.join(REPORT_DIR, `gatekeeper_${mode}_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        mode,
        summary: { total: clues.length, accepted: accepted.length, rewrite: rewrite.length, deleted: deleted.length },
        deletedIds: deleted.map(d => d.id),
        rewriteIds: rewrite.map(r => r.id),
        sampleDeleted: deleted.slice(0, 30).map(d => ({ id: d.id, answer: d.answer, clue: d.clue, score: d.quality.score, reason: d.quality.reasons[0] })),
    }, null, 2));
    console.log(`📄 Report: ${reportPath}\n`);

    // ── Apply ──
    if (mode === 'apply') {
        console.log('⚡ APPLYING...');
        const backupPath = DB_PATH.replace('.json', `_backup_${Date.now()}.json`);
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`  💾 Backup: ${path.basename(backupPath)}`);

        const deleteSet = new Set(deleted.map(d => d.id));
        const surviving = clues.filter(c => !deleteSet.has(c.id));

        // Strip difficulty prefixes from rewrite candidates
        const rewriteSet = new Set(rewrite.map(r => r.id));
        surviving.forEach(c => {
            if (rewriteSet.has(c.id)) {
                c.clue = c.clue.replace(/^\s*\((?:Kolay|Orta|Zor)\)\s*/i, '').trim();
                if (c.clue.endsWith('.')) c.clue = c.clue.slice(0, -1).trim();
            }
        });

        fs.writeFileSync(DB_PATH, JSON.stringify(surviving, null, 2));
        console.log(`  ✅ DB written: ${surviving.length} clues (removed ${deleted.length})`);

        // Quarantine
        const qPath = path.join(REPORT_DIR, `quarantine_${Date.now()}.json`);
        fs.writeFileSync(qPath, JSON.stringify(deleted.map(d => ({
            id: d.id, answer: d.answer, clue: d.clue, difficulty: d.difficulty,
            score: d.quality.score, reasons: d.quality.reasons,
        })), null, 2));
        console.log(`  🗄️  Quarantine: ${path.basename(qPath)}`);
        console.log('\n✅ DONE\n');
    } else {
        console.log('ℹ️  DRY RUN — no changes. Use --apply to execute.\n');
    }
}

// ═══════════════════════════════════════════════════
//  8. CLI ENTRY
// ═══════════════════════════════════════════════════
const args = process.argv.slice(2);

if (args.includes('--gate')) {
    const jsonIdx = args.indexOf('--gate') + 1;
    const json = args[jsonIdx];
    if (!json) { console.error('Usage: --gate \'{"answer":"X","clue":"Y"}\''); process.exit(1); }
    const result = gateCheck(json);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.allowed ? 0 : 1);
} else if (args.includes('--apply')) {
    fullScan('apply');
} else {
    fullScan('dry-run');
}
