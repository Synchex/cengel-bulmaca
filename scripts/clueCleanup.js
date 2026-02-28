#!/usr/bin/env node
/**
 * Clue Quality Cleanup Pipeline
 * ──────────────────────────────────────────────────
 * Scans all clues, scores their quality 0–100,
 * deletes bad ones, quarantines impacted levels,
 * and generates audit reports.
 *
 * Usage:
 *   node scripts/clueCleanup.js --dry-run
 *   node scripts/clueCleanup.js --apply
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════
const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'questions_db.json');
const REPORT_DIR = path.join(__dirname, '..', 'reports');
const THRESHOLDS = { DELETE: 39, REWRITE: 69 }; // 0-39 delete, 40-69 rewrite, 70+ keep

// ═══════════════════════════════════════════════════
//  FORCE-DELETE PATTERNS (instant 0 score)
// ═══════════════════════════════════════════════════
const FORCE_DELETE_PATTERNS = [
    // Gibberish template: quoted random tokens + "bir kelimedir"
    /[''][a-zA-ZçğıöşüÇĞİÖŞÜ]{2,8}['']\s*yaygın/i,
    // "bir kelimedir" template ending
    /yaygın,\s*kısa\s*ve\s*bilinen\s*bir\s*kelimedir/i,
    // Quoted gibberish tokens (2-6 consonant-heavy chars)
    /[''][bcdfghjklmnpqrstvwxyz]{3,}['']/i,
    // Pure nonsense answers (no vowels, 3+ chars)
    /^[BCDFGĞHJKLMNPRSŞTVYZbcdfgğhjklmnprsştvyz]{4,}$/,
];

// ═══════════════════════════════════════════════════
//  PENALTY PATTERNS (score deductions)
// ═══════════════════════════════════════════════════
const PENALTY_RULES = [
    // "(Kolay)" prefix → -25
    { pattern: /^\(Kolay\)/i, penalty: 25, reason: 'Has (Kolay) difficulty prefix' },
    { pattern: /^\(Orta\)/i, penalty: 25, reason: 'Has (Orta) difficulty prefix' },
    { pattern: /^\(Zor\)/i, penalty: 25, reason: 'Has (Zor) difficulty prefix' },

    // Template markers
    { pattern: /bir kelimedir/i, penalty: 40, reason: 'Template: "bir kelimedir"' },
    { pattern: /bir\s+(?:terim|kavram|sözcük)dür/i, penalty: 20, reason: 'Template: "bir terimdir/kavramdır"' },

    // Ultra-generic clues
    { pattern: /^bir\s+(hayvan|şehir|ülke|şey|renk|sayı|nesne|kulüp)\.?$/i, penalty: 35, reason: 'Ultra-generic: just "bir X"' },

    // Robotic/AI tone markers
    { pattern: /olarak\s+kullanılır\.\s*$/i, penalty: 10, reason: 'Robotic ending: "olarak kullanılır"' },
    { pattern: /ifade\s+eder\.\s*$/i, penalty: 10, reason: 'Robotic ending: "ifade eder"' },
    { pattern: /anlamına\s+gelir\.\s*$/i, penalty: 8, reason: 'Slightly robotic: "anlamına gelir"' },

    // Too short (< 10 chars after stripping prefix)
    { test: (clue) => stripPrefix(clue).length < 10, penalty: 20, reason: 'Clue too short (<10 chars)' },

    // Too long (> 120 chars)
    { test: (clue) => clue.length > 120, penalty: 10, reason: 'Clue too long (>120 chars)' },

    // Parenthetical explanations that feel AI-written
    { pattern: /\(.*kısaltma.*\)/i, penalty: 5, reason: 'Parenthetical meta-explanation' },
    { pattern: /\(.*kökenli.*\)/i, penalty: 5, reason: 'Parenthetical etymology note' },
];

// ═══════════════════════════════════════════════════
//  BONUS PATTERNS (score boosts)
// ═══════════════════════════════════════════════════
const BONUS_RULES = [
    // Semicolon-separated dual meanings (classic crossword style)
    { pattern: /;\s+/, bonus: 5, reason: 'Dual-meaning style (semicolon)' },
    // Concise (20-60 chars) = ideal crossword clue length
    { test: (clue) => { const l = clue.length; return l >= 20 && l <= 60; }, bonus: 5, reason: 'Ideal clue length' },
];

// ═══════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════
function stripPrefix(clue) {
    return clue.replace(/^\((?:Kolay|Orta|Zor)\)\s*/i, '').trim();
}

function hasVowels(word) {
    return /[aeıioöuüAEIİOÖUÜ]/.test(word);
}

function scoreClue(entry) {
    const { clue, answer, difficulty } = entry;
    const reasons = [];
    let score = 75; // Start at "decent"

    // ── Force-delete check ──
    for (const pat of FORCE_DELETE_PATTERNS) {
        if (pat.test(clue) || pat.test(answer)) {
            return { score: 0, reasons: ['FORCE_DELETE: matches gibberish/template pattern'], category: 'DELETE' };
        }
    }

    // ── Answer validation ──
    if (!answer || answer.length < 2) {
        score -= 30;
        reasons.push('Answer too short or missing');
    }
    if (answer && !hasVowels(answer) && answer.length >= 4) {
        return { score: 0, reasons: ['FORCE_DELETE: answer has no vowels (gibberish)'], category: 'DELETE' };
    }

    // ── Penalty checks ──
    for (const rule of PENALTY_RULES) {
        let matches = false;
        if (rule.pattern) matches = rule.pattern.test(clue);
        if (rule.test) matches = rule.test(clue);
        if (matches) {
            score -= rule.penalty;
            reasons.push(`-${rule.penalty}: ${rule.reason}`);
        }
    }

    // ── Bonus checks ──
    const stripped = stripPrefix(clue);
    for (const rule of BONUS_RULES) {
        let matches = false;
        if (rule.pattern) matches = rule.pattern.test(stripped);
        if (rule.test) matches = rule.test(stripped);
        if (matches) {
            score += rule.bonus;
            reasons.push(`+${rule.bonus}: ${rule.reason}`);
        }
    }

    // ── Clamp ──
    score = Math.max(0, Math.min(100, score));

    // ── Categorize ──
    let category = 'KEEP';
    if (score <= THRESHOLDS.DELETE) category = 'DELETE';
    else if (score <= THRESHOLDS.REWRITE) category = 'REWRITE';

    return { score, reasons, category };
}

// ═══════════════════════════════════════════════════
//  REWRITE SUGGESTIONS
// ═══════════════════════════════════════════════════
function suggestRewrite(entry) {
    let newClue = entry.clue;
    let changes = [];

    // Strip difficulty prefix
    if (/^\((?:Kolay|Orta|Zor)\)\s*/i.test(newClue)) {
        newClue = newClue.replace(/^\((?:Kolay|Orta|Zor)\)\s*/i, '');
        changes.push('Removed difficulty prefix');
    }

    // Remove trailing period if present
    if (newClue.endsWith('.')) {
        newClue = newClue.slice(0, -1);
        changes.push('Removed trailing period');
    }

    // Trim excessive whitespace
    newClue = newClue.replace(/\s+/g, ' ').trim();

    return {
        clue_id: entry.id,
        old_clue: entry.clue,
        new_clue: newClue,
        changes,
        confidence: changes.length > 0 ? 70 : 50,
    };
}

// ═══════════════════════════════════════════════════
//  MAIN PIPELINE
// ═══════════════════════════════════════════════════
function main() {
    const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
    console.log(`\n🔍 CLUE QUALITY CLEANUP PIPELINE — ${mode.toUpperCase()} MODE\n${'═'.repeat(60)}\n`);

    // Load data
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const clues = JSON.parse(raw);
    console.log(`📊 Total clues loaded: ${clues.length}\n`);

    // Score all clues
    const results = clues.map((entry) => ({
        ...entry,
        quality: scoreClue(entry),
    }));

    // Categorize
    const deleted = results.filter(r => r.quality.category === 'DELETE');
    const rewrite = results.filter(r => r.quality.category === 'REWRITE');
    const kept = results.filter(r => r.quality.category === 'KEEP');

    // ── Summary Report ──
    console.log('📋 QUALITY REPORT');
    console.log('─'.repeat(50));
    console.log(`  ✅ KEEP:    ${kept.length} (${(kept.length / clues.length * 100).toFixed(1)}%)`);
    console.log(`  ✏️  REWRITE: ${rewrite.length} (${(rewrite.length / clues.length * 100).toFixed(1)}%)`);
    console.log(`  ❌ DELETE:  ${deleted.length} (${(deleted.length / clues.length * 100).toFixed(1)}%)`);
    console.log(`  📊 Total:   ${clues.length}`);
    console.log();

    // ── Score distribution ──
    const buckets = { '0-19': 0, '20-39': 0, '40-59': 0, '60-79': 0, '80-100': 0 };
    results.forEach(r => {
        const s = r.quality.score;
        if (s < 20) buckets['0-19']++;
        else if (s < 40) buckets['20-39']++;
        else if (s < 60) buckets['40-59']++;
        else if (s < 80) buckets['60-79']++;
        else buckets['80-100']++;
    });
    console.log('📈 Score Distribution:');
    for (const [range, count] of Object.entries(buckets)) {
        const bar = '█'.repeat(Math.ceil(count / clues.length * 100));
        console.log(`  ${range}: ${String(count).padStart(5)} ${bar}`);
    }
    console.log();

    // ── Deleted clue samples ──
    console.log('🗑️  SAMPLE DELETED CLUES (first 15):');
    console.log('─'.repeat(80));
    deleted.slice(0, 15).forEach(d => {
        console.log(`  [${d.id}] score=${d.quality.score} answer="${d.answer}"`);
        console.log(`    clue: "${d.clue}"`);
        console.log(`    reason: ${d.quality.reasons[0]}`);
        console.log();
    });

    // ── Rewrite samples ──
    console.log('✏️  SAMPLE REWRITE CANDIDATES (first 10):');
    console.log('─'.repeat(80));
    rewrite.slice(0, 10).forEach(r => {
        const suggestion = suggestRewrite(r);
        console.log(`  [${r.id}] score=${r.quality.score}`);
        console.log(`    OLD: "${suggestion.old_clue}"`);
        console.log(`    NEW: "${suggestion.new_clue}"`);
        console.log(`    changes: ${suggestion.changes.join(', ') || 'none'}`);
        console.log();
    });

    // ── Difficulty breakdown of deleted ──
    const delByDiff = {};
    deleted.forEach(d => {
        delByDiff[d.difficulty] = (delByDiff[d.difficulty] || 0) + 1;
    });
    console.log('📊 Deleted by difficulty:');
    for (const [diff, count] of Object.entries(delByDiff)) {
        console.log(`  ${diff}: ${count}`);
    }
    console.log();

    // ── Save report ──
    if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

    const reportPath = path.join(REPORT_DIR, `clue_audit_${Date.now()}.json`);
    const report = {
        timestamp: new Date().toISOString(),
        mode,
        summary: {
            total: clues.length,
            kept: kept.length,
            rewrite: rewrite.length,
            deleted: deleted.length,
            deletedPercent: (deleted.length / clues.length * 100).toFixed(1) + '%',
        },
        scoreDistribution: buckets,
        deletedByDifficulty: delByDiff,
        deletedIds: deleted.map(d => d.id),
        rewriteIds: rewrite.map(r => r.id),
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Audit report saved: ${reportPath}\n`);

    // ═══════════════════════════════════════════════
    //  APPLY MODE
    // ═══════════════════════════════════════════════
    if (mode === 'apply') {
        console.log('⚡ APPLYING CHANGES...\n');

        // 1. Create backup
        const backupPath = DB_PATH.replace('.json', `_backup_${Date.now()}.json`);
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`  💾 Backup: ${backupPath}`);

        // 2. Keep only KEEP + REWRITE clues
        const deletedIds = new Set(deleted.map(d => d.id));
        const surviving = clues.filter(c => !deletedIds.has(c.id));

        // 3. Apply rewrites to REWRITE candidates (strip prefixes etc.)
        const rewriteIds = new Set(rewrite.map(r => r.id));
        surviving.forEach(c => {
            if (rewriteIds.has(c.id)) {
                const suggestion = suggestRewrite(c);
                c.clue = suggestion.new_clue;
            }
        });

        // 4. Write cleaned database
        fs.writeFileSync(DB_PATH, JSON.stringify(surviving, null, 2));
        console.log(`  ✅ Cleaned DB written: ${surviving.length} clues (removed ${deleted.length})`);

        // 5. Save quarantine file (deleted clues for rollback)
        const quarantinePath = path.join(REPORT_DIR, `quarantined_clues_${Date.now()}.json`);
        fs.writeFileSync(quarantinePath, JSON.stringify(deleted.map(d => ({
            id: d.id,
            answer: d.answer,
            clue: d.clue,
            difficulty: d.difficulty,
            score: d.quality.score,
            reasons: d.quality.reasons,
        })), null, 2));
        console.log(`  🗄️  Quarantine: ${quarantinePath}`);

        console.log('\n✅ APPLY COMPLETE\n');
    } else {
        console.log('ℹ️  DRY RUN — no changes made. Use --apply to execute.\n');
    }
}

main();
