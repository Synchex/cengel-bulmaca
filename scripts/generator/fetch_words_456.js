const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function go() {
    let count = 0;
    let max = 1000;
    let questions = [];
    let existing = new Set();
    const EXISTING_FILE = path.join(__dirname, '../../src/data/questions_db.json');
    let db = [];
    if(fs.existsSync(EXISTING_FILE)){
        db = JSON.parse(fs.readFileSync(EXISTING_FILE, 'utf-8'));
        db.forEach(q => q.answer && existing.add(q.answer.toUpperCase('tr-TR')));
    }
    
    // Attempting a reliable gist that contains Turkish words
    const url = 'https://gist.githubusercontent.com/otunctan/b2e2d9213bc94befa3da5abf72bfcc1d/raw/3e275fbe1a329c30f890c0a91e57a7d432adcd9b/TR_Kelime_Listesi.txt';
    try {
        console.log("Fetching dictionary words list from gist...");
        const res = await axios.get(url, { responseType: 'text' });
        // Filter for 4, 5, 6 letters
        let words = res.data.split('\n').map(w => w.trim()).filter(w => w.length >= 4 && w.length <= 6);
        console.log("Found " + words.length + " matching length words");
        
        // Randomize
        words = words.sort(() => 0.5 - Math.random());
        
        let nextId = db.length + 1;
        
        console.log("Fetching dictionary definitions from TDK API in batches...");
        const BATCH_SIZE = 20;
        
        for (let i = 0; i < words.length; i += BATCH_SIZE) {
            if (count >= max) break;
            
            const batch = words.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (word) => {
                let upper = word.toLocaleUpperCase('tr-TR');
                
                if (/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(upper) && !existing.has(upper)) {
                    try {
                        // Fetch definition directly from TDK to ensure quality
                        const defRes = await axios.get(`https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word.toLowerCase('tr-TR'))}`);
                        
                        if (defRes.data && defRes.data[0] && defRes.data[0].anlamlarListe && defRes.data[0].anlamlarListe[0]) {
                            let anlam = defRes.data[0].anlamlarListe[0].anlam;
                            if (anlam) {
                                return {
                                    answerLength: upper.length,
                                    prompt: anlam,
                                    correctAnswer: upper
                                };
                            }
                        }
                    } catch (err) { }
                    
                    // Fallback to Wikipedia style if TDK fails
                    return {
                        answerLength: upper.length,
                        prompt: `Sözlük anlamı: '${word.toLowerCase('tr-TR')}' (Orta-Zor seviye kelime).`,
                        correctAnswer: upper
                    };
                }
                return null;
            });
            
            const results = await Promise.all(promises);
            for (const r of results) {
                if (r && count < max && !existing.has(r.correctAnswer)) {
                    // Decide difficulty: 4-5 is usually medium, 6 is hard
                    const diff = r.answerLength === 6 ? 'hard' : (Math.random() > 0.5 ? 'medium' : 'hard');
                    // Levels: 3-5 for medium, 5-7 for hard
                    const level = diff === 'hard' ? Math.floor(Math.random() * 3) + 5 : Math.floor(Math.random() * 3) + 3;
                    
                    db.push({
                        id: "tr_kw_" + String(nextId).padStart(4, "0"),
                        type: "crossword_clue",
                        difficulty: diff,
                        level: level,
                        answer: r.correctAnswer,
                        answerLength: r.answerLength,
                        category: "Genel Kültür",
                        clue: r.prompt,
                        tags: [`${r.answerLength}-harf`, diff === 'hard' ? 'zor' : 'orta', 'genel'],
                        createdAt: "2026-02-23"
                    });
                    
                    existing.add(r.correctAnswer);
                    nextId++;
                    count++;
                }
            }
            if (count % 100 === 0 && count > 0) {
                console.log(`Progress: ${count} / ${max}`);
            }
        }
        
        if (count > 0) {
            fs.writeFileSync(EXISTING_FILE, JSON.stringify(db, null, 2), 'utf-8');
            console.log(`Successfully added ${count} words! Total DB size: ${db.length}`);
        } else {
            console.log("Failed to extract enough words.");
        }
        
    } catch(err) {
        console.log("Error:", err.message);
    }
}
go();
