// src/api/client.js
import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
});

// Attach the JWT and tenant context to every outbound request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Support inspected tenant workspace (System Admin) or user's assigned school_id
  const tenantSchoolId =
    localStorage.getItem("active_tenant_id") ||
    localStorage.getItem("activeTenantId") ||
    localStorage.getItem("school_id");

  if (tenantSchoolId) {
    config.headers["X-School-Id"] = tenantSchoolId;
  }

  return config;
});

// Handle expired sessions or rotated JTI tokens
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("school_id");
      localStorage.removeItem("active_tenant_id");
      localStorage.removeItem("activeTenantId");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default client;