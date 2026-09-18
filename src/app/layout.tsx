import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Bus, Ticket, ShieldCheck, User } from "lucide-react";

export const metadata: Metadata = {
  title: "Van and Bus Booking System",
  description: "Next.js + MongoDB Van and Bus Reservation System - CSX4107 Project 2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight">Van & Bus</span>
                <span className="text-xs ml-1.5 font-semibold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Bookings
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/trips"
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Bus className="w-4 h-4 text-slate-500" />
                <span>Trips</span>
              </Link>
              <Link
                href="/my-bookings"
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Ticket className="w-4 h-4 text-slate-500" />
                <span>My Bookings</span>
              </Link>
              <Link
                href="/admin/bookings"
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Admin Bookings</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-sm text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-medium text-slate-700">Van and Bus Booking System — Project 2 (CSX4107)</p>
            <p className="text-xs text-slate-400 mt-1">
              Member 2: Ye Htet Aung — Booking & Seat Availability Module
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

