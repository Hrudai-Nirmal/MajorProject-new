/** Summarize the recorded same-model benchmark without changing its source data. */
const SENTIMENT_LABELS = ["positive", "negative", "neutral"];

/** Calculate macro-F1 and agreements for the fixed matched sample. */
function getMatchedMetrics(rows, matchedChunkIds) {
  const matchedIds = new Set(matchedChunkIds);
  const result = {
    US: { count: 0, agreements: 0, macroF1: 0 },
    India: { count: 0, agreements: 0, macroF1: 0 },
  };
  for (const market of ["US", "India"]) {
    const marketRows = rows.filter((row) => matchedIds.has(row.chunk_id) && row.market === market);
    const classScores = SENTIMENT_LABELS.map((label) => {
      const truePositives = marketRows.filter((row) => row.gold_sentiment === label && row.qwen_prediction === label).length;
      const falsePositives = marketRows.filter((row) => row.gold_sentiment !== label && row.qwen_prediction === label).length;
      const falseNegatives = marketRows.filter((row) => row.gold_sentiment === label && row.qwen_prediction !== label).length;
      const denominator = 2 * truePositives + falsePositives + falseNegatives;
      return denominator ? (2 * truePositives) / denominator : 0;
    });
    result[market] = {
      count: marketRows.length,
      agreements: marketRows.filter((row) => row.gold_sentiment === row.qwen_prediction).length,
      macroF1: classScores.reduce((sum, score) => sum + score, 0) / SENTIMENT_LABELS.length,
    };
  }
  return result;
}

module.exports = { getMatchedMetrics };
