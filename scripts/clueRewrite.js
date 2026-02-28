#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  CLUE REWRITE ENGINE — Automatic definition-style clue generation
 * ═══════════════════════════════════════════════════════════════════════
 *  Pure heuristic rewriter for Turkish crossword clues.
 *  No external APIs — uses pattern matching and template rules.
 */

// ═══════════════════════════════════════════════════════════════════════
//  1. SANITIZE — strip noise, normalize
// ═══════════════════════════════════════════════════════════════════════

const META_NOISE = [
    /\s*\(Kolay\)\s*/gi, /\s*\(Orta\)\s*/gi, /\s*\(Zor\)\s*/gi,
    /\s*\[Kolay\]\s*/gi, /\s*\[Orta\]\s*/gi, /\s*\[Zor\]\s*/gi,
    /^\s*Kolay:\s*/gi, /^\s*Orta:\s*/gi, /^\s*Zor:\s*/gi,
    /\s*\(kolay\)\s*/gi, /\s*\(orta\)\s*/gi, /\s*\(zor\)\s*/gi,
    /\s*soru\s*\d+\s*:?\s*/gi,
    /\s*level\s*\d*\s*:?\s*/gi,
    /\s*cevap\s*:?\s*/gi,
    /\s*bulmaca\s*:?\s*/gi,
    /\s*harf\s*sayısı\s*:?\s*\d*\s*/gi,
    /_{2,}/g,  // underscore blanks
];

/**
 * Remove meta labels, normalize whitespace, capitalize first letter.
 */
function cleanClue(text) {
    if (!text || typeof text !== 'string') return '';
    let s = text;

    for (const rx of META_NOISE) {
        s = s.replace(rx, ' ');
    }

    // Collapse whitespace
    s = s.replace(/\s+/g, ' ').trim();

    // Remove leading punctuation remnants
    s = s.replace(/^[.,;:\-–—\s]+/, '').trim();

    // Capitalize first letter (Turkish locale)
    if (s.length > 0 && !/^[''\"«]/.test(s)) {
        s = s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
    }

    return s;
}

// ═══════════════════════════════════════════════════════════════════════
//  2. REWRITE — heuristic clue improvement
// ═══════════════════════════════════════════════════════════════════════

/**
 * Remove robotic/template patterns from a clue while keeping semantics.
 */
function removeRoboticPatterns(clue) {
    let s = clue;

    // Remove "bir kelimedir / bir kavramdır / bir terimdir" endings
    s = s.replace(/,?\s*yaygın,?\s*kısa\s*ve\s*bilinen\s*bir\s*kelimedir\.?\s*$/i, '');
    s = s.replace(/,?\s*yaygın\s*(?:ve\s*)?bilinen\s*bir\s*kelimedir\.?\s*$/i, '');
    s = s.replace(/,?\s*bilinen\s*bir\s*kelimedir\.?\s*$/i, '');
    s = s.replace(/,?\s*sıkça\s*kullanılan\s*bir\s*kelimedir\.?\s*$/i, '');
    s = s.replace(/,?\s*bir\s*(?:terim|kavram|sözcük)d[iı]r\.?\s*$/i, '');

    // Remove robotic endings
    s = s.replace(/\s+olarak\s+kullanılır\.?\s*$/i, '');
    s = s.replace(/\s+ifade\s+eder\.?\s*$/i, '');
    s = s.replace(/\s+olarak\s+bilinir\.?\s*$/i, '');
    s = s.replace(/\s+olarak\s+tanımlanır\.?\s*$/i, '');
    s = s.replace(/\s+denir\.?\s*$/i, '');
    s = s.replace(/\s+adıdır\.?\s*$/i, '');
    s = s.replace(/\s+adı\s+verilen\.?\s*$/i, '');

    // Remove "Türkçede yaygın / Türkçe bir kelimedir"
    s = s.replace(/Türkçe(?:de)?\s+(?:yaygın\s+)?bir\s+kelime(?:dir)?\.?\s*/gi, '');

    // Remove "Genel olarak ifade etmek gerekirse" / "Kapsamlı bir şekilde"
    s = s.replace(/genel\s+olarak\s+ifade\s+etmek\s+gerekirse,?\s*/gi, '');
    s = s.replace(/kapsamlı\s+bir\s+şekilde\s+tanımlamak\s+gerekirse,?\s*/gi, '');

    // Trim trailing comma, period, space
    s = s.replace(/[.,;\s]+$/, '').trim();

    // Re-capitalize
    if (s.length > 0 && !/^[''\"«]/.test(s)) {
        s = s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
    }

    return s;
}

/**
 * Attempt to shorten an overly long clue by trimming parenthetical info.
 */
function shortenClue(clue) {
    let s = clue;

    // Remove parenthetical side-notes (etymology, abbreviation notes)
    s = s.replace(/\s*\([^)]{5,60}\)\s*/g, ' ');

    // If still > 100 chars, try truncating at last sentence boundary
    if (s.length > 100) {
        const periodIdx = s.lastIndexOf('.', 100);
        const semicolonIdx = s.lastIndexOf(';', 100);
        const cutAt = Math.max(periodIdx, semicolonIdx);
        if (cutAt > 20) {
            s = s.substring(0, cutAt).trim();
        }
    }

    return s.replace(/\s+/g, ' ').trim();
}

/**
 * Remove the answer itself if it leaked into the clue.
 */
function removeAnswerLeak(clue, answer) {
    if (!answer || answer.length < 3) return clue;
    const answerUpper = answer.toLocaleUpperCase('tr-TR');
    const rx = new RegExp(
        `(?:^|\\s|['".,;!?])(${answerUpper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?:\\s|['".,;!?]|$)`,
        'gi'
    );
    return clue.replace(rx, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Main rewrite function.
 * Returns { rewritten_clue, changes: string[] }
 */
function rewriteClue(entry) {
    const { answer, clue } = entry;
    const changes = [];
    let result = clue;

    // Step 1: Clean meta noise
    const cleaned = cleanClue(result);
    if (cleaned !== result) {
        changes.push('Removed meta noise');
        result = cleaned;
    }

    // Step 2: Remove robotic patterns
    const deroboted = removeRoboticPatterns(result);
    if (deroboted !== result) {
        changes.push('Removed robotic/template phrasing');
        result = deroboted;
    }

    // Step 3: Remove answer leak
    const noLeak = removeAnswerLeak(result, answer);
    if (noLeak !== result) {
        changes.push('Removed answer leak from clue');
        result = noLeak;
    }

    // Step 4: Shorten if too long
    const wordCount = result.split(/\s+/).length;
    if (wordCount > 20 || result.length > 120) {
        const shortened = shortenClue(result);
        if (shortened !== result) {
            changes.push('Shortened overly long clue');
            result = shortened;
        }
    }

    // Step 5: Remove trailing period for crossword style
    result = result.replace(/\.+\s*$/, '').trim();

    // Step 6: Final capitalize
    if (result.length > 0 && !/^[''\"«]/.test(result)) {
        result = result.charAt(0).toLocaleUpperCase('tr-TR') + result.slice(1);
    }

    return {
        rewritten_clue: result,
        changes,
    };
}

module.exports = { cleanClue, rewriteClue, removeRoboticPatterns, shortenClue };
