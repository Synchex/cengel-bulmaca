const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../src/data/questions_db.json');

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// Clean wikitext formatting: remove links [[foo|bar]] -> bar, [[foo]] -> foo, remove ''' bold, '' italic, {{templates}}
function cleanWikitext(text) {
    if (!text) return "";
    let clean = text;
    // Remove templates like {{tr-isim}} or {{cinsiyet}}
    clean = clean.replace(/\{\{[^}]+\}\}/g, '');
    // Replace piped links [[link|text]] with text
    clean = clean.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1');
    // Replace simple links [[text]] with text
    clean = clean.replace(/\[\[([^\]]+)\]\]/g, '$1');
    // Remove italics and bold
    clean = clean.replace(/''+/g, '');
    // Clean up multiple spaces
    clean = clean.replace(/\s+/g, ' ').trim();
    // Capitalize first letter
    if (clean.length > 0) {
        clean = clean.charAt(0).toLocaleUpperCase('tr-TR') + clean.slice(1);
        if (!clean.endsWith('.')) clean += '.';
    }
    return clean;
}

function parseWikitextClue(content) {
    // Find the first line that starts with "# " which holds the primary definition
    const lines = content.split('\n');
    for (let line of lines) {
        line = line.trim();
        // A definition line in Wiktionary usually starts with "# " and might have a template right after
        if (line.startsWith('#') && line.length > 10) {
            let defText = line.substring(1).trim();
            // Skip etymology or example lines which might start with "#:"
            if (defText.startsWith(':') || defText.startsWith('*')) continue;

            let clue = cleanWikitext(defText);
            // Some basic filters
            if (clue.length > 5 && !clue.includes('harfi') && !clue.includes('+') && !clue.includes('=')) {
                return clue;
            }
        }
    }
    return null;
}

async function fetchWiktionaryBatch() {
    try {
        const url = `https://tr.wiktionary.org/w/api.php?action=query&generator=random&grnnamespace=0&prop=revisions&rvprop=content&rvslots=main&format=json&grnlimit=50`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (CengelBulmacaApp)' } });
        const data = await response.json();

        let results = [];
        if (data && data.query && data.query.pages) {
            for (const key in data.query.pages) {
                const page = data.query.pages[key];
                const title = page.title.toLocaleUpperCase('tr-TR');

                // Only clean Turkish alphabet words, length 5 to 11
                if (/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(title) && title.length >= 5 && title.length <= 11) {
                    if (page.revisions && page.revisions[0] && page.revisions[0].slots && page.revisions[0].slots.main) {
                        const content = page.revisions[0].slots.main['*'];
                        if (content && content.includes('== Türkçe ==') && content.includes('===')) {
                            const clue = parseWikitextClue(content);
                            if (clue) {
                                results.push({ word: title, clue: clue });
                            }
                        }
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
    console.log("Loading DB...");
    let db = [];
    let existingWords = new Set();
    if (fs.existsSync(DB_PATH)) {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        db.forEach(q => q.answer && existingWords.add(q.answer.toLocaleUpperCase('tr-TR')));
    }

    let currentNew = db.filter(q => q.tags && q.tags.includes('yeni-sorular-tdk')).length;
    let required = 2000 - currentNew;

    console.log(`Currently have ${currentNew} new questions. Need ${required} more to hit 2000.`);
    if (required <= 0) return;

    let added = 0;
    let nextId = db.length + 1;
    let loops = 0;

    console.log("Fetching bulk pages from Wiktionary...");
    while (added < required && loops < 100) {
        loops++;
        let batch = await fetchWiktionaryBatch();
        let batchAdded = 0;

        for (let item of batch) {
            // Check if exist
            if (!existingWords.has(item.word)) {
                let diff = item.word.length <= 6 ? 'medium' : 'hard';
                let levelOffset = diff === 'medium' ? 3 : 6;

                db.push({
                    id: `tr_kw_${String(nextId++).padStart(4, '0')}`,
                    type: "crossword_clue",
                    difficulty: diff,
                    level: Math.floor(Math.random() * 3) + levelOffset,
                    answer: item.word,
                    answerLength: item.word.length,
                    category: "Genel Kültür",
                    clue: item.clue,
                    tags: [`${item.word.length}-harf`, diff === 'medium' ? 'orta' : 'zor', 'genel', 'yeni-sorular-tdk'],
                    createdAt: "2026-02-25"
                });
                existingWords.add(item.word);
                added++;
                batchAdded++;
                if (added >= required) break;
            }
        }

        if (batchAdded > 0) {
            console.log(`Added ${batchAdded} words. Total: ${currentNew + added}/2000`);
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        }
    }

    console.log(`Done! DB total questions: ${db.length}`);
}

run();
