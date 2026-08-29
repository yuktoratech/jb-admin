import { forwardRef, type InputHTMLAttributes, useId } from "react";

import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, required, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-neutral-800">
          {label}
          {required ? <span className="ml-1 text-[#7A1F2B]">*</span> : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(
          "h-11 w-full rounded-md border bg-white px-3.5 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#7A1F2B]/10 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
          error ? "border-red-500" : "border-neutral-300",
          className,
        )}
        {...props}
      />
      {error || hint ? (
        <p id={messageId} className={cn("mt-1.5 text-xs leading-5", error ? "text-red-700" : "text-neutral-500")}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
});
