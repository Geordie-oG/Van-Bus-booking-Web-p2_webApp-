"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: "customer" | "administrator";
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchPersona: (role: "customer" | "administrator", name?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  switchPersona: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Check current session from /api/auth/me
  const checkSession = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setUser(data.data);
      } else {
        // Check saved demo persona in localStorage if available
        const savedPersona = localStorage.getItem("demo_user_persona");
        if (savedPersona) {
          setUser(JSON.parse(savedPersona));
        } else {
          // Default demo customer persona for Ye Htet Aung
          const defaultPersona: UserSession = {
            userId: "670f1a2b3c4d5e6f7a8b9c0d",
            name: "Ye Htet Aung",
            email: "yehtetaung@example.com",
            role: "customer",
          };
          setUser(defaultPersona);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Login failed" };
      }
      setUser(data.data.user);
      localStorage.setItem("demo_user_persona", JSON.stringify(data.data.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Registration failed" };
      }
      setUser(data.data.user);
      localStorage.setItem("demo_user_persona", JSON.stringify(data.data.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    localStorage.removeItem("demo_user_persona");
  };

  const switchPersona = (role: "customer" | "administrator", name?: string) => {
    const newPersona: UserSession = {
      userId: role === "administrator" ? "670f1a2b3c4d5e6f7a8b9c0e" : "670f1a2b3c4d5e6f7a8b9c0d",
      name: name || (role === "administrator" ? "Transport Admin" : "Ye Htet Aung"),
      email: role === "administrator" ? "admin@transport.com" : "yehtetaung@example.com",
      role,
    };
    setUser(newPersona);
    localStorage.setItem("demo_user_persona", JSON.stringify(newPersona));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, switchPersona }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

