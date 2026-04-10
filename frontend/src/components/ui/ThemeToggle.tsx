"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("theme-light")
    ? "light"
    : "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(`theme-${theme}`);
  try {
    localStorage.setItem("theme", theme);
  } catch {}
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Sync state with whatever the no-flash inline script set
  useEffect(() => {
    setTheme(getCurrentTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  // Render an inert placeholder until mounted to avoid hydration mismatch
  // (the inline script may have set a different class than the SSR default)
  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="p-1.5 text-fg-muted"
        suppressHydrationWarning
      >
        <Moon size={14} />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="p-1.5 text-fg-muted hover:text-accent transition-colors"
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
