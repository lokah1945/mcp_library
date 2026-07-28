"use client";

import Link from "next/link";
import { useLanguage } from "./language-provider";

export function Header() {
  const { locale, toggleLocale } = useLanguage();
  const copy = locale === "id"
    ? { directory: "Direktori", library: "Library Lokal", compare: "Bandingkan", methodology: "Metodologi", language: "EN" }
    : { directory: "Directory", library: "Local library", compare: "Compare", methodology: "Methodology", language: "ID" };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="mcp library home">
          <span className="brand-mark">m/</span>
          <span>mcp<span>_library</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/servers">{copy.directory}</Link>
          <Link href="/library">{copy.library}</Link>
          <Link href="/compare">{copy.compare}</Link>
          <Link href="/methodology">{copy.methodology}</Link>
        </nav>
        <button className="language-toggle" onClick={toggleLocale} type="button" aria-label="Switch language">
          <span className="language-dot" /> {copy.language}
        </button>
      </div>
    </header>
  );
}
