// Browse routes should use the viewport width and leave each pane unboxed.
const test = require("node:test");
const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const path = require("node:path");

test("browse workspaces escape the shared content width", () => {
  const css = readFileSync(path.join(__dirname,"../app/globals.css"),"utf8");
  assert.match(css, /main#content:has\(\.workspace-wide\)\s*\{[^}]*max-width:\s*none/s);
});

test("company panes have no outer card border", () => {
  const browser = readFileSync(path.join(__dirname,"../components/company-browser.tsx"),"utf8");
  const details = readFileSync(path.join(__dirname,"../components/company-details.tsx"),"utf8");
  assert.match(browser, /<section className="company-pane/);
  assert.match(details, /<section className="company-pane/);
});

test("compare uses search dropdowns instead of persistent company lists", () => {
  const compare = readFileSync(path.join(__dirname,"../components/compare-view.tsx"),"utf8");
  assert.equal((compare.match(/variant="dropdown"/g) || []).length, 2);
});
