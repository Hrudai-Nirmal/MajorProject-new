// Deterministic monogram avatar, no external logo API involved (Clearbit's
// free logo API — the obvious choice here — was permanently shut down in
// Dec 2025, and its replacements all require signing up for an API token,
// which isn't worth the extra account/credential for a course pilot). A
// ticker-based color hash gives each company a stable, distinct badge with
// zero network dependency, so it never breaks or shows a broken-image icon.

export function CompanyAvatar({
  ticker,
  size = "md",
}: {
  ticker: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeCls = size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  const initials = ticker.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
  return (
    <span
      className={`company-avatar flex shrink-0 items-center justify-center font-bold ${sizeCls}`}
    >
      {initials}
    </span>
  );
}
