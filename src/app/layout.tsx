import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

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
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-sm text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-semibold text-slate-800">Van and Bus Booking System — CSX4107 Project 2</p>
              <p className="text-xs text-slate-400 mt-1">
                Full-Stack Integration: Member 1 (Transport Admin), Member 2 (Booking & Availability), Member 3 (Auth & UI)
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
