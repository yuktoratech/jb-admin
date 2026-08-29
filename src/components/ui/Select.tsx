import { forwardRef, type SelectHTMLAttributes, useId } from "react";

import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, className, required, children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? props.name ?? generatedId;
  const messageId = `${selectId}-message`;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-neutral-800">
          {label}
          {required ? <span className="ml-1 text-[#7A1F2B]">*</span> : null}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(
          "h-11 w-full rounded-md border bg-white px-3.5 text-sm text-neutral-950 outline-none transition-colors focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#7A1F2B]/10 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
          error ? "border-red-500" : "border-neutral-300",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error || hint ? (
        <p id={messageId} className={cn("mt-1.5 text-xs leading-5", error ? "text-red-700" : "text-neutral-500")}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
});
