// Default browse pages must be CDN-ready while bookmarked selections retain their filters.
const test = require("node:test");
const assert = require("node:assert/strict");
const config = require("../next.config.js");
test("query selections route to the interactive views before static page resolution",async()=>{
  const {beforeFiles}=await config.rewrites();
  for(const [path,key] of [["library","source"],["compare","us"],["compare","india"]])
    assert.ok(beforeFiles.some(rule=>rule.source==="/"+path && rule.has?.some(filter=>filter.type==="query" && filter.key===key) && rule.destination==="/"+path+"/selection"));
});
