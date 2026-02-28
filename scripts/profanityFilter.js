#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  PROFANITY FILTER — Turkish + Common English
 * ═══════════════════════════════════════════════════════════════════════
 *  Detects profanity, hate speech, sexual content, and slurs
 *  in Turkish crossword clues. Uses WORD-BOUNDARY matching to avoid
 *  false positives on legitimate Turkish words like "küçük", "memeli",
 *  "psikoloji", "ansiklopedi", etc.
 */

// ═══════════════════════════════════════════════════════════════════════
//  SAFE WORDS — Turkish words that contain profanity substrings
//  but are 100% clean. We whitelist these BEFORE checking.
// ═══════════════════════════════════════════════════════════════════════

const SAFE_WORDS = new Set([
    // Contains "çük" but perfectly clean
    'küçük', 'küçücük', 'küçüklük', 'küçümse', 'küçümsemek', 'küçülmek',
    'küçültmek', 'büyükçe',
    // Contains "meme" but perfectly clean in context
    'memeli', 'memeliler', 'emme', 'memelilerin', 'memelerinden',
    // Contains "sik" but clean
    'sikke', 'siklamen', 'bisiklet', 'motosiklet', 'ansiklopedi',
    'psikoloji', 'psikolojik', 'psikolog', 'psikiyatri', 'psikiyatrist',
    'fizik', 'fiziksel', 'klasik', 'bazilika', 'müzik', 'müzikal',
    'musikî', 'taksit', 'taksi', 'eksik', 'eksiklik', 'kesik',
    'basik', 'basıklık', 'yakışıklı', 'ısıtıcı', 'elektrik',
    // Contains "am" but clean
    'ama', 'amaç', 'amacı', 'amaçla', 'amalgam', 'ambalaj', 'amber',
    'ambar', 'amblem', 'ambulans', 'ameliyat', 'ametal', 'amfi',
    'amfiteatr', 'amiral', 'amonyak', 'amor', 'amortisman',
    'ampul', 'namaz', 'tamam', 'tamamla', 'hamam', 'hamak',
    'yaman', 'zaman', 'kaman', 'aman', 'daman', 'damak',
    // Contains "göt" but clean
    'gösteri', 'gösterge', 'göstermek', 'götürmek', 'götür',
    // Contains "piç" but clean
    'biçim', 'biçimsel', 'biçmek', 'piçi',
    // Contains "döl" but clean
    'döllenme', 'döllenmek',
    // Contains "taşak" but clean
    'taşaklı',
]);

// ═══════════════════════════════════════════════════════════════════════
//  PROFANITY WORD LISTS — only match as STANDALONE words
// ═══════════════════════════════════════════════════════════════════════

// Turkish profanity (must match as full word, not substring)
const TR_PROFANITY_STANDALONE = [
    'amk', 'aq', 'amcık', 'yarrak', 'sikim', 'siktiğimin',
    'orospu', 'piç', 'pezevenk', 'götveren', 'ibne', 'kahpe', 'sürtük',
    'kaltak', 'fahişe', 'kevaşe',
    'siktir', 'sikeyim', 'siktirgit', 'ananı', 'ananızı',
    'yavşak', 'puşt', 'daşşak',
    'mastürbasyon', 'orgazm', 'vajina', 'penis',
    'fuhuş',
];

// These short words ONLY match with strict word boundaries
const TR_PROFANITY_STRICT_BOUNDARY = [
    'sik', 'göt', 'çük', 'döl', 'meme', 'taşak', 'amına',
    'seks', 'piç',
];

// Hate / harassment terms (standalone)
const TR_HATE = [
    'nazist', 'soykırım', 'ırkçı', 'ırkçılık',
    'terörist', 'intihar bombacısı',
];

// English fallbacks (standalone)
const EN_PROFANITY = [
    'fuck', 'shit', 'bitch', 'asshole', 'dick', 'porn', 'nigger', 'faggot',
    'whore', 'slut', 'cunt',
];

// ═══════════════════════════════════════════════════════════════════════
//  TOKENIZER — splits Turkish text into words for whole-word matching
// ═══════════════════════════════════════════════════════════════════════

function tokenize(text) {
    return text
        .toLocaleLowerCase('tr-TR')
        .replace(/[.,;!?'"()\[\]{}<>:\/\\–—-]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN CHECKER
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check text for profanity/hate/sexual content.
 * Uses whole-word matching with Turkish safe-word whitelist.
 *
 * @param {string} text — clue or answer text
 * @returns {{ flagged: boolean, matches: string[], category: string }}
 */
function checkProfanity(text) {
    if (!text || typeof text !== 'string') {
        return { flagged: false, matches: [], category: 'clean' };
    }

    const tokens = tokenize(text);
    const matches = [];
    let category = 'clean';

    // Check if any token is a safe word → skip those tokens
    const unsafeTokens = tokens.filter(t => !SAFE_WORDS.has(t));

    // ── Check standalone profanity ──
    for (const word of TR_PROFANITY_STANDALONE) {
        const wordLower = word.toLocaleLowerCase('tr-TR');
        if (unsafeTokens.includes(wordLower)) {
            matches.push(word);
            category = 'profanity';
        }
    }

    // ── Check strict-boundary words (only exact token match) ──
    for (const word of TR_PROFANITY_STRICT_BOUNDARY) {
        const wordLower = word.toLocaleLowerCase('tr-TR');
        if (unsafeTokens.includes(wordLower)) {
            matches.push(word);
            category = 'profanity';
        }
    }

    // ── Check hate terms ──
    const lower = text.toLocaleLowerCase('tr-TR');
    for (const term of TR_HATE) {
        const termLower = term.toLocaleLowerCase('tr-TR');
        // For multi-word terms, check substring; for single words, check tokens
        if (term.includes(' ')) {
            if (lower.includes(termLower)) {
                matches.push(term);
                category = 'hate';
            }
        } else {
            if (unsafeTokens.includes(termLower)) {
                matches.push(term);
                category = 'hate';
            }
        }
    }

    // ── Check English profanity (token match) ──
    for (const word of EN_PROFANITY) {
        if (unsafeTokens.includes(word)) {
            matches.push(word);
            if (category === 'clean') category = 'profanity';
        }
    }

    return {
        flagged: matches.length > 0,
        matches: [...new Set(matches)],
        category,
    };
}

module.exports = { checkProfanity };
