import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Van and Bus Booking System — API",
  description: "Next.js + MongoDB REST API for Van and Bus Reservation System - CSX4107 Project 2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
