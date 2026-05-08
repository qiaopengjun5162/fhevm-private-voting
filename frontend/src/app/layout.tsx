import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Private Voting dApp",
  description: "Confidential on-chain voting powered by Zama fhEVM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background bg-radial-glow`}
      >
        <div className="fixed inset-0 bg-grid pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none" style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0 0 0 / 2%) 2px, oklch(0 0 0 / 2%) 4px)",
          animation: "scan-line 8s ease-in-out infinite",
        }} />
        <div className="relative z-10">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
