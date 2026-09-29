import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children, contentClassName = "" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      {open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[1px] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        <Sidebar open={open} onClose={() => setOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="
              sticky top-0 z-20 flex min-h-14 items-center gap-3
              border-b border-slate-200 bg-white/95 px-4 py-3
              backdrop-blur md:hidden
            "
            style={{
              paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={open}
              aria-controls="app-navigation"
              className="
                flex h-10 w-10 shrink-0 items-center justify-center
                rounded-lg border border-slate-200 bg-white
                text-slate-700 shadow-sm
                transition hover:bg-slate-50
                focus:outline-none focus:ring-2 focus:ring-slate-300
              "
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold"
                style={{ color: "var(--color-navy)" }}
              >
                Steelo Analytics
              </p>
              <p className="truncate text-[11px] text-slate-400">
                School Management & Analytics
              </p>
            </div>
          </header>

          <main
            className={`
              min-w-0 flex-1 overflow-x-hidden
              ${contentClassName}
            `}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
