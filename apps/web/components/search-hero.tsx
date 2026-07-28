"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./language-provider";

export function SearchHero() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const copy = locale === "id"
    ? {
        eyebrow: "DIREKTORI MCP YANG DAPAT DIPERCAYA",
        titleA: "Temukan MCP yang tepat.",
        titleB: "Bukan sekadar tautan.",
        body: "Katalog terpadu untuk menemukan, membandingkan, memverifikasi, dan mengonfigurasi MCP dengan konteks kompatibilitas serta risiko yang jelas.",
        placeholder: "Contoh: GitHub PR read-only untuk Cursor",
        search: "Cari server",
        hint: "Coba: browser testing · PostgreSQL · error investigation"
      }
    : {
        eyebrow: "A TRUSTED MCP DIRECTORY",
        titleA: "Find the right MCP.",
        titleB: "Not just another link.",
        body: "One unified catalog to discover, compare, verify, and safely configure MCP servers with clear compatibility and risk context.",
        placeholder: "Try: read-only GitHub PR review for Cursor",
        search: "Search servers",
        hint: "Try: browser testing · PostgreSQL · error investigation"
      };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = query.trim();
    router.push(search ? `/servers?q=${encodeURIComponent(search)}` : "/servers");
  }

  return (
    <section className="hero-section">
      <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
      <div className="hero-content">
        <p className="eyebrow"><span className="pulse-dot" /> {copy.eyebrow}</p>
        <h1>{copy.titleA}<br /><em>{copy.titleB}</em></h1>
        <p className="hero-copy">{copy.body}</p>
        <form className="search-box" onSubmit={onSubmit}>
          <span className="search-icon">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.placeholder} aria-label={copy.placeholder} />
          <button type="submit">{copy.search} <span>→</span></button>
        </form>
        <p className="search-hint">{copy.hint}</p>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="signal-card signal-one"><span>source</span><strong>× 6</strong></div>
        <div className="signal-card signal-two"><span>taxonomy</span><strong>v1.0</strong></div>
        <div className="signal-card signal-three"><span>secrets</span><strong>0 stored</strong></div>
        <div className="orbital-line" /><div className="orbital-core">m/</div>
      </div>
    </section>
  );
}
