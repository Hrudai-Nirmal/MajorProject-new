// Company search stays alphabetical and groups multiple disclosures under one ticker.
const test = require("node:test");
const assert = require("node:assert/strict");
const {getCompanyOptions, searchCompanies} = require("../lib/company-browser.cjs");

const sample = [
  {id:"2",company:"Zeta Ltd",ticker:"Z",market:"US"},
  {id:"1",company:"Alpha Inc",ticker:"A",market:"US"},
  {id:"3",company:"Alpha Inc",ticker:"A",market:"US"},
  {id:"6",company:"Alpha Inc Ltd",ticker:"A",market:"US"},
  {id:"4",company:"Beta Bank",ticker:"B",market:"India"},
  {id:"5",company:"Beta Bank",ticker:"BETA",market:"India"},
];

test("groups disclosures and sorts companies by name",()=>{
  const options=getCompanyOptions(sample);
  assert.deepEqual(options.map(option=>option.company),["Alpha Inc","Beta Bank","Zeta Ltd"]);
  assert.equal(options[0].documents.length,3);
  assert.equal(options[1].documents.length,2);
});

test("search matches company and ticker within one market",()=>{
  const options=getCompanyOptions(sample);
  assert.deepEqual(searchCompanies(options," a ","US").map(option=>option.ticker),["A","Z"]);
  assert.deepEqual(searchCompanies(options,"b","India").map(option=>option.ticker),["B"]);
  assert.deepEqual(searchCompanies(options,"BETA","India").map(option=>option.ticker),["B"]);
});
