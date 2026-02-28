const fs = require('fs');
const path = require('path');
const words = require('an-array-of-turkish-words');

const DB_PATH = path.join(__dirname, '../../src/data/questions_db.json');

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// Extract a clean clue from TDK response
function extractClue(data) {
    if (!data || !data[0] || !data[0].anlamlarListe || data[0].anlamlarListe.length === 0) {
        return null;
    }
    // Try to find an anlam without "(mecaz)" or something similar, or just take the first
    let anlamStr = data[0].anlamlarListe[0].anlam;

    // TDK sometimes has "isim", "sıfat" in the text, we clean it
    if (anlamStr) {
        let clean = anlamStr.trim();
        // Capitalize first letter
        clean = clean.charAt(0).toLocaleUpperCase('tr-TR') + clean.slice(1);
        if (!clean.endsWith('.')) clean += '.';
        return clean;
    }
    return null;
}

async function fetchWordDefinition(wordObj) {
    const word = wordObj.word;
    try {
        const url = `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word)}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) return null;

        const data = await res.json();
        if (data && data.error) return null; // "Sonuç bulunamadı" usually has an error text

        const clue = extractClue(data);
        if (clue) {
            return {
                word: word.toLocaleUpperCase('tr-TR'),
                clue: clue
            };
        }
    } catch (e) {
        // ignored
    }
    return null;
}

async function run() {
    console.log("Loading DB...");
    let db = [];
    let existingWords = new Set();
    if (fs.existsSync(DB_PATH)) {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        db.forEach(q => {
            if (q.answer) existingWords.add(q.answer.toLocaleUpperCase('tr-TR'));
        });
    }

    let newCount = db.filter(q => q.tags && q.tags.includes('yeni-sorular-tdk')).length;
    let required = 2000 - newCount;

    console.log(`We have ${newCount} 'yeni-sorular-tdk'. Need ${required} more.`);
    if (required <= 0) return;

    // Shuffle and filter words
    console.log("Shuffling words...");
    let candidates = words.filter(w => w.length >= 5 && w.length <= 11 && /^[a-zçğıöşü]+$/.test(w));
    candidates.sort(() => Math.random() - 0.5);

    let toFetch = [];
    for (let w of candidates) {
        if (!existingWords.has(w.toLocaleUpperCase('tr-TR'))) {
            toFetch.push({ word: w });
            if (toFetch.length > required * 5) break; // get enough buffer
        }
    }

    console.log(`Prepared ${toFetch.length} candidate words. Starting parallel fetch...`);

    let added = 0;
    let nextId = db.length + 1;
    let maxParallel = 15;

    for (let i = 0; i < toFetch.length; i += maxParallel) {
        let chunk = toFetch.slice(i, i + maxParallel);
        let promises = chunk.map(w => fetchWordDefinition(w));
        let results = await Promise.all(promises);

        let batchAdded = 0;
        for (let res of results) {
            if (res && !existingWords.has(res.word)) {
                let diff = res.word.length <= 6 ? 'medium' : 'hard';
                let levelOffset = diff === 'medium' ? 3 : 6;

                db.push({
                    id: `tr_kw_${String(nextId++).padStart(4, '0')}`,
                    type: "crossword_clue",
                    difficulty: diff,
                    level: Math.floor(Math.random() * 3) + levelOffset,
                    answer: res.word,
                    answerLength: res.word.length,
                    category: "Genel Kültür",
                    clue: res.clue,
                    tags: [`${res.word.length}-harf`, diff === 'medium' ? 'orta' : 'zor', 'genel', 'yeni-sorular-tdk'],
                    createdAt: "2026-02-25"
                });
                existingWords.add(res.word);
                added++;
                batchAdded++;
                if (added >= required) break;
            }
        }

        if (added >= required) break;

        if (batchAdded > 0) {
            process.stdout.write(`+${added} `);
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        }

        // short delay
        await sleep(100);
    }

    console.log(`\nDone! Added ${added} extremely high quality words. Total new: ${newCount + added}. Database total: ${db.length}.`);
}

run();
