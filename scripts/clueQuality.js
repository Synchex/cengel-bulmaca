#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  CLUE QUALITY SCORING ENGINE — v2 (Pipeline Edition)
 * ═══════════════════════════════════════════════════════════════════════
 *  Scores each crossword clue 0–100 using heuristic rules.
 *  Start at 100, subtract penalties. Returns score + decision + reasons.
 *
 *  Used by: crosswordQualityPipeline.js
 *  Exports: scoreClue(entry) → { quality_score, decision, reasons }
 */

const { checkProfanity } = require('./profanityFilter');
const { cleanClue } = require('./clueRewrite');

// ═══════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const TR_VALID_ANSWER = /^[A-ZÇĞİÖŞÜa-zçğıöşüâîûÂÎÛ\s\-]+$/;
const TR_VOWELS = new Set('aeıioöuüAEIİOÖUÜ');

// Meta junk patterns (instant penalty)
const META_JUNK = [
    /\(kolay\)/i, /\(orta\)/i, /\(zor\)/i,
    /\[kolay\]/i, /\[orta\]/i, /\[zor\]/i,
    /\bsoru\s*\d/i,
    /\blevel\b/i,
    /\bcevap\b/i,
    /\bbulmaca\b/i,
    /\bharf\s*sayısı\b/i,
    /_{2,}/,
];

// Ambiguous / vague phrases
const VAGUE_PHRASES = [
    /\bbir\s+şey\b/i,
    /\bgenelde\b/i,
    /\bbazen\b/i,
    /\bherkes\s+bilir\b/i,
    /\bherkesin\s+bildiği\b/i,
    /\bçok\s+meşhur\b/i,
    /\bçok\s+bilinen\b/i,
    /\bgibi\s+bir\s+şey\b/i,
    /\bbelli\b/i,
    /\bmalum\b/i,
];

// Banned template phrases (AI-generated junk)
const BANNED_TEMPLATES = [
    'yaygın, kısa ve bilinen bir kelimedir',
    'yaygın ve bilinen bir kelimedir',
    'kısa ve bilinen bir kelimedir',
    'bilinen bir kelimedir',
    'sıkça kullanılan bir kelimedir',
    'günlük dilde kullanılan bir kelimedir',
    'türkçede yaygın bir kelimedir',
    'türkçe bir kelimedir',
    'bu kelimenin anlamı',
    'bu sözcüğün karşılığı',
    'bu terimin açılımı',
    'aşağıdaki kelime',
    'lorem ipsum',
    'placeholder',
    'test clue',
    'random word',
    'genel olarak ifade etmek gerekirse',
    'kapsamlı bir şekilde tanımlamak gerekirse',
    // Gibberish word templates
    'az bilinen, türetilmiş veya ağır yapılı kelime',
    'az bilinen, türetilmiş',
    'ağır yapılı kelime',
];

// Ultra-generic "bir X" clues
const ULTRA_GENERIC_RX = /^bir\s+(hayvan|şehir|ülke|şey|renk|sayı|nesne|kulüp|meyve|sebze|alet|araç)\.?\s*$/i;

// Robotic endings
const ROBOTIC_ENDINGS = [
    { rx: /olarak\s+kullanılır\.?\s*$/i, penalty: 8 },
    { rx: /ifade\s+eder\.?\s*$/i, penalty: 8 },
    { rx: /anlamına\s+gelir\.?\s*$/i, penalty: 5 },
    { rx: /olarak\s+bilinir\.?\s*$/i, penalty: 5 },
    { rx: /olarak\s+tanımlanır\.?\s*$/i, penalty: 8 },
    { rx: /bir\s+(?:terim|kavram|sözcük)d[iı]r\.?\s*$/i, penalty: 10 },
];

// ═══════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════

function hasVowels(word) {
    for (const ch of word) if (TR_VOWELS.has(ch)) return true;
    return false;
}

function wordCount(text) {
    return (text || '').split(/\s+/).filter(Boolean).length;
}

// Note: Gibberish detection is handled by banned template phrases
// ("az bilinen, türetilmiş veya ağır yapılı kelime") which catches all 941
// actual gibberish entries without false-positiving on loan words like
// MİKROSKOP, ASTRONOT, İTFAİYE etc.

// ═══════════════════════════════════════════════════════════════════════
//  MAIN SCORER
// ═══════════════════════════════════════════════════════════════════════

/**
 * Score a single crossword clue entry.
 * @param {{ answer: string, clue: string, difficulty?: string }} entry
 * @returns {{ quality_score: number, decision: string, reasons: string[] }}
 */
function scoreClue(entry) {
    const { answer, clue } = entry;
    const reasons = [];
    let score = 100;

    const clueClean = cleanClue(clue || '');
    const clueLower = (clue || '').toLocaleLowerCase('tr-TR');
    const answerUpper = (answer || '').toLocaleUpperCase('tr-TR');
    const answerLower = (answer || '').toLocaleLowerCase('tr-TR');
    const wc = wordCount(clueClean);

    // ═══════════════════════════════════════════════════════════
    //  A) HARD REJECT CHECKS (often set score very low)
    // ═══════════════════════════════════════════════════════════

    // A1: Answer too short
    if (!answer || answer.length < 2) {
        score -= 50;
        reasons.push('Answer too short (< 2 chars)');
    }

    // A2: Answer is non-alphabetic garbage
    if (answer && !TR_VALID_ANSWER.test(answer)) {
        score -= 60;
        reasons.push('Answer contains invalid characters');
    }

    // A3: Answer has no vowels (4+ chars = likely gibberish)
    if (answer && answer.length >= 4 && !hasVowels(answer)) {
        score -= 70;
        reasons.push('Answer has no vowels — gibberish');
    }

    // A4: Answer has excessive repeated chars
    if (answer && /(.)(\1){3,}/.test(answer)) {
        score -= 60;
        reasons.push('Answer has 4+ repeated characters');
    }


    // A11: Lazy "Xmek/Xmak işi" clue pattern (just verb nominalization)
    if (clue && /^[A-ZÇĞİÖŞÜa-zçğıöşüâîû]+m[ae]k\s+işi\.?\s*$/i.test(clue.trim())) {
        score -= 40;
        reasons.push('Lazy clue pattern: Xmek/Xmak işi');
    }

    // A5: Clue contains answer directly (case-insensitive, answer 3+ chars)
    let answerLeakHit = false;
    if (answer && answer.length >= 3 && clueLower.includes(answerLower)) {
        score -= 40;
        reasons.push('Clue contains the answer directly');
        answerLeakHit = true;
    }

    // A6: Profanity / hate / sexual content
    // Skip answer profanity check for short answers (≤4 chars) that are
    // legitimate Turkish words (e.g. MEME = breast organ, SİK = archaic)
    const ANSWER_PROF_WHITELIST = new Set(['meme', 'sik', 'göt', 'am', 'döl']);
    const profCheck = checkProfanity(clue || '');
    const skipAnswerCheck = answer && answer.length <= 4 && ANSWER_PROF_WHITELIST.has(answerLower);
    const answerProfCheck = skipAnswerCheck
        ? { flagged: false, matches: [] }
        : checkProfanity(answer || '');
    let profanityHit = false;
    if (profCheck.flagged || answerProfCheck.flagged) {
        score = Math.min(score, 5);
        reasons.push(`Offensive content: ${(profCheck.matches.concat(answerProfCheck.matches)).join(', ')}`);
        profanityHit = true;
    }

    // A7: Clue empty or too short (< 3 words)
    if (!clue || clue.trim().length === 0) {
        score = 0;
        reasons.push('Clue is empty');
    } else if (wc < 3) {
        score -= 25;
        reasons.push(`Clue too short (${wc} words, need ≥3)`);
    }

    // A8: Banned template phrases (instant-reject level penalty)
    for (const phrase of BANNED_TEMPLATES) {
        if (clueLower.includes(phrase)) {
            score -= 60;
            reasons.push(`Banned template phrase: "${phrase.substring(0, 40)}"`);
            break; // one is enough
        }
    }

    // A9: Ultra-generic clue ("bir hayvan", "bir ülke")
    if (ULTRA_GENERIC_RX.test(clueClean)) {
        score -= 35;
        reasons.push('Ultra-generic clue');
    }

    // ═══════════════════════════════════════════════════════════
    //  B) PENALTY CHECKS (subtract from score)
    // ═══════════════════════════════════════════════════════════

    // B1: Meta junk labels still present
    let metaFound = false;
    for (const rx of META_JUNK) {
        if (rx.test(clue || '')) {
            if (!metaFound) {
                score -= 10;
                reasons.push('Contains meta junk labels');
                metaFound = true;
            }
        }
    }

    // B2: Vague / ambiguous phrases
    let vagueFound = false;
    for (const rx of VAGUE_PHRASES) {
        if (rx.test(clue || '')) {
            if (!vagueFound) {
                score -= 15;
                reasons.push('Ambiguous/vague phrasing');
                vagueFound = true;
            }
        }
    }

    // B3: Robotic endings
    for (const { rx, penalty } of ROBOTIC_ENDINGS) {
        if (rx.test(clueClean)) {
            score -= penalty;
            reasons.push('Robotic/template ending detected');
            break;
        }
    }

    // B4: Overly long clue (> 20 words)
    if (wc > 20) {
        const excess = wc - 20;
        const penalty = Math.min(20, excess * 2);
        score -= penalty;
        reasons.push(`Overly long clue (${wc} words)`);
    }

    // B5: Single-word clue (still 3+ chars but just one word)
    if (wc === 1 && clueClean.length >= 3) {
        score -= 15;
        reasons.push('Single-word clue');
    }

    // B6: Parenthetical meta-explanations
    if (/\(.*kısaltma.*\)/i.test(clueClean) || /\(.*kökenli.*\)/i.test(clueClean)) {
        score -= 5;
        reasons.push('Parenthetical meta-explanation');
    }

    // ═══════════════════════════════════════════════════════════
    //  C) BONUSES (add to score)
    // ═══════════════════════════════════════════════════════════

    // C1: Dual-meaning style (semicolon-separated)
    if (/;\s+/.test(clueClean)) {
        score += 5;
        reasons.push('+5 dual-meaning bonus');
    }

    // C2: Ideal crossword clue length (20-65 chars, 3+ words)
    if (clueClean.length >= 20 && clueClean.length <= 65 && wc >= 3) {
        score += 5;
        reasons.push('+5 ideal length bonus');
    }

    // ═══════════════════════════════════════════════════════════
    //  CLAMP & DECISION
    // ═══════════════════════════════════════════════════════════

    score = Math.max(0, Math.min(100, score));

    let decision;
    if (score >= 80) {
        decision = 'ACCEPT';
    } else if (score >= 50) {
        decision = 'FIX';
    } else {
        decision = 'REJECT';
    }

    return {
        quality_score: score,
        decision,
        reasons,
        // Diagnostic flags for CSV reporting
        flags: {
            contains_meta: metaFound,
            contains_answer_leak: answerLeakHit,
            profanity_hit: profanityHit,
            ambiguity_hit: vagueFound,
            clue_word_count: wc,
        },
    };
}

module.exports = { scoreClue };
