const fs = require('fs');
const path = require('path');
const wordsArray = require('an-array-of-turkish-words');

const DB_PATH = path.join(__dirname, '../../src/data/questions_db.json');

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function cleanExtract(text) {
    if (!text) return null;
    let sentence = text.split('.')[0] + '.';
    sentence = sentence.replace(/\s+/g, ' ').trim();

    if (sentence.includes('doğumlu')) return null;
    if (sentence.includes('köyüdür')) return null;
    if (sentence.includes('ilçesine')) return null;
    if (sentence.includes('mahallesidir')) return null;
    if (sentence.includes('beldesidir')) return null;
    if (sentence.includes('filmdir')) return null;
    if (sentence.includes('şarkısıy')) return null;

    if (sentence.length < 15 || sentence.length > 200) return null;
    return sentence;
}

async function run() {
    console.log("Loading DB...");
    let db = [];
    let existingWords = new Set();
    if (fs.existsSync(DB_PATH)) {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        db.forEach(q => q.answer && existingWords.add(q.answer.toLocaleUpperCase('tr-TR')));
    }

    let startTotal = db.length;
    let required = 10000 - startTotal;

    console.log(`Current DB size: ${startTotal}. Need ${required} more to hit exactly 10,000.`);
    if (required <= 0) return;

    let candidates = wordsArray.filter(w => w.length >= 5 && w.length <= 11 && /^[a-zçğıöşü]+$/.test(w));
    candidates.sort(() => Math.random() - 0.5);

    let toFetch = [];
    for (let w of candidates) {
        if (!existingWords.has(w.toLocaleUpperCase('tr-TR'))) {
            toFetch.push(w);
            if (toFetch.length > required * 15) break;
        }
    }

    console.log(`Prepared ${toFetch.length} un-used words. Fetching...`);

    let added = 0;
    let nextId = startTotal + 1;
    let maxParallel = 50; // 20 titles per request

    for (let i = 0; i < toFetch.length; i += maxParallel) {
        if (added >= required) break;

        let chunk = toFetch.slice(i, i + maxParallel);
        let url = `https://tr.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&format=json&titles=${encodeURIComponent(chunk.join('|'))}`;

        let controller = new AbortController();
        let timeout = setTimeout(() => controller.abort(), 6000);

        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Node/Trivia)' }, signal: controller.signal });
            clearTimeout(timeout);

            const data = await res.json();

            let batchAdded = 0;
            if (data && data.query && data.query.pages) {
                for (let key in data.query.pages) {
                    if (key === "-1") continue;

                    let page = data.query.pages[key];
                    let title = page.title.toLocaleUpperCase('tr-TR');

                    if (!existingWords.has(title)) {
                        let clue = cleanExtract(page.extract);
                        if (clue && clue.length > 10) {
                            let diff = title.length <= 6 ? 'medium' : 'hard';
                            let levelOffset = diff === 'medium' ? 3 : 6;

                            clue = clue.charAt(0).toLocaleUpperCase('tr-TR') + clue.slice(1);

                            db.push({
                                id: `tr_kw_${String(nextId++).padStart(4, '0')}`,
                                type: "crossword_clue",
                                difficulty: diff,
                                level: Math.floor(Math.random() * 3) + levelOffset,
                                answer: title,
                                answerLength: title.length,
                                category: "Genel Kültür",
                                clue: clue,
                                tags: [`${title.length}-harf`, diff === 'medium' ? 'orta' : 'zor', 'genel', 'yeni-sorular-tdk'],
                                createdAt: "2026-02-25"
                            });
                            existingWords.add(title);
                            added++;
                            batchAdded++;
                            if (added >= required) break;
                        }
                    }
                }
            }
            if (batchAdded > 0) {
                process.stdout.write(`+${batchAdded} `);
                fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
            } else {
                process.stdout.write(`. `);
            }

        } catch (e) {
            clearTimeout(timeout);
            process.stdout.write(`E `);
        }
    }

    console.log(`\nDone! DB total questions is now exactly ${db.length}. Added ${added} items.`);
}

run();
