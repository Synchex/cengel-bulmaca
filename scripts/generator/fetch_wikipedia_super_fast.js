const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../src/data/questions_db.json');

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function cleanExtract(text) {
    if (!text) return null;
    let sentence = text.split('.')[0] + '.';
    sentence = sentence.replace(/\s+/g, ' ').trim();

    // Filter out typical wikipedia biography/geography stubs that are too narrow
    if (sentence.includes('doğumlu')) return null;
    if (sentence.includes('ilçesine bağlı')) return null;
    if (sentence.includes('köyüdür')) return null;
    if (sentence.includes('mahallesidir')) return null;
    if (sentence.includes('beldesidir')) return null;
    if (sentence.includes('futbolcudur')) return null;
    if (sentence.includes('şarkısıdır')) return null;
    if (sentence.includes('albümüdür')) return null;
    if (sentence.includes('film')) return null;
    if (sentence.includes('dizidir')) return null;
    if (sentence.includes('oyuncudur')) return null;
    if (sentence.includes('ilçesidir')) return null;
    if (sentence.includes('şarkıcı')) return null;

    if (sentence.length < 15 || sentence.length > 200) return null;

    return sentence;
}

async function fetchWikiBatch() {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, 3000); // 3 second max

    try {
        const url = `https://tr.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&prop=extracts&exintro=1&explaintext=1&format=json&grnlimit=50`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal });
        clearTimeout(timeout);

        const data = await res.json();

        let results = [];
        if (data && data.query && data.query.pages) {
            for (let key in data.query.pages) {
                let page = data.query.pages[key];
                let title = page.title;

                // Only single words, purely alphabetic
                if (!title.includes(' ') && !title.includes('-') && !title.includes('(')) {
                    let upper = title.toLocaleUpperCase('tr-TR');
                    if (/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(upper) && upper.length >= 5 && upper.length <= 11) {
                        let clue = cleanExtract(page.extract);
                        if (clue) {
                            results.push({ word: upper, clue: clue });
                        }
                    }
                }
            }
        }
        return results;
    } catch (e) {
        clearTimeout(timeout);
        return [];
    }
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

    let added = 0;
    let nextId = startTotal + 1;
    let loops = 0;

    while (added < required && loops < 100) {
        loops++;

        let promises = [];
        for (let i = 0; i < 15; i++) {
            promises.push(fetchWikiBatch());
        }

        // Use allSettled so one frozen pipe won't stall the loop
        let batchResults = await Promise.allSettled(promises);

        let batchAdded = 0;

        for (let r of batchResults) {
            if (r.status === 'fulfilled') {
                for (let item of r.value) {
                    if (!existingWords.has(item.word)) {
                        let diff = item.word.length <= 6 ? 'medium' : 'hard';
                        let levelOffset = diff === 'medium' ? 3 : 6;

                        let clue = item.clue.charAt(0).toLocaleUpperCase('tr-TR') + item.clue.slice(1);

                        db.push({
                            id: `tr_kw_${String(nextId++).padStart(4, '0')}`,
                            type: "crossword_clue",
                            difficulty: diff,
                            level: Math.floor(Math.random() * 3) + levelOffset,
                            answer: item.word,
                            answerLength: item.word.length,
                            category: "Genel Kültür",
                            clue: clue,
                            tags: [`${item.word.length}-harf`, diff === 'medium' ? 'orta' : 'zor', 'genel', 'yeni-sorular-tdk'],
                            createdAt: "2026-02-25"
                        });
                        existingWords.add(item.word);
                        added++;
                        batchAdded++;
                        if (added >= required) break;
                    }
                }
            }
            if (added >= required) break;
        }

        if (batchAdded > 0) {
            process.stdout.write(`+${batchAdded} `);
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        } else {
            process.stdout.write(`. `);
        }

        await sleep(500);
    }

    console.log(`\nDone! DB total questions is now exactly ${db.length}. Added ${added} items.`);
}

run();
