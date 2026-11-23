// Each known ticker resolves to a bundled image; unrecognized companies use the shared mark.
const test = require("node:test");
const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const path = require("node:path");
const {getLogoPath,logoTickers} = require("../lib/company-logos.cjs");
test("company aliases resolve consistently and unknown tickers use the fallback",()=>{
  assert.equal(getLogoPath("hdfc"),getLogoPath("HDFCBANK"));
  assert.equal(getLogoPath("RIL"),getLogoPath("RELIANCE"));
  assert.equal(getLogoPath("unexpected/../symbol"),null);
  for(const symbol of logoTickers){
    const bytes=readFileSync(path.join(__dirname,"../public",getLogoPath(symbol)));
    assert.equal(bytes.toString("ascii",1,4),"PNG");
  }
});
test("new company tickers resolve to bundled logos",()=>{
  for(const ticker of ["IBM","ABNB","GOOGL","WIPRO","ICICIBANK","MARUTI"]){
    const logoPath=getLogoPath(ticker);
    assert.equal(logoPath,`/logos/${ticker}.png`);
    const bytes=readFileSync(path.join(__dirname,"../public",logoPath));
    assert.equal(bytes.toString("ascii",1,4),"PNG");
  }
});
