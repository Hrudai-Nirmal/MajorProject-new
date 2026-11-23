/** Verify matched benchmark scores come from the recorded passage predictions. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { getMatchedMetrics } = require("../lib/benchmark-sensitivity.cjs");

test("calculates matched count, agreement, and macro F1 by market", () => {
  const rows = [
    { chunk_id: "u1", market: "US", gold_sentiment: "positive", qwen_prediction: "positive" },
    { chunk_id: "u2", market: "US", gold_sentiment: "negative", qwen_prediction: "neutral" },
    { chunk_id: "i1", market: "India", gold_sentiment: "neutral", qwen_prediction: "neutral" },
  ];
  const metrics = getMatchedMetrics(rows, ["u1", "u2", "i1"]);
  assert.deepEqual(metrics.US, { count: 2, agreements: 1, macroF1: 1 / 3 });
  assert.deepEqual(metrics.India, { count: 1, agreements: 1, macroF1: 1 / 3 });
});
