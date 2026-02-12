import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { EventProvider } from '@/lib/event-context'


const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "RoK Toolkit - Rise of Kingdoms Dashboard",
  description:
    "Calendar, calculators, guides, and tools for Rise of Kingdoms governors",
};

export const viewport: Viewport = {
  themeColor: "#1a1d2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased overflow-x-hidden">
<AuthProvider>
  <ThemeProvider>
    <EventProvider>
      {children}
    </EventProvider>
  </ThemeProvider>
</AuthProvider>

      </body>
    </html>
  );
}
