import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoRoute | Van & Bus Booking",
  description: "Book van and bus trips quickly, safely and conveniently.",
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
