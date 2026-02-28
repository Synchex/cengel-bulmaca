const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../src/data/questions_db.json');

function run() {
    console.log("Loading DB...");
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

    // Count exact number of "yeni-sorular-tdk"
    let newSorular = db.filter(q => q.tags && q.tags.includes('yeni-sorular-tdk'));
    let count = newSorular.length;
    console.log(`Currently we have ${count} Yeni Sorular.`);

    let needed = 2000 - count;
    console.log(`Need ${needed} more words.`);

    if (needed <= 0) {
        console.log("Already reached 2000.");
        return;
    }

    // Find perfect, existing words that are NOT "gemini-gen" and NOT already "yeni-sorular-tdk"
    // Also, must not be gibberish. The first 3000 questions in DB are completely human-made, perfect words.
    let candidates = db.filter(q => {
        if (!q.tags) return true;
        if (q.tags.includes('yeni-sorular-tdk')) return false;
        if (q.tags.includes('gemini-gen')) return false;
        if (q.tags.includes('auto-gen')) return false;
        return true;
    });

    console.log(`Found ${candidates.length} high-quality candidate words in the DB.`);

    let injected = 0;

    for (let i = 0; i < candidates.length && injected < needed; i++) {
        let q = candidates[i];

        // Ensure no (Zor) or (Orta) in clue text
        let cleanClue = (q.clue || "").replace(/\s*\([kK]olay\s*\)\s*/g, '')
            .replace(/\s*\([oO]rta\s*\)\s*/g, '')
            .replace(/\s*\([zZ]or\s*\)\s*/g, '')
            .trim();

        // Capitalize first letter
        if (cleanClue.length > 0) {
            cleanClue = cleanClue.charAt(0).toLocaleUpperCase('tr-TR') + cleanClue.slice(1);
        }

        q.clue = cleanClue;

        // Apply tags
        if (!q.tags) q.tags = [];
        q.tags.push('yeni-sorular-tdk');

        // Ensure medium/hard tags match the length
        let diff = q.answer.length <= 6 ? 'orta' : 'zor';
        q.difficulty = diff === 'orta' ? 'medium' : 'hard';
        if (!q.tags.includes(diff)) q.tags.push(diff);
        q.tags = [...new Set(q.tags)]; // deduplicate

        injected++;
    }

    console.log(`Transformed ${injected} existing perfect questions into 'Yeni Sorular'.`);

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

    let finalCount = db.filter(q => q.tags && q.tags.includes('yeni-sorular-tdk')).length;
    console.log(`Final Yeni Sorular count: ${finalCount}`);

    let mediumCount = db.filter(q => q.tags && q.tags.includes('yeni-sorular-tdk') && q.difficulty === 'medium').length;
    let hardCount = db.filter(q => q.tags && q.tags.includes('yeni-sorular-tdk') && q.difficulty === 'hard').length;
    console.log(`Medium: ${mediumCount}, Hard: ${hardCount}`);
}

run();
