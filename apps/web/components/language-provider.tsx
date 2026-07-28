"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "../lib/catalog";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("id");

  useEffect(() => {
    const stored = window.localStorage.getItem("mcp-library-locale");
    if (stored === "en" || stored === "id") setLocale(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("mcp-library-locale", locale);
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    toggleLocale: () => setLocale((current) => current === "id" ? "en" : "id")
  }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
