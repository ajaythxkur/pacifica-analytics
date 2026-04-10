import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans-display",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pacifica Analytics",
  description: "Track, group, and analyze top traders on Pacifica",
};

/**
 * Inline blocking script that runs before the body paints.
 * Reads the persisted theme (or system preference) and sets the class on
 * <html> synchronously so there's no flash of wrong theme on first paint.
 *
 * The default class on <html> is `theme-dark`, so users with JS disabled
 * still get a valid, fully-styled page — the script only *upgrades* to a
 * different theme if one was previously chosen.
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    var root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add('theme-' + theme);
  } catch (e) {}
})();
`.trim();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`theme-dark ${outfit.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <Navbar />
        <main className="max-w-6xl mx-auto px-5 py-6">{children}</main>
      </body>
    </html>
  );
}
