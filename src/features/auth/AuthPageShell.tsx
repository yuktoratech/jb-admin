import type { ReactNode } from "react";

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
}: AuthPageShellProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#F7F7F7] px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-neutral-200 bg-white lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden min-h-[620px] flex-col justify-between bg-black p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded bg-[#7A1F2B] text-xs font-bold tracking-wide">JB</span>
            <div>
              <p className="text-sm font-bold tracking-[0.15em]">JUST BLACK</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Administration</p>
            </div>
          </div>

          <div className="max-w-md">
            <div className="mb-5 h-0.5 w-12 bg-[#7A1F2B]" />
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">Secure account recovery</h1>
            <p className="mt-4 text-sm leading-7 text-neutral-400">Reset access to the Just Black administration portal through your registered email address.</p>
          </div>

          <p className="text-xs text-neutral-600">Authorized administrators only</p>
        </section>

        <section className="flex min-h-[560px] items-center justify-center px-5 py-10 sm:px-12 lg:min-h-[620px] lg:px-20">
          <div className="w-full max-w-sm">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded bg-[#7A1F2B] text-xs font-bold tracking-wide text-white">JB</span>
              <div>
                <p className="text-sm font-bold tracking-[0.15em] text-black">JUST BLACK</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Administration</p>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A1F2B]">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
