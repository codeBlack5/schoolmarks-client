import { createContext, useCallback, useContext, useRef, useState } from "react";

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  // Returns a Promise<boolean> — resolves true if the person clicks confirm.
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
    setToasts((prev) => [...prev, { id, type: opts.type || "success", message: opts.message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, opts.duration || 4000);
  }, []);

  return (
    <AlertContext.Provider value={{ confirm, notify }}>
      {children}

      {confirmState && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center" style={{ animation: "alertPopIn 0.15s ease-out" }}>
            <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${confirmState.danger ? "bg-red-100" : "bg-amber-100"}`}>
              {confirmState.danger ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              )}
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">{confirmState.title}</h2>
            {confirmState.message && <p className="text-sm text-slate-500 mb-5">{confirmState.message}</p>}
            <div className="flex gap-2">
              <button onClick={() => resolveConfirm(false)} className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">
                {confirmState.cancelText}
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: confirmState.danger ? "#dc2626" : "var(--color-navy)" }}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-[110] space-y-2 w-[calc(100%-2rem)] max-w-xs">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ animation: "alertSlideIn 0.2s ease-out" }}
            className={`rounded-lg shadow-lg px-4 py-3 text-sm text-white ${
              t.type === "error" ? "bg-red-600" : t.type === "success" ? "bg-green-600" : "bg-slate-800"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
}
