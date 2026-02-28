const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../src/data/questions_db.json');

function run() {
    let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

    let originalCount = db.length;
    console.log(`Initial DB count: ${originalCount}`);

    // Remove 'yeni-sorular-tdk' from items that weren't genuinely created by the python scripts today
    // Python scripts specifically added 'createdAt': '2026-02-25'
    let restored = 0;
    for (let q of db) {
        if (q.tags && q.tags.includes('yeni-sorular-tdk')) {
            if (q.createdAt !== '2026-02-25') {
                q.tags = q.tags.filter(t => t !== 'yeni-sorular-tdk');
                // Clean up medium/hard if we added them just now
                // Actually safer to leave medium/hard tags, just remove yeni-sorular-tdk
                restored++;
            }
        }
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

    let remainingNew = db.filter(q => q.tags && q.tags.includes('yeni-sorular-tdk')).length;
    console.log(`Restored ${restored} questions.`);
    console.log(`Remaining genuinely new 'Yeni Sorular' count: ${remainingNew}`);

    // Check total DB size:
    console.log(`Total questions in DB: ${db.length}`);
}

run();
