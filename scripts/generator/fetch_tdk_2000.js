const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../src/data/questions_db.json');

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function fetchFromTDK(word) {
    try {
        const url = `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word)}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
            const entry = data[0];
            if (entry.anlamlarListe && entry.anlamlarListe.length > 0) {
                let anlam = entry.anlamlarListe[0].anlam;
                return anlam.trim();
            }
        }
    } catch (e) {
    }
    return null;
}

async function getRandomCandidateWords() {
    try {
        const url = `https://tr.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=50&format=json`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = await res.json();
        let candidates = [];
        if (data && data.query && data.query.random) {
            data.query.random.forEach(item => {
                const parts = item.title.split(/[\s\-\(\)\.\,]+/);
                parts.forEach(p => {
                    const upper = p.toLocaleUpperCase('tr-TR');
                    if (/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(upper)) {
                        if (upper.length >= 5 && upper.length <= 9) {
                            candidates.push(upper);
                        }
                    }
                });
            });
        }
        return candidates;
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

    console.log(`Loaded ${db.length} existing clues. Unique answers: ${existingWords.size}`);

    let mediumNeeded = 1000;
    let hardNeeded = 1000;
    let mediumFound = 0;
    let hardFound = 0;

    let nextId = db.length + 1;

    console.log(`Starting TDK fetch for 1000 Medium + 1000 Hard...`);

    // Safety break
    let loopCount = 0;
    while ((mediumFound < mediumNeeded || hardFound < hardNeeded) && loopCount < 5000) {
        loopCount++;
        let candidates = await getRandomCandidateWords();
        if (candidates.length === 0) {
            await sleep(1000);
            continue;
        }

        candidates = [...new Set(candidates)].filter(w => !existingWords.has(w));

        const promises = candidates.map(async (upper) => {
            const isMedium = upper.length === 5 || upper.length === 6;
            const isHard = upper.length >= 7 && upper.length <= 9;

            if (isMedium && mediumFound >= mediumNeeded) return null;
            if (isHard && hardFound >= hardNeeded) return null;

            const clue = await fetchFromTDK(upper.toLocaleLowerCase('tr-TR'));
            if (clue && clue.length > 10 && !clue.includes('Harflerin okunuşu')) {
                const difficulty = isMedium ? 'medium' : 'hard';
                const levelOffset = difficulty === 'medium' ? 3 : 6;

                return {
                    isMedium,
                    isHard,
                    data: {
                        id: `tr_kw_${String(nextId++).padStart(4, '0')}`,
                        type: "crossword_clue",
                        difficulty: difficulty,
                        level: Math.floor(Math.random() * 3) + levelOffset,
                        answer: upper,
                        answerLength: upper.length,
                        category: "Genel Kültür",
                        clue: clue,
                        tags: [`${upper.length}-harf`, difficulty === 'medium' ? 'orta' : 'zor', 'genel', 'yeni-sorular-tdk'],
                        createdAt: new Date().toISOString().split('T')[0]
                    }
                };
            }
            return null;
        });

        const results = await Promise.all(promises);
        for (const res of results) {
            if (res && !existingWords.has(res.data.answer)) {
                if (res.isMedium && mediumFound < mediumNeeded) {
                    db.push(res.data);
                    existingWords.add(res.data.answer);
                    mediumFound++;
                } else if (res.isHard && hardFound < hardNeeded) {
                    db.push(res.data);
                    existingWords.add(res.data.answer);
                    hardFound++;
                }
            }
        }

        process.stdout.write(`\rProgress: Medium ${mediumFound}/${mediumNeeded} | Hard ${hardFound}/${hardNeeded}`);

        if ((mediumFound + hardFound) % 5 === 0 && (mediumFound + hardFound) > 0) {
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
        }
        await sleep(100);
    }

    console.log(`\n\nSaving ${db.length} total clues to DB...`);
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`Success! Fetched ${mediumFound} medium and ${hardFound} hard words.`);
}
run();
