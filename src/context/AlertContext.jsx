import { createContext, useCallback, useContext, useRef, useState } from "react";

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  // Returns a Promise<boolean>
  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        title: opts.title || "Are you sure?",
        message: opts.message || "",
        confirmText: opts.confirmText || "Confirm",
        cancelText: opts.cancelText || "Cancel",
        danger: opts.danger ?? false,
        resolve,
      });
    });
  }, []);

  function resolveConfirm(result) {
    confirmState?.resolve(result);
    setConfirmState(null);
  }

  const notify = useCallback((opts) => {
    const id = ++idRef.current;

    setToasts((prev) => [
      ...prev,
      {
        id,
        type: opts.type || "success",
        message: opts.message,
      },
    ]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, opts.duration || 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastStyles = (type) => {
    switch (type) {
      case "error":
        return {
          container:
            "border-red-200 bg-white text-slate-800 shadow-xl shadow-red-100/50",
          icon:
            "bg-red-100 text-red-600",
          progress: "bg-red-500",
        };

      case "warning":
        return {
          container:
            "border-amber-200 bg-white text-slate-800 shadow-xl shadow-amber-100/50",
          icon:
            "bg-amber-100 text-amber-600",
          progress: "bg-amber-500",
        };

      case "info":
        return {
          container:
            "border-blue-200 bg-white text-slate-800 shadow-xl shadow-blue-100/50",
          icon:
            "bg-blue-100 text-blue-600",
          progress: "bg-blue-500",
        };

      default:
        return {
          container:
            "border-emerald-200 bg-white text-slate-800 shadow-xl shadow-emerald-100/50",
          icon:
            "bg-emerald-100 text-emerald-600",
          progress: "bg-emerald-500",
        };
    }
  };

  return (
    <AlertContext.Provider value={{ confirm, notify }}>
      {children}

      {/* Confirmation modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ animation: "alertPopIn 0.18s ease-out" }}
          >
            <div className="p-6">
              <div
                className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
                  confirmState.danger
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                {confirmState.danger ? (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86 2.11 18.04A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0Z"
                    />
                  </svg>
                ) : (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path
                      strokeLinecap="round"
                      d="M12 8v4m0 4h.01"
                    />
                  </svg>
                )}
              </div>

              <h2 className="text-center text-xl font-semibold text-slate-900">
                {confirmState.title}
              </h2>

              {confirmState.message && (
                <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                  {confirmState.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => resolveConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {confirmState.cancelText}
              </button>

              <button
                type="button"
                onClick={() => resolveConfirm(true)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
                  confirmState.danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[var(--color-navy)] hover:opacity-90"
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed right-4 top-4 z-[250] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);

          return (
            <div
              key={toast.id}
              className={`relative overflow-hidden rounded-2xl border ${styles.container}`}
              style={{
                animation: "alertSlideIn 0.22s ease-out",
              }}
            >
              <div className="flex items-start gap-3 p-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.icon}`}
                >
                  {toast.type === "error" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4m0 4h.01" />
                    </svg>
                  ) : toast.type === "warning" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3 2.7 19a2 2 0 0 0 1.73 3h15.14a2 2 0 0 0 1.73-3L12 3Z"
                      />
                      <path d="M12 9v4m0 4h.01" />
                    </svg>
                  ) : toast.type === "info" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 10v6m0-9h.01" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.5 12 2.3 2.3 4.7-5"
                      />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-slate-900">
                    {toast.type === "error"
                      ? "Something went wrong"
                      : toast.type === "warning"
                      ? "Warning"
                      : toast.type === "info"
                      ? "Information"
                      : "Success"}
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {toast.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close notification"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <div
                className={`h-1 ${styles.progress}`}
                style={{
                  animation: "toastProgress 4s linear forwards",
                }}
              />
            </div>
          );
        })}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);

  if (!ctx) {
    throw new Error("useAlert must be used within AlertProvider");
  }

  return ctx;
}

