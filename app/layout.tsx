import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Geist_Mono, Heebo } from "next/font/google";
import type { CSSProperties } from "react";
import "./globals.css";

const frankRuhlLibre = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  variable: "--font-frank-ruhl-libre",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fontDisplayStyle = {
  "--font-display": "var(--font-frank-ruhl-libre), var(--font-heebo), sans-serif",
} as CSSProperties;

export const metadata: Metadata = {
  title: "ZenStock",
  description: "Master Your Mind. Master Your Money.",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#202022",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${frankRuhlLibre.variable} ${heebo.variable} ${geistMono.variable} h-full antialiased`}
      style={fontDisplayStyle}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}