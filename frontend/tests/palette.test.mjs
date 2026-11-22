/** Verify that the requested dark canvas and its primary reading colors stay accessible. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");
function luminance(token) {
  const hex=css.match(new RegExp("--"+token+":\\s*#([0-9a-f]{6})","i"))?.[1];
  assert.ok(hex,"Missing theme color "+token);
  const linear=hex.match(/../g).map(pair=>parseInt(pair,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return linear[0]*0.2126+linear[1]*0.7152+linear[2]*0.0722;
}
assert.ok(luminance("canvas")<0.05);
for(const token of ["ink","muted","accent"]){
  assert.ok((luminance(token)+0.05)/(luminance("panel")+0.05)>=4.5,token+" has insufficient contrast");
}
