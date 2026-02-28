#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  CROSSWORD QUALITY PIPELINE — Full Automatic QA + Reporting
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Processes questions_db.json (all clues), scores each 0–100, and
 *  outputs 5 files:
 *
 *    reports/clean_questions.json      — ACCEPT (score ≥ 80)
 *    reports/fix_queue.json            — FIX    (score 50–79, with rewritten_clue)
 *    reports/rejected_questions.json   — REJECT (score < 50, with reasons)
 *    reports/quality_report.csv        — Full CSV with all columns
 *    reports/quality_summary.json      — Statistics + top reasons
 *
 *  Usage:
 *    node scripts/crosswordQualityPipeline.js
 *    node scripts/crosswordQualityPipeline.js --apply   (writes cleaned DB)
 */

const fs = require('fs');
const path = require('path');

const { scoreClue } = require('./clueQuality');
const { cleanClue, rewriteClue } = require('./clueRewrite');

// ═══════════════════════════════════════════════════════════════════════
//  PATHS
// ═══════════════════════════════════════════════════════════════════════

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'questions_db.json');
const REPORT_DIR = path.join(__dirname, '..', 'reports');

const CLEAN_PATH = path.join(REPORT_DIR, 'clean_questions.json');
const FIX_PATH = path.join(REPORT_DIR, 'fix_queue.json');
const REJECT_PATH = path.join(REPORT_DIR, 'rejected_questions.json');
const CSV_PATH = path.join(REPORT_DIR, 'quality_report.csv');
const SUMMARY_PATH = path.join(REPORT_DIR, 'quality_summary.json');

// ═══════════════════════════════════════════════════════════════════════
//  CSV HELPERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Escape a value for CSV: wrap in quotes, double any internal quotes.
 */
function csvEsc(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    // Always quote to be safe with commas, newlines, quotes
    return '"' + str.replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
}

// ═══════════════════════════════════════════════════════════════════════
//  STATS HELPERS
// ═══════════════════════════════════════════════════════════════════════

function percentile(sortedArr, p) {
    if (sortedArr.length === 0) return 0;
    const idx = Math.ceil(sortedArr.length * p / 100) - 1;
    return sortedArr[Math.max(0, Math.min(idx, sortedArr.length - 1))];
}

function median(sortedArr) {
    if (sortedArr.length === 0) return 0;
    const mid = Math.floor(sortedArr.length / 2);
    if (sortedArr.length % 2 === 0) {
        return (sortedArr[mid - 1] + sortedArr[mid]) / 2;
    }
    return sortedArr[mid];
}

function mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ═══════════════════════════════════════════════════════════════════════
//  REASON COUNTER — groups similar reasons for aggregation
// ═══════════════════════════════════════════════════════════════════════

function countReasons(items) {
    const counts = {};
    for (const item of items) {
        for (const r of item.reasons) {
            // Standardize dynamic reasons for grouping
            const key = r
                .replace(/\(\d+ words.*?\)/, '(N words)')                  // "Overly long clue (28 words)" → "(N words)"
                .replace(/"[^"]{0,60}"/, '"…"')                            // Quoted content
                .replace(/Offensive content:.*/, 'Offensive content')       // Collapse profanity details
                .replace(/\+\d+\s+/, '')                                    // Strip bonus prefix "+5 "
                .replace(/Rewrite changes:.*/, 'Rewrite changes applied'); // Collapse rewrite details
            counts[key] = (counts[key] || 0) + 1;
        }
    }
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([reason, count]) => ({ reason, count }));
}

// ═══════════════════════════════════════════════════════════════════════
//  PIPELINE
// ═══════════════════════════════════════════════════════════════════════

function main() {
    const applyMode = process.argv.includes('--apply');
    const ts = new Date().toISOString();

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  🔍 CROSSWORD QUALITY PIPELINE`);
    console.log(`  Mode: ${applyMode ? '⚡ APPLY' : '📋 REPORT ONLY'}`);
    console.log(`  Time: ${ts}`);
    console.log(`${'═'.repeat(60)}\n`);

    // ── Load DB ──
    if (!fs.existsSync(DB_PATH)) {
        console.error(`❌ Database not found: ${DB_PATH}`);
        process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    console.log(`📊 Loaded ${rawData.length} clues from questions_db.json\n`);

    // ── Process each clue ──
    const acceptList = [];
    const fixList = [];
    const rejectList = [];
    const allRecords = []; // For CSV
    const allScores = [];  // For stats

    for (const entry of rawData) {
        const { answer, clue } = entry;

        // 1. Clean the clue (remove meta noise)
        const cleaned = cleanClue(clue);

        // 2. Score the cleaned clue
        const { quality_score, decision, reasons, flags } = scoreClue({
            answer,
            clue,
            difficulty: entry.difficulty,
        });

        // 3. Build output record
        const record = {
            id: entry.id,
            answer: answer,
            clue_original: clue,
            quality_score,
            decision,
            reasons: [...reasons],
            cleaned_clue: cleaned,
            rewritten_clue: '',
            // Diagnostic flags
            clue_word_count: flags.clue_word_count,
            answer_length: (answer || '').length,
            contains_meta: flags.contains_meta,
            contains_answer_leak: flags.contains_answer_leak,
            profanity_hit: flags.profanity_hit,
            ambiguity_hit: flags.ambiguity_hit,
        };

        // 4. For FIX items, attempt a rewrite
        if (decision === 'FIX') {
            const { rewritten_clue, changes } = rewriteClue({ answer, clue: cleaned });
            record.rewritten_clue = rewritten_clue;
            if (changes.length > 0) {
                record.reasons.push(`Rewrite changes: ${changes.join(', ')}`);
            }
        }

        // 5. Sort into buckets
        switch (decision) {
            case 'ACCEPT': acceptList.push(record); break;
            case 'FIX': fixList.push(record); break;
            case 'REJECT': rejectList.push(record); break;
        }

        allRecords.push(record);
        allScores.push(quality_score);
    }

    // ═══════════════════════════════════════════════════════════
    //  STATISTICS
    // ═══════════════════════════════════════════════════════════

    const total = rawData.length;
    const pct = (n) => (n / total * 100).toFixed(1);

    const sorted = [...allScores].sort((a, b) => a - b);
    const scoreStats = {
        min: sorted[0] || 0,
        max: sorted[sorted.length - 1] || 0,
        mean: Math.round(mean(sorted) * 100) / 100,
        median: median(sorted),
        p10: percentile(sorted, 10),
        p25: percentile(sorted, 25),
        p75: percentile(sorted, 75),
        p90: percentile(sorted, 90),
    };

    // Decision by 10-point buckets
    const decisionByBucket = {};
    for (let i = 0; i <= 9; i++) {
        const lo = i * 10;
        const hi = i === 9 ? 100 : lo + 9;
        const label = `${lo}-${hi === 100 ? 100 : lo + 9}`;
        decisionByBucket[label] = 0;
    }
    for (const s of allScores) {
        const bucket = Math.min(9, Math.floor(s / 10));
        const lo = bucket * 10;
        const hi = bucket === 9 ? 100 : lo + 9;
        const label = `${lo}-${hi}`;
        decisionByBucket[label]++;
    }

    // Top reasons
    const topRejectReasons = countReasons(rejectList).slice(0, 15);
    const topFixReasons = countReasons(fixList).slice(0, 15);

    // ═══════════════════════════════════════════════════════════
    //  CONSOLE REPORT
    // ═══════════════════════════════════════════════════════════

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║           📋 QUALITY REPORT SUMMARY              ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  ✅ ACCEPT:  ${String(acceptList.length).padStart(6)}  (${pct(acceptList.length).padStart(5)}%)           ║`);
    console.log(`║  🔧 FIX:     ${String(fixList.length).padStart(6)}  (${pct(fixList.length).padStart(5)}%)           ║`);
    console.log(`║  ❌ REJECT:  ${String(rejectList.length).padStart(6)}  (${pct(rejectList.length).padStart(5)}%)           ║`);
    console.log(`║  📊 TOTAL:   ${String(total).padStart(6)}                        ║`);
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  📈 Mean Score:   ${String(scoreStats.mean).padStart(6)}                      ║`);
    console.log(`║  📈 Median Score: ${String(scoreStats.median).padStart(6)}                      ║`);
    console.log(`║  📈 Min / Max:    ${String(scoreStats.min).padStart(3)} / ${String(scoreStats.max).padStart(3)}                   ║`);
    console.log(`║  📈 P10 / P25:    ${String(scoreStats.p10).padStart(3)} / ${String(scoreStats.p25).padStart(3)}                   ║`);
    console.log(`║  📈 P75 / P90:    ${String(scoreStats.p75).padStart(3)} / ${String(scoreStats.p90).padStart(3)}                   ║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log();

    // ── Score distribution (10-point buckets) ──
    console.log('📈 Score Distribution (10-point buckets):');
    for (const [label, count] of Object.entries(decisionByBucket)) {
        const barLen = Math.ceil(count / total * 80);
        const bar = '█'.repeat(barLen);
        console.log(`  ${label.padStart(6)}: ${String(count).padStart(5)}  ${bar}`);
    }
    console.log();

    // ── Top 10 rejection reasons ──
    console.log('🚫 Top 10 REJECT reasons:');
    console.log('─'.repeat(60));
    for (const { reason, count } of topRejectReasons.slice(0, 10)) {
        console.log(`  ${String(count).padStart(5)}  ${reason}`);
    }
    console.log();

    // ── Top 10 fix reasons ──
    console.log('🔧 Top 10 FIX reasons:');
    console.log('─'.repeat(60));
    for (const { reason, count } of topFixReasons.slice(0, 10)) {
        console.log(`  ${String(count).padStart(5)}  ${reason}`);
    }
    console.log();

    // ── REJECT samples ──
    console.log('❌ REJECT SAMPLES (first 10):');
    console.log('─'.repeat(80));
    for (const item of rejectList.slice(0, 10)) {
        console.log(`  [${item.id}] score=${item.quality_score} answer="${item.answer}"`);
        console.log(`    clue: "${item.clue_original.substring(0, 80)}${item.clue_original.length > 80 ? '...' : ''}"`);
        console.log(`    reasons: ${item.reasons.slice(0, 3).join(' | ')}`);
        console.log();
    }

    // ── FIX samples ──
    console.log('🔧 FIX SAMPLES (first 10):');
    console.log('─'.repeat(80));
    for (const item of fixList.slice(0, 10)) {
        console.log(`  [${item.id}] score=${item.quality_score} answer="${item.answer}"`);
        console.log(`    OLD:  "${item.clue_original.substring(0, 70)}${item.clue_original.length > 70 ? '...' : ''}"`);
        console.log(`    NEW:  "${item.rewritten_clue.substring(0, 70)}${item.rewritten_clue.length > 70 ? '...' : ''}"`);
        console.log();
    }

    // ═══════════════════════════════════════════════════════════
    //  WRITE OUTPUT FILES
    // ═══════════════════════════════════════════════════════════

    if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

    // 1. Clean questions (ACCEPT)
    fs.writeFileSync(CLEAN_PATH, JSON.stringify(acceptList, null, 2));
    console.log(`📄 ${acceptList.length} ACCEPT → ${CLEAN_PATH}`);

    // 2. Fix queue (FIX)
    fs.writeFileSync(FIX_PATH, JSON.stringify(fixList, null, 2));
    console.log(`📄 ${fixList.length} FIX    → ${FIX_PATH}`);

    // 3. Rejected (REJECT)
    fs.writeFileSync(REJECT_PATH, JSON.stringify(rejectList, null, 2));
    console.log(`📄 ${rejectList.length} REJECT → ${REJECT_PATH}`);

    // 4. quality_report.csv
    const CSV_HEADER = [
        'id', 'answer', 'clue_original', 'cleaned_clue', 'rewritten_clue',
        'quality_score', 'decision', 'reasons',
        'clue_word_count', 'answer_length',
        'contains_meta', 'contains_answer_leak', 'profanity_hit', 'ambiguity_hit',
    ].join(',');

    const csvRows = allRecords.map(r => [
        csvEsc(r.id),
        csvEsc(r.answer),
        csvEsc(r.clue_original),
        csvEsc(r.cleaned_clue),
        csvEsc(r.rewritten_clue),
        r.quality_score,
        csvEsc(r.decision),
        csvEsc(r.reasons.join('; ')),
        r.clue_word_count,
        r.answer_length,
        r.contains_meta,
        r.contains_answer_leak,
        r.profanity_hit,
        r.ambiguity_hit,
    ].join(','));

    fs.writeFileSync(CSV_PATH, CSV_HEADER + '\n' + csvRows.join('\n') + '\n');
    console.log(`📄 CSV   → ${CSV_PATH}`);

    // 5. quality_summary.json
    const summary = {
        timestamp: ts,
        total,
        accepted: acceptList.length,
        fix: fixList.length,
        rejected: rejectList.length,
        score_stats: scoreStats,
        decision_by_bucket: decisionByBucket,
        top_rejection_reasons: topRejectReasons,
        top_fix_reasons: topFixReasons,
    };
    fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
    console.log(`📄 Summary → ${SUMMARY_PATH}`);
    console.log();

    // ═══════════════════════════════════════════════════════════
    //  APPLY MODE — update questions_db.json
    // ═══════════════════════════════════════════════════════════

    if (applyMode) {
        console.log('⚡ APPLY MODE — Updating questions_db.json...\n');

        // Backup first
        const backupName = DB_PATH.replace('.json', `_backup_qa_${Date.now()}.json`);
        fs.copyFileSync(DB_PATH, backupName);
        console.log(`  💾 Backup: ${path.basename(backupName)}`);

        // Build new DB: ACCEPT items (original data) + FIX items (with cleaned clues)
        const acceptIds = new Set(acceptList.map(a => a.id));
        const fixIds = new Set(fixList.map(f => f.id));
        const fixMap = {};
        for (const f of fixList) fixMap[f.id] = f.rewritten_clue;

        const newDB = rawData.filter(entry => {
            return acceptIds.has(entry.id) || fixIds.has(entry.id);
        }).map(entry => {
            if (fixIds.has(entry.id) && fixMap[entry.id]) {
                return { ...entry, clue: fixMap[entry.id] };
            }
            // For ACCEPT items, still clean meta noise
            const cleaned = cleanClue(entry.clue);
            if (cleaned !== entry.clue) {
                return { ...entry, clue: cleaned };
            }
            return entry;
        });

        fs.writeFileSync(DB_PATH, JSON.stringify(newDB, null, 2));
        console.log(`  ✅ New DB: ${newDB.length} clues (removed ${rawData.length - newDB.length} rejected)`);
        console.log(`  📊 Removed: ${rejectList.length} rejected clues`);
        console.log(`  🔧 Rewrote: ${fixList.length} clue texts\n`);
    } else {
        console.log('ℹ️  REPORT ONLY — no changes to DB. Use --apply to update.\n');
    }

    console.log(`${'═'.repeat(60)}`);
    console.log('  ✅ PIPELINE COMPLETE');
    console.log(`${'═'.repeat(60)}\n`);
}

main();
