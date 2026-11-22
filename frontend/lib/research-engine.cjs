const QUESTION_WORDS = new Set(
  "what did how does the company say says said drove changes change about between and from this quarter".split(
    " ",
  ),
);
function queryWords(query) {
  return (query.toLowerCase().match(/[a-z]{2,}/g) || [])
    .filter((w) => !QUESTION_WORDS.has(w))
    .flatMap((w) => (w.endsWith("s") ? [w, w.slice(0, -1)] : [w]));
}
/** Rank a filtered collection using semantic similarity and direct topic mentions. */
function rankPassages(query, index, allowed) {
  const words = queryWords(query);
  const weights = words
    .filter((word) => Object.hasOwn(index.terms, word))
    .map((word) => index.terms[word]);
  if (!weights.length) return [];
  const vector = weights[0].map((_, i) =>
    weights.reduce((sum, term) => sum + term[i], 0),
  );
  const norm = Math.hypot(...vector);
  if (!norm) return [];
  const candidates = new Set(allowed);
  return index.passages
    .filter((p) => candidates.has(p.id))
    .map((p) => ({
      id: p.id,
      score:
        p.vector.reduce((sum, value, i) => sum + value * vector[i], 0) / norm +
        (p.text &&
        words.some((w) => new RegExp("\\b" + w + "s?\\b", "i").test(p.text))
          ? 0.32
          : 0),
    }))
    .filter((p) => p.score >= 0.22)
    .sort((a, b) => b.score - a.score);
}
/** Normalize fiscal periods before offering historical comparisons. */
function quarterKey(period) {
  const match = String(period).match(/Q([1-4])\s*(?:FY|CY)\s*(\d{2,4})/i);
  return match ? Number(match[2].slice(-2)) * 4 + Number(match[1]) : -1;
}
/** Retrieve a complete source sentence in response to a question, preserving decimals. */
function answerSentence(query, text, index) {
  const candidates = text
    .split(/(?<=[.!?])\s+(?=[A-Z“"])/)
    .filter(
      (s) =>
        s.split(/\s+/).length >= 5 &&
        !/this (text|summary)|summary excerpt|sentiment analys|full transcript/i.test(
          s,
        ),
    );
  const rows = candidates.flatMap((sentence, i) => {
    const terms = (sentence.toLowerCase().match(/[a-z]{2,}/g) || []).filter(
      (t) => Object.hasOwn(index.terms, t),
    );
    if (!terms.length) return [];
    const vector = index.terms[terms[0]].map((_, j) =>
      terms.reduce((sum, t) => sum + index.terms[t][j], 0),
    );
    const norm = Math.hypot(...vector) || 1;
    return [
      {
        id: String(i),
        text: sentence,
        vector: vector.map((value) => value / norm),
      },
    ];
  });
  const hit = rankPassages(
    query,
    { terms: index.terms, passages: rows },
    rows.map((r) => r.id),
  )[0];
  return hit ? candidates[Number(hit.id)].trim() : null;
}
module.exports = { rankPassages, quarterKey, answerSentence };
