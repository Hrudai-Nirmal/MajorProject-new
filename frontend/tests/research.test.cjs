// Verify the same ranking and period rules used by the research desk.
const test = require("node:test");
const assert = require("node:assert/strict");
const { rankPassages, quarterKey } = require("../lib/research-engine.cjs");
test("ranking finds an associated term and respects the candidate disclosure", () => {
  const index = {
    terms: { delays: [1, 0] },
    passages: [
      { id: "a", vector: [1, 0] },
      { id: "b", vector: [0, 1] },
    ],
  };
  assert.deepEqual(rankPassages("delays", index, ["b"]), []);
  assert.deepEqual(
    rankPassages("delays", index, ["a"]).map((row) => row.id),
    ["a"],
  );
  assert.deepEqual(rankPassages("zzzz", index, ["a"]), []);
});
test("equivalent fiscal quarter labels compare equally", () => {
  assert.equal(quarterKey("Q1 FY2026 (June)"), quarterKey("Q1 FY26"));
  assert.ok(quarterKey("Q2 FY2026") > quarterKey("Q1 FY26"));
});
