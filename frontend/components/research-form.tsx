"use client";
/** Keep GET filters shareable while navigating without a full document reload. */
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
export function ResearchForm({
  action,
  className,
  children,
}: {
  action?: string;
  className: string;
  children: React.ReactNode;
}) {
  const router = useRouter(),
    pathname = usePathname();
  const [pending, start] = useTransition();
  return (
    <form
      action={action}
      className={className}
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        const filters = new URLSearchParams();
        new FormData(event.currentTarget).forEach((value, key) => {
          if (typeof value === "string" && value.trim())
            filters.set(key, value.trim());
        });
        start(() =>
          router.push((action || pathname) + "?" + filters, { scroll: false }),
        );
      }}
    >
      {children}
      {pending && (
        <span role="status" className="muted">
          Updating results…
        </span>
      )}
    </form>
  );
}
