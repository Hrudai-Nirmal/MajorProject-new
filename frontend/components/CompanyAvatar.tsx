// Deterministic monogram avatar, no external logo API involved (Clearbit's
// free logo API — the obvious choice here — was permanently shut down in
// Dec 2025, and its replacements all require signing up for an API token,
// which isn't worth the extra account/credential for a course pilot). A
// ticker-based color hash gives each company a stable, distinct badge with
// zero network dependency, so it never breaks or shows a broken-image icon.

const PALETTE = [
  { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
  { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
];

function paletteFor(ticker: string) {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = (hash * 31 + ticker.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function CompanyAvatar({
  ticker,
  size = "md",
}: {
  ticker: string;
  size?: "sm" | "md" | "lg";
}) {
  const { bg, text, ring } = paletteFor(ticker);
  const sizeCls = size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  const initials = ticker.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold ring-1 ring-inset ${bg} ${text} ${ring} ${sizeCls}`}
    >
      {initials}
    </span>
  );
}
