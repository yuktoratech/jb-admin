import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return <div className="flex min-h-56 items-center justify-center px-6 py-12"><LoadingSpinner label={label} /></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M4 7.5h16M6 4h12l2 3.5V20H4V7.5L6 4Z" /><path d="M9 12h6" />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-neutral-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Unable to load data", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full border border-red-200 bg-red-50 text-red-700">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M12 7.5v6M12 17h.01" />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-neutral-500">{message}</p>
      {onRetry ? <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}
