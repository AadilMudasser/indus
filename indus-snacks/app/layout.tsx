import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indus Snacks Management System",
  description: "Staff Dashboard – Indus Hospital",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
