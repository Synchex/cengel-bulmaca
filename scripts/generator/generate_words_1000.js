const fs = require('fs');
const path = require('path');
const { TxtDictionary } = require('nlptoolkit-dictionary/dist/Dictionary/TxtDictionary');

const dict = new TxtDictionary();

const EXISTING_FILE = path.join(__dirname, '../../src/data/questions_db.json');
let existingWords = new Set();

try {
    const rawData = fs.readFileSync(EXISTING_FILE, 'utf-8');
    const existingPuzzles = JSON.parse(rawData);
    existingPuzzles.forEach((p) => {
        if (p.correctAnswer) {
            existingWords.add(p.correctAnswer.toUpperCase('tr-TR'));
        }
    });
    console.log(`Loaded ${existingWords.size} existing words to avoid duplicates.`);
} catch (e) {
    console.log("Could not load existing words. Creating new set.");
}

async function generate() {
    console.log("Extracting words from dictionary...");
    let count = 0;
    const hardQuestions = [];
    
    const wordsCount = dict.wordCount();
    console.log(`Dictionary contains ${wordsCount} words.`);
    
    const indices = Array.from({length: wordsCount}, (_, i) => i);
    indices.sort(() => Math.random() - 0.5);
    
    for (const idx of indices) {
        if (count >= 1000) break;
        
        const wordObj = dict.getWord(idx);
        if (!wordObj) continue;
        
        const word = wordObj.getName().trim();
        const upperWord = word.toLocaleUpperCase('tr-TR');
        
        if (upperWord.length >= 5 && upperWord.length <= 7 && 
            /^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(upperWord) && 
            !existingWords.has(upperWord)) {
            
            hardQuestions.push({
                id: `cw-hard-gen-${Date.now()}-${count}`,
                type: 'crossword',
                difficulty: 'hard',
                level: Math.floor(Math.random() * 3) + 5,
                prompt: `Sözlük anlamı: ${word} (Zor seviye kelime).`,
                correctAnswer: upperWord,
                tags: [`${upperWord.length}-harf`, 'zor', 'genel']
            });
            count++;
            existingWords.add(upperWord);
        }
    }
    
    if (hardQuestions.length > 0) {
        const outPath = path.join(__dirname, '../../src/data/seeds/hard_words_batch_1000.json');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(hardQuestions, null, 2), 'utf-8');
        console.log(`Successfully generated ${hardQuestions.length} words and saved to seeds directory!`);
    } else {
        console.log("Failed to extract enough words.");
    }
}

generate().catch(console.error);
