// Check the published catalog used to render library cards and comparisons.
const {test}=require("node:test");
const assert=require("node:assert/strict");
test("every published disclosure has card metadata and financial rows reference real disclosures",()=>{
  const corpus=require("../research-data/corpus.json");
  const catalog=require("../research-data/catalog.json");
  const ids=new Set(corpus.documents.map(d=>d.id));
  assert.deepEqual(new Set(catalog.documents.map(d=>d.id)),ids);
  assert.ok(catalog.financials.length>0);
  for(const doc of catalog.documents)assert.ok(Number.isInteger(doc.risk_count)&&doc.doc_type);
  for(const row of catalog.financials)assert.ok(ids.has(row.document_id));
});
