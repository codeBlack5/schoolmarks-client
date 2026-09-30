import { ArrowLeft, Construction } from "lucide-react";
import { Link } from "react-router-dom";

export default function UnderConstruction({
  title = "Page under construction",
  description = "We're working on this feature to make it useful and reliable for your school.",
  backTo = "/teacher/dashboard",
  backLabel = "Back to Dashboard",
}) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-slate-800 via-blue-600 to-slate-300" />

          <div className="px-5 py-10 text-center sm:px-10 sm:py-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 sm:h-20 sm:w-20">
              <Construction className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.8} />
            </div>

            <div className="mt-6">
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200">
                Coming soon
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              {description}
            </p>

            <p className="mt-3 text-sm font-medium text-slate-500">
              It will be available soon.
            </p>

            <div className="mt-8">
              <Link
                to={backTo}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Steelo Analytics · School Management &amp; Analytics
        </p>
      </div>
    </div>
  );
}
