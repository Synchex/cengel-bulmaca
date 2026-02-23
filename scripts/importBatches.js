const fs = require('fs');
const path = require('path');

const SEEDS_DIR = path.join(__dirname, '../src/data/seeds');
const DB_FILE = path.join(__dirname, '../src/data/questions_db.json');

function importBatches() {
    console.log("Starting bulk import pipeline...");
    
    let db = [];
    if (fs.existsSync(DB_FILE)) {
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
    
    const initialCount = db.length;
    let newItemsCount = 0;
    
    const existingIds = new Set(db.map(q => q.id));
    const existingWords = new Set(db.map(q => q.correctAnswer ? q.correctAnswer.toUpperCase('tr-TR') : null).filter(Boolean));
    
    if (!fs.existsSync(SEEDS_DIR)) {
        console.log("No seeds directory found.");
        return;
    }
    
    const files = fs.readdirSync(SEEDS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
        if(file.includes('imported')) continue;
        
        console.log(`Processing ${file}...`);
        const filePath = path.join(SEEDS_DIR, file);
        const batch = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        let batchAdded = 0;
        for (const q of batch) {
            const word = q.correctAnswer ? q.correctAnswer.toUpperCase('tr-TR') : null;
            if (!existingIds.has(q.id) && word && !existingWords.has(word)) {
                db.push(q);
                existingIds.add(q.id);
                existingWords.add(word);
                batchAdded++;
                newItemsCount++;
            } else {
                console.log(`Skipped duplicate or invalid: ${q.correctAnswer}`);
            }
        }
        console.log(`Added ${batchAdded} items from ${file}`);
        
        // Rename file to indicate imported
        fs.renameSync(filePath, path.join(SEEDS_DIR, `imported_${file}`));
    }
    
    if (newItemsCount > 0) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
        console.log(`\nImport complete! Added ${newItemsCount} new items.`);
        console.log(`Total questions in DB: ${db.length}`);
    } else {
        console.log("\nNo new valid items found to import.");
    }
}

importBatches();
