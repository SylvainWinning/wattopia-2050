import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sylvainwinning.github.io/wattopia-2050/"),
  title: "BLACKOUT | Empêche la France de s'éteindre",
  description:
    "Une expérience web interactive où tu deviens opérateur du réseau électrique français pour éviter un blackout en 5 décisions.",
  openGraph: {
    title: "BLACKOUT",
    description: "Empêche la France de s'éteindre en 5 décisions.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
