// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

const ADMIN_LEVEL_ROLES = ["admin", "headteacher", "deputy", "dos"];

const TEACHER_WORKSPACE_ROLES = [
  "teacher",
  "headteacher",
  "deputy",
  "dos",
];

function readStoredJson(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function readStoredTenant() {
  const tenant = readStoredJson("inspect_school");
  const tenantId = Number(localStorage.getItem("inspect_school_id"));

  if (
    !tenant ||
    !Number.isInteger(tenantId) ||
    tenantId <= 0 ||
    Number(tenant.id) !== tenantId
  ) {
    localStorage.removeItem("inspect_school");
    localStorage.removeItem("inspect_school_id");
    localStorage.removeItem("active_tenant_id");
    localStorage.removeItem("activeTenantId");
    return null;
  }

  return tenant;
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(() => {
    return readStoredJson("user");
  });

  const [school, setSchool] = useState(() => {
    return readStoredJson("school");
  });

  const [activeTenant, setActiveTenant] = useState(() => {
    return readStoredTenant();
  });

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      const token = localStorage.getItem("token");

      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const { data } = await client.get("/auth/me");

        if (cancelled) return;

        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);

        if (data.school) {
          localStorage.setItem("school", JSON.stringify(data.school));
          setSchool(data.school);
        } else {
          localStorage.removeItem("school");
          setSchool(null);
        }
      } catch (error) {
        if (!cancelled && error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("school");
          localStorage.removeItem("school_id");
          localStorage.removeItem("inspect_school");
          localStorage.removeItem("inspect_school_id");
          localStorage.removeItem("active_tenant_id");
          localStorage.removeItem("activeTenantId");

          setUser(null);
          setSchool(null);
          setActiveTenant(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, []);

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
      localStorage.removeItem("activeTenantId");
      localStorage.removeItem("school_id");

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

  const isTeacherWorkspaceUser = TEACHER_WORKSPACE_ROLES.includes(user?.role);

  // System Admin check: User has an admin role and is not permanently tied to a single school_id
  const isSystemAdmin = Boolean(user && !user.school_id && (user.role === "admin" || user.role === "system_admin"));

  const switchTenant = (targetSchool) => {
    if (targetSchool) {
      const tenantId = Number(targetSchool.id);

      if (!Number.isInteger(tenantId) || tenantId <= 0) {
        return;
      }

      const normalizedSchool = {
        ...targetSchool,
        id: tenantId,
      };

      localStorage.setItem("inspect_school_id", String(tenantId));
      localStorage.setItem("active_tenant_id", String(tenantId));
      localStorage.setItem("inspect_school", JSON.stringify(normalizedSchool));
      setActiveTenant(normalizedSchool);
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
        isTeacherWorkspaceUser,
        activeTenant,
        switchTenant,
        updateStoredUser,
        setSession,
        loading,
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