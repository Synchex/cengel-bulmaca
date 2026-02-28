const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../src/data/questions_db.json');

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// Clean up wiktionary extract to get a concise clue
function cleanExtract(text) {
    if (!text) return null;
    let lines = text.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (line.length > 10 && !line.startsWith('===') && !line.startsWith('==')) {
            // Remove wiktionary noise like (ad) or (isim)
            line = line.replace(/^\([^)]+\)\s*/, '');
            line = line.split('.')[0] + '.';
            if (line.includes('harfi') || line.includes('okunuşu')) return null;
            return line.trim();
        }
    }
    return null;
}

async function fetchWiktionaryBatch() {
    try {
        const url = `https://tr.wiktionary.org/w/api.php?action=query&generator=random&grnnamespace=0&prop=extracts&exintro=1&explaintext=1&format=json&grnlimit=500`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = await response.json();

        let results = [];
        if (data && data.query && data.query.pages) {
            for (const key in data.query.pages) {
                const page = data.query.pages[key];
                const title = page.title.toLocaleUpperCase('tr-TR');

                // Only alphabet chars, 5 to 11 length
                if (/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(title) && title.length >= 5 && title.length <= 11) {
                    const clue = cleanExtract(page.extract);
                    if (clue && clue.length > 5) {
                        results.push({ word: title, clue: clue });
                    }
                }
            }
        }
        return results;
    } catch (e) {
        return [];
    }
}

async function run() {
    console.log("Loading existing DB...");
    let db = [];
    let existingWords = new Set();
    if (fs.existsSync(DB_PATH)) {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        db.forEach(q => q.answer && existingWords.add(q.answer.toLocaleUpperCase('tr-TR')));
    }

    console.log(`Loaded ${db.length} existing clues.`);

    // Count how many new we already injected
    let newInjected = db.filter(q => q.tags && q.tags.includes('yeni-sorular-tdk')).length;
    let target = 2000;
    let required = target - newInjected;

    if (required <= 0) {
        console.log("Already reached 2000 target.");
        return;
    }

    console.log(`Need ${required} more words to reach 2000 new limit. Fetching in batches of 500 from Wiktionary...`);

    let added = 0;
    let nextId = db.length + 1;
    let loops = 0;

    while (added < required && loops < 50) {
        loops++;
        console.log(`Fetching batch ${loops}...`);
        const batch = await fetchWiktionaryBatch();
        let batchAdded = 0;

        for (const item of batch) {
            if (!existingWords.has(item.word)) {

                const isMedium = item.word.length >= 5 && item.word.length <= 6;
                const difficulty = isMedium ? 'medium' : 'hard';
                const levelOffset = difficulty === 'medium' ? 3 : 6;

                db.push({
                    id: `tr_kw_${String(nextId++).padStart(4, '0')}`,
                    type: "crossword_clue",
                    difficulty: difficulty,
                    level: Math.floor(Math.random() * 3) + levelOffset,
                    answer: item.word,
                    answerLength: item.word.length,
                    category: "Genel Kültür",
                    clue: item.clue,
                    tags: [`${item.word.length}-harf`, difficulty === 'medium' ? 'orta' : 'zor', 'genel', 'yeni-sorular-tdk'],
                    createdAt: new Date().toISOString().split('T')[0]
                });

                existingWords.add(item.word);
                added++;
                batchAdded++;
                if (added >= required) break;
            }
        }

        console.log(`Added ${batchAdded} words in this batch. Total added so far: ${added}/${required}`);

        if (batchAdded > 0) {
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
        }
        await sleep(500);
    }

    console.log(`\nSuccess! Reached ${added} new words. Total questions now: ${db.length}.`);
}
run();
