import Link from "next/link";

export default function NotFound() {
  return (
    <div className="system-state">
      <div className="system-code" aria-hidden="true">404</div>
      <p className="mono-label">Error 404 / Missing page</p>
      <h1>This page missed the edition.</h1>
      <p>The requested disclosure may have moved, been removed, or never entered this research index.</p>
      <div className="system-actions">
        <Link href="/" className="ink-button">Return to disclosures</Link>
        <Link href="/chat" className="outline-button">Ask the research desk</Link>
      </div>
    </div>
  );
}
