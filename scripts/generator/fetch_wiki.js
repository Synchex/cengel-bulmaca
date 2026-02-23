const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function go() {
    let count = 0;
    let max = 1000;
    let questions = [];
    let existing = new Set();
    const EXISTING_FILE = path.join(__dirname, '../../src/data/questions_db.json');
    if(fs.existsSync(EXISTING_FILE)){
        JSON.parse(fs.readFileSync(EXISTING_FILE, 'utf-8')).forEach(q => q.correctAnswer && existing.add(q.correctAnswer.toUpperCase('tr-TR')));
    }
    
    // Attempting a very reliable gist that contains Turkish words
    const url = 'https://gist.githubusercontent.com/otunctan/b2e2d9213bc94befa3da5abf72bfcc1d/raw/3e275fbe1a329c30f890c0a91e57a7d432adcd9b/TR_Kelime_Listesi.txt';
    try {
        console.log("Fetching dictionary words list from gist...");
        const res = await axios.get(url, { responseType: 'text' });
        let words = res.data.split('\n').map(w => w.trim()).filter(w => w.length >= 5 && w.length <= 7);
        console.log("Found " + words.length + " matching length words");
        
        // Randomize
        words = words.sort(() => 0.5 - Math.random());
        
        for (let word of words) {
            if (count >= max) break;
            
            let upper = word.toLocaleUpperCase('tr-TR');
            if (/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(upper) && !existing.has(upper)) {
                let anlam = `Sözlük anlamı: '${word.toLowerCase()}' (Zor seviye kelime).`;
                             
                questions.push({
                    id: `gen-hard-gist-${count}-${Date.now()}`,
                    type: 'crossword',
                    difficulty: 'hard',
                    level: Math.floor(Math.random() * 3) + 5,
                    prompt: anlam,
                    correctAnswer: upper,
                    tags: [`${upper.length}-harf`, 'zor', 'genel', 'batch-1000']
                });
                count++;
                existing.add(upper);
            }
        }
        
        const outPath = path.join(__dirname, '../../src/data/seeds/hard_words_batch_1000.json');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        
        const jsonOutput = JSON.stringify(questions, null, 2);
        fs.writeFileSync(outPath, jsonOutput, 'utf-8');
        console.log(`Saved ${questions.length} questions!`);
        
    } catch(err) {
        console.log("Error:", err.message);
    }
}
go();
