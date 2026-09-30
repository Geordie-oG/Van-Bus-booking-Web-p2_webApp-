"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface AuthUser {
  userId?: string;
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

function BusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 22, height: 22 }}>
      <path d="M6 3h12a3 3 0 0 1 3 3v10a2 2 0 0 1-2 2h-1v2a1 1 0 0 1-2 0v-2H8v2a1 1 0 0 1-2 0v-2H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v5h14V6a1 1 0 0 0-1-1H6Zm-.5 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm13 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Try localStorage first for instant render
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
        setLoading(false);
      }
    } catch {
      // ignore
    }

    // Then verify with server
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("not authenticated");
        return res.json();
      })
      .then((data) => {
        if (data?.data) {
          setUser(data.data);
          localStorage.setItem("user", JSON.stringify(data.data));
        }
      })
      .catch(() => {
        // Token invalid or expired – clear stale data
        const stored = localStorage.getItem("user");
        if (stored) {
          localStorage.removeItem("user");
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    setUser(null);
    router.push("/login");
  }

  const isAdmin = user?.role === "administrator";

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <Link href="/" className="brand">
          <span className="brand-icon">
            <BusIcon />
          </span>
          <span>
            <strong>GoRoute</strong>
            <small>VAN &amp; BUS BOOKING</small>
          </span>
        </Link>

        {/* Centre Nav Links */}
        <nav className="nav-links">
          <Link href="/" className={pathname === "/" ? "active" : ""}>
            Home
          </Link>
          <Link href="/trips" className={pathname.startsWith("/trips") ? "active" : ""}>
            Find Trips
          </Link>
          <Link href="/bookings" className={pathname === "/bookings" ? "active" : ""}>
            My Bookings
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={pathname.startsWith("/admin") ? "active" : ""}
              style={{ color: "#2563eb", fontWeight: 700 }}
            >
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {loading ? (
            <span style={{ color: "#8496a9", fontSize: 13 }}>Loading...</span>
          ) : user ? (
            <div className="nav-user-group">
              <div className="nav-user-info">
                <span className="nav-user-avatar">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </span>
                <div className="nav-user-details">
                  <span className="nav-user-name">{user.name}</span>
                  <span className={`nav-user-role ${isAdmin ? "admin" : "customer"}`}>
                    {isAdmin ? "Admin" : "Customer"}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-button">
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="login-link">
                Log in
              </Link>
              <Link href="/register" className="primary-button small-button">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
