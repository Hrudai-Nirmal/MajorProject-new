"use client";

import { useEffect, useRef } from "react";
import { RefreshCw, X } from "lucide-react";

export function ModelOutputModal({
  open,
  question,
  reason,
  onClose,
  onRetry,
}: {
  open: boolean;
  question: string;
  reason: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  const retryRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    retryRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
        );
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="model-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="model-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="model-modal-title"
        aria-describedby="model-modal-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="model-modal-header">
          <span className="mono-label">Model status / No output</span>
          <button type="button" className="model-modal-close" onClick={onClose} aria-label="Close dialog">
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="model-modal-body">
          <span className="model-modal-code" aria-hidden="true">NO/OUTPUT</span>
          <h2 id="model-modal-title">The model returned a blank page.</h2>
          <p id="model-modal-description">
            {reason} Your question is still here, so you can retry without typing it again.
          </p>
          <blockquote>{question}</blockquote>
        </div>
        <div className="model-modal-actions">
          <button type="button" onClick={onClose}>Dismiss</button>
          <button ref={retryRef} type="button" className="primary-action" onClick={onRetry}>
            <RefreshCw aria-hidden="true" size={16} /> Retry request
          </button>
        </div>
      </section>
    </div>
  );
}
