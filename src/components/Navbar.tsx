"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, Ticket, ShieldCheck, User, LogOut, LogIn, ChevronDown, Car, Calendar, Menu, X, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, switchPersona } = useAuth();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "administrator";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Van & Bus</span>
            <span className="text-[10px] ml-1.5 font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              CSX4107
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            href="/trips"
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              pathname === "/trips" || pathname.startsWith("/trips/")
                ? "text-emerald-700 bg-emerald-50 font-semibold"
                : "text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
            }`}
          >
            <Bus className="w-4 h-4 text-slate-500" />
            <span>Trips</span>
          </Link>

          <Link
            href="/my-bookings"
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              pathname === "/my-bookings"
                ? "text-emerald-700 bg-emerald-50 font-semibold"
                : "text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
            }`}
          >
            <Ticket className="w-4 h-4 text-slate-500" />
            <span>My Bookings</span>
          </Link>

          {/* Admin Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              onBlur={() => setTimeout(() => setAdminMenuOpen(false), 200)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname.startsWith("/admin")
                  ? "text-emerald-700 bg-emerald-50 font-semibold"
                  : "text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Admin Portal</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {adminMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <Link
                  href="/admin/vehicles"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Car className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vehicle Fleet (Member 1)</span>
                </Link>
                <Link
                  href="/admin/trips"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Trip Schedule (Member 1)</span>
                </Link>
                <Link
                  href="/admin/bookings"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>All Bookings (Member 2)</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* User Session & Role Controls */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-slate-800">{user.name}</div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  {user.role}
                </div>
              </div>

              {/* Quick Persona Toggle for Demo Testing */}
              <button
                onClick={() =>
                  switchPersona(
                    isAdmin ? "customer" : "administrator",
                    isAdmin ? "Ye Htet Aung" : "Transport Admin"
                  )
                }
                title="Switch persona (Customer ⇄ Admin)"
                className="ml-1 p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 border border-slate-200 bg-white px-2"
              >
                <ArrowLeftRight className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px]">{isAdmin ? "To Customer" : "To Admin"}</span>
              </button>

              <button
                onClick={logout}
                title="Log out"
                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-3">
          <Link
            href="/trips"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Trips & Booking
          </Link>
          <Link
            href="/my-bookings"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            My Bookings
          </Link>
          <div className="pt-2 border-t border-slate-100 font-semibold text-xs text-slate-400 uppercase">
            Admin Area
          </div>
          <Link
            href="/admin/vehicles"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Vehicle Fleet (Member 1)
          </Link>
          <Link
            href="/admin/trips"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Trip Schedule (Member 1)
          </Link>
          <Link
            href="/admin/bookings"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            All Bookings (Member 2)
          </Link>

          {user && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Logged in as {user.name} ({user.role})</span>
              <button
                onClick={() =>
                  switchPersona(isAdmin ? "customer" : "administrator")
                }
                className="text-emerald-700 font-semibold underline"
              >
                Switch Role
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

