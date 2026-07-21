// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

const ADMIN_LEVEL_ROLES = ["admin", "headteacher", "deputy", "dos"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [school, setSchool] = useState(() => {
    const stored = localStorage.getItem("school");
    return stored ? JSON.parse(stored) : null;
  });

  const [activeTenant, setActiveTenant] = useState(() => {
    const saved = localStorage.getItem("inspect_school");
    return saved ? JSON.parse(saved) : null;
  });

  function setSession(token, sessionUser, sessionSchool) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(sessionUser));
    setUser(sessionUser);

    if (sessionSchool) {
      localStorage.setItem("school", JSON.stringify(sessionSchool));
      setSchool(sessionSchool);
    }
  }

  async function login(email, password) {
    const { data } = await client.post("/auth/login", { email, password });
    setSession(data.token, data.user, data.school);
    return data.user;
  }

  async function logout() {
    try {
      await client.post("/auth/logout");
    } finally {
      // Clear authentication & tenant inspection keys
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("school");
      localStorage.removeItem("inspect_school");
      localStorage.removeItem("inspect_school_id");
      localStorage.removeItem("active_tenant_id");
      
      setUser(null);
      setSchool(null);
      setActiveTenant(null);
    }
  }

  function updateStoredUser(updatedUser) {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  // Admin access inside a school workspace
  const isAdmin = ADMIN_LEVEL_ROLES.includes(user?.role);

  // System Admin check: User has an admin role and is not permanently tied to a single school_id
  const isSystemAdmin = Boolean(user && !user.school_id && (user.role === "admin" || user.role === "system_admin"));

  const switchTenant = (targetSchool) => {
    if (targetSchool) {
      localStorage.setItem("inspect_school_id", targetSchool.id);
      localStorage.setItem("active_tenant_id", targetSchool.id);
      localStorage.setItem("inspect_school", JSON.stringify(targetSchool));
      setActiveTenant(targetSchool);
    } else {
      localStorage.removeItem("inspect_school_id");
      localStorage.removeItem("active_tenant_id");
      localStorage.removeItem("inspect_school");
      setActiveTenant(null);
    }
    // Reload active page data under new tenant scope
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        school: activeTenant || school,
        login,
        logout,
        isAdmin,
        isSystemAdmin,
        activeTenant,
        switchTenant,
        updateStoredUser,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}