// ─────────────────────────────────────────────────────────────────────────────
// ArabicTextNormalizer
// Utilities for normalizing Arabic text before search / comparison.
// IMPORTANT: normalization is applied only at query/match time.
//            Stored text is never modified.
// ─────────────────────────────────────────────────────────────────────────────

/** Unicode range for Arabic characters (Basic Arabic block). */
const ARABIC_CHAR_REGEX = /[\u0600-\u06FF]/;

/**
 * Arabic diacritics (tashkeel / harakat) range:
 *   \u064B-\u065F — fathah, dammah, kasrah, tanwin, sukun, shadda, etc.
 *   \u0670        — superscript alef (alef waslah vowel)
 */
const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;

// ── Individual normalisation helpers ─────────────────────────────────────────

/** Remove all tashkeel (diacritics) from Arabic text. */
function removeTashkeel(input: string): string {
  return input.replace(TASHKEEL_REGEX, '');
}

/**
 * Normalise all Alef variants to the plain Alef (ا):
 *   أ  (U+0623) — Alef with hamza above
 *   إ  (U+0625) — Alef with hamza below
 *   آ  (U+0622) — Alef with madda above
 *   ٱ  (U+0671) — Alef wasla
 */
function normalizeAlef(input: string): string {
  return input.replace(/[أإآٱ]/g, 'ا');
}

/**
 * Normalise Teh Marbuta (ة U+0629) to Heh (ه U+0647).
 * Example: "خدمة" → "خدمه" for matching purposes only.
 */
function normalizeTehMarbuta(input: string): string {
  return input.replace(/ة/g, 'ه');
}

/**
 * Normalise Alef Maqsura (ى U+0649) to Yeh (ي U+064A).
 * Example: "إلى" → "إلي" for matching purposes only.
 */
function normalizeAlifMaqsura(input: string): string {
  return input.replace(/ى/g, 'ي');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Apply the full Arabic normalisation pipeline.
 * Use this on BOTH the user query and the stored text before comparing.
 *
 * Pipeline:
 *   1. Trim and lowercase (covers any embedded Latin characters)
 *   2. Remove tashkeel
 *   3. Normalise Alef variants → ا
 *   4. Normalise Teh Marbuta → ه
 *   5. Normalise Alef Maqsura → ي
 */
export function normalizeArabic(input: string): string {
  let result = input.trim().toLowerCase();
  result = removeTashkeel(result);
  result = normalizeAlef(result);
  result = normalizeTehMarbuta(result);
  result = normalizeAlifMaqsura(result);
  return result;
}

/**
 * Detect whether the input string is predominantly Arabic.
 * Returns 'ar' if any Arabic Unicode character is found, 'en' otherwise.
 */
export function detectLanguage(input: string): 'ar' | 'en' {
  return ARABIC_CHAR_REGEX.test(input) ? 'ar' : 'en';
}

/**
 * Tokenise an input string into normalised search tokens.
 * - Splits on whitespace and common punctuation (Arabic and Latin).
 * - Applies normaliseArabic() to each token when the text is Arabic.
 * - Filters out single-character tokens that are unlikely to be meaningful.
 */
export function tokenize(input: string): string[] {
  const lang = detectLanguage(input);

  const normalizedInput = lang === 'ar'
    ? normalizeArabic(input)
    : input.trim().toLowerCase();

  return normalizedInput
    // Split on whitespace + Arabic/Latin punctuation
    .split(/[\s\u060C\u061B\u061F،,.!?;:()\[\]{}"'''"-]+/)
    .map(t => t.trim())
    // Drop tokens that are too short to be useful
    .filter(t => t.length > 1);
}
