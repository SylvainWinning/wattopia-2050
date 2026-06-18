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
  title: "Wattopia 2050 | Simulateur du mix électrique français",
  description:
    "Construis le mix énergétique de la France en 2050, évite le blackout et explore les compromis entre renouvelables, nucléaire, stockage, sobriété et CO₂.",
  openGraph: {
    title: "Wattopia 2050",
    description: "Peux-tu alimenter la France en 2050 sans blackout ?",
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
