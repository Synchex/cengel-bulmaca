#!/usr/bin/env node
/**
 * Strip difficulty markers from clue_text.
 * Does NOT delete any clue or level — only cleans the text.
 *
 * Usage:
 *   node scripts/stripDifficultyTags.js --dry-run
 *   node scripts/stripDifficultyTags.js --apply
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'questions_db.json');

// All difficulty marker patterns to strip
const PATTERNS = [
    /^\s*\(Kolay\)\s*/i,
    /^\s*\(Orta\)\s*/i,
    /^\s*\(Zor\)\s*/i,
    /^\s*\[Kolay\]\s*/i,
    /^\s*\[Orta\]\s*/i,
    /^\s*\[Zor\]\s*/i,
    /^\s*Kolay:\s*/i,
    /^\s*Orta:\s*/i,
    /^\s*Zor:\s*/i,
    // Mid-text occurrences
    /\s*\(Kolay\)\s*/gi,
    /\s*\(Orta\)\s*/gi,
    /\s*\(Zor\)\s*/gi,
    /\s*\[Kolay\]\s*/gi,
    /\s*\[Orta\]\s*/gi,
    /\s*\[Zor\]\s*/gi,
];

function cleanClue(text) {
    let cleaned = text;
    for (const p of PATTERNS) {
        cleaned = cleaned.replace(p, ' ');
    }
    // Collapse spaces, trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    // Capitalize first letter
    if (cleaned.length > 0 && cleaned[0] !== "'" && cleaned[0] !== '"' && cleaned[0] !== '«') {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return cleaned;
}

function main() {
    const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
    const clues = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

    const changes = [];
    for (const c of clues) {
        const newClue = cleanClue(c.clue);
        if (newClue !== c.clue) {
            changes.push({ id: c.id, old: c.clue, new: newClue });
        }
    }

    console.log(`\n🏷️  DIFFICULTY TAG STRIPPER — ${mode.toUpperCase()}`);
    console.log(`${'═'.repeat(50)}`);
    console.log(`  Total clues: ${clues.length}`);
    console.log(`  Affected:    ${changes.length}`);
    console.log();

    // Show samples
    console.log('📋 CHANGES (first 20):');
    console.log('─'.repeat(80));
    changes.slice(0, 20).forEach(c => {
        console.log(`  [${c.id}]`);
        console.log(`    OLD: "${c.old}"`);
        console.log(`    NEW: "${c.new}"`);
    });
    console.log();

    if (mode === 'apply') {
        const backup = DB_PATH.replace('.json', `_backup_tags_${Date.now()}.json`);
        fs.copyFileSync(DB_PATH, backup);
        console.log(`  💾 Backup: ${path.basename(backup)}`);

        for (const c of clues) {
            const cleaned = cleanClue(c.clue);
            if (cleaned !== c.clue) c.clue = cleaned;
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(clues, null, 2));
        console.log(`  ✅ Updated ${changes.length} clues. DB written.\n`);
    } else {
        console.log('  ℹ️  DRY RUN — use --apply to execute.\n');
    }
}

main();
