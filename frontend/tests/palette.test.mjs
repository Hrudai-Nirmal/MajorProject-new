import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tailwindConfig = readFileSync(new URL("../tailwind.config.ts", import.meta.url), "utf8");
const globalsCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const avatarSource = readFileSync(new URL("../components/CompanyAvatar.tsx", import.meta.url), "utf8");

assert.match(tailwindConfig, /brandInk/, "tailwind config should define the core ink token");
assert.match(tailwindConfig, /signalCobalt/, "tailwind config should define the primary cobalt token");
assert.match(tailwindConfig, /statementAmber/, "tailwind config should define the India/accent amber token");
assert.match(tailwindConfig, /boxShadow/, "tailwind config should define harder neo-brutalist shadows");
assert.match(globalsCss, /--surface-grid/, "global CSS should expose the background grid token");
assert.doesNotMatch(globalsCss, /#c7d2fe/, "selection color should not use the old indigo default");
assert.doesNotMatch(
  `${tailwindConfig}\n${dashboardSource}\n${avatarSource}`,
  /emerald/,
  "visible palette should not use green/emerald tokens"
);
