const fs = require('fs');
const path = require('path');
const axios = require('axios');

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
    console.log(`Loaded ${existingWords.size} existing words.`);
} catch (e) {
    console.log("Could not load existing words.");
}

async function scrapeWords() {
    console.log("Fetching words from sozluk.gov.tr autocomplete API...");
    try {
        const res = await axios.get('https://sozluk.gov.tr/autocomplete.json');
        const words = res.data;
        console.log(`Fetched ${words.length} words from TDK.`);

        let hardQuestions = [];
        let count = 0;

        // Shuffle words
        const shuffled = words.sort(() => 0.5 - Math.random());

        // Let's speed it up by sending concurrent requests
        const BATCH_SIZE = 20;

        for (let i = 0; i < shuffled.length; i += BATCH_SIZE) {
            if (count >= 1000) break;

            const batch = shuffled.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (item) => {
                const word = item.madde;
                if (!word) return null;

                const upperWord = word.toLocaleUpperCase('tr-TR');

                if (upperWord.length >= 5 && upperWord.length <= 7 &&
                    /^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(upperWord) &&
                    !existingWords.has(upperWord)) {

                    try {
                        const defRes = await axios.get(`https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word)}`);
                        if (defRes.data && defRes.data[0] && defRes.data[0].anlamlarListe && defRes.data[0].anlamlarListe[0]) {
                            let anlam = defRes.data[0].anlamlarListe[0].anlam;
                            if (anlam) {
                                return {
                                    id: `cw-hard-tdk-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                                    type: 'crossword',
                                    difficulty: 'hard',
                                    level: Math.floor(Math.random() * 3) + 5,
                                    prompt: anlam,
                                    correctAnswer: upperWord,
                                    tags: [`${upperWord.length}-harf`, 'zor', 'genel']
                                };
                            }
                        }
                    } catch (err) { }
                }
                return null;
            });

            const results = await Promise.all(promises);
            for (const r of results) {
                if (r && count < 1000) {
                    hardQuestions.push(r);
                    existingWords.add(r.correctAnswer);
                    count++;
                }
            }
            console.log(`Progress: ${count} / 1000 words generated...`);
        }

        if (hardQuestions.length > 0) {
            const outPath = path.join(__dirname, '../../src/data/seeds/hard_words_batch_1000.json');
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
            fs.writeFileSync(outPath, JSON.stringify(hardQuestions, null, 2), 'utf-8');
            console.log(`Successfully generated ${hardQuestions.length} words and saved to seeds directory!`);

            // Generate importBatches if needed
            console.log("Done.");
        } else {
            console.log("Failed to extract enough words.");
        }
    } catch (e) {
        console.error("Error fetching words:", e.message);
    }
}

scrapeWords();
