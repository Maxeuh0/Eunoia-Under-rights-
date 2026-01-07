// @ts-nocheck
// Lexicons
const POSITIVE = {
    // English
    good: 1, great: 2, excellent: 3, amazing: 4, wonderful: 4, happy: 2, joy: 3, love: 3, calm: 2, peaceful: 2, clarity: 2, zen: 2,
    hope: 2, inspired: 3, proud: 2, grateful: 3, excited: 2, creative: 2, productive: 1, achieved: 2,
    // French (Shared words like 'excellent' are skipped if already present or just identical value)
    bien: 1, super: 2, incroyable: 4, merveilleux: 4, heureux: 2, joie: 3, amour: 3, calme: 2, paisible: 2, clarté: 2,
    espoir: 2, inspiré: 3, fier: 2, reconnaissant: 3, excité: 2, créatif: 2, productif: 1, accompli: 2,
};

const NEGATIVE = {
    // English
    bad: -1, terrible: -3, awful: -3, sad: -2, angry: -2, hate: -3, anxious: -2, stressed: -2, tired: -1, overwhelming: -2,
    confused: -1, lost: -2, failed: -2, pain: -2, fear: -2, worried: -1, bored: -1,
    // French
    mal: -1, horrible: -3, triste: -2, colere: -2, haine: -3, stressé: -2, fatigué: -1, accablant: -2,
    confus: -1, perdu: -2, échoué: -2, douleur: -2, peur: -2, inquiet: -1, ennuyé: -1,
    // 'terrible' is shared. 'anxieux' matches 'anxious' sound but different key.
};

const INTENSIFIERS = new Set([
    'very', 'really', 'extremely', 'absolutely', 'so',
    'très', 'vraiment', 'extrêmement', 'absolument', 'tellement'
]);

const NEGATIONS = new Set([
    'not', 'no', 'never', "don't", "didn't", "won't", "can't",
    'pas', 'non', 'jamais', 'im'
]);

export interface SentimentResult {
    score: number;
    comparative: number; // score / sqrt(count)
    tokens: string[];
}

export const analyzeSentiment = (text: string): number => {
    const tokens = text.toLowerCase().match(/\b[\w']+\b/g) || [];
    let score = 0;
    let count = 0;
    let negation = false;

    for (let i = 0; i < tokens.length; i++) {
        const word = tokens[i];

        if (NEGATIONS.has(word)) {
            negation = !negation; // Flip negation
            continue;
        }

        let val = 0;
        // @ts-ignore
        if (word in POSITIVE) val = POSITIVE[word];
        // @ts-ignore
        else if (word in NEGATIVE) val = NEGATIVE[word];

        if (val !== 0) {
            if (i > 0 && INTENSIFIERS.has(tokens[i - 1])) {
                val *= 1.5;
            }

            if (negation) {
                val *= -1;
                negation = false;
            }

            score += val;
            count++;
        }
    }

    return count > 0 ? score / Math.sqrt(count) : 0;
};

export const getWordFrequency = (texts: string[]): { text: string; value: number }[] => {
    const frequency: Record<string, number> = {};
    const stopWords = new Set(['the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'le', 'la', 'et', 'de', 'un', 'une', 'est', 'il', 'elle', 'pour', 'que', 'qui', 'dans', 'les', 'des', 'du', 'en', 'for', 'with', 'sur']);

    texts.forEach(text => {
        const tokens = text.toLowerCase().match(/\b[\w']+\b/g) || [];
        tokens.forEach(word => {
            if (word.length > 3 && !stopWords.has(word)) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });
    });

    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([text, value]) => ({ text, value }));
};
