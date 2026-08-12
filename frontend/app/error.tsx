"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="system-state">
      <p className="mono-label">System error / Recovery</p>
      <h1>The press stopped.</h1>
      <p>Something interrupted this page. Retry the request to continue your research.</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
