type LoadingSpinnerProps = {
  label?: string;
  fullScreen?: boolean;
  className?: string;
};

export function LoadingSpinner({
  label = "Loading",
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className="h-8 w-8 animate-spin text-slate-900"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );

  if (!fullScreen) {
    return spinner;
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-6">
      {spinner}
    </div>
  );
}

