// src/components/TenantSwitcher.jsx
import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function TenantSwitcher() {
  const { isSystemAdmin, activeTenant, switchTenant } = useAuth();
  const [schools, setSchools] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isSystemAdmin) {
      client.get("/schools").then(({ data }) => setSchools(data)).catch(() => {});
    }
  }, [isSystemAdmin]);

  if (!isSystemAdmin) return null;

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        {/* Inspection Status Indicator */}
        {activeTenant ? (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Inspecting: <strong>{activeTenant.name}</strong></span>
            <button
              onClick={() => switchTenant(null)}
              className="ml-2 font-bold underline hover:text-amber-950"
            >
              Exit Inspection
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <span>Switch Tenant Scope</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && !activeTenant && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Select School Workspace
          </div>
          <button
            onClick={() => { switchTenant(null); setIsOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 font-medium text-slate-600"
          >
            • System Wide View (Global)
          </button>
          {schools.map((s) => (
            <button
              key={s.id}
              onClick={() => { switchTenant(s); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-800"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}