"use client";

import { useMemo, useState } from "react";
import { categories, localized, type CatalogServer, type CategorySlug } from "../lib/catalog";
import { ServerCard } from "./server-card";
import { useLanguage } from "./language-provider";

interface ExplorerProps {
  initialQuery?: string;
  initialCategory?: "all" | CategorySlug;
  servers: CatalogServer[];
}

export function ServerExplorer({ initialQuery = "", initialCategory = "all", servers }: ExplorerProps) {
  const { locale } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<"all" | CategorySlug>(initialCategory);
  const [execution, setExecution] = useState<"all" | CatalogServer["execution"]>("all");
  const [risk, setRisk] = useState<"all" | CatalogServer["risk"]>("all");
  const copy = locale === "id"
    ? { title: "Jelajahi katalog", body: "Filter berdasarkan kebutuhan, model eksekusi, dan sinyal risiko. Semua hasil saat ini adalah data seed hingga source sync berjalan.", search: "Cari nama, tool, atau use case…", all: "Semua kategori", execution: "Eksekusi", risk: "Risiko", clear: "Reset", results: "hasil", noResults: "Tidak ada server yang cocok. Coba hapus beberapa filter." }
    : { title: "Explore the catalog", body: "Filter by need, execution model, and risk signal. All current results are seed data until source sync runs.", search: "Search name, tool, or use case…", all: "All categories", execution: "Execution", risk: "Risk", clear: "Reset", results: "results", noResults: "No matching servers. Try removing a few filters." };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return servers.filter((server) => {
      const searchable = [
        server.name,
        server.publisher,
        ...server.tags,
        localized(server.summary, locale),
        localized(server.description, locale),
        ...server.useCases.map((item) => localized(item, locale))
      ].join(" ").toLowerCase();
      return (!needle || searchable.includes(needle))
        && (category === "all" || server.categories.includes(category))
        && (execution === "all" || server.execution === execution)
        && (risk === "all" || server.risk === risk);
    });
  }, [category, execution, locale, query, risk, servers]);

  function reset() {
    setQuery(""); setCategory("all"); setExecution("all"); setRisk("all");
  }

  return (
    <section className="directory-section">
      <div className="section-heading directory-heading">
        <div><p className="eyebrow"><span className="pulse-dot" /> CATALOG / SEED MODE</p><h1>{copy.title}</h1><p>{copy.body}</p></div>
        <button className="text-button" onClick={reset}>{copy.clear} ↺</button>
      </div>
      <div className="filter-panel">
        <label className="filter-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label>
        <label><span>{copy.all}</span><select value={category} onChange={(event) => setCategory(event.target.value as "all" | CategorySlug)}><option value="all">{copy.all}</option>{categories.map((item) => <option value={item.slug} key={item.slug}>{localized(item.label, locale)}</option>)}</select></label>
        <label><span>{copy.execution}</span><select value={execution} onChange={(event) => setExecution(event.target.value as "all" | CatalogServer["execution"])}><option value="all">All</option><option value="Local">Local</option><option value="Cloud">Cloud</option><option value="Hybrid">Hybrid</option></select></label>
        <label><span>{copy.risk}</span><select value={risk} onChange={(event) => setRisk(event.target.value as "all" | CatalogServer["risk"])}><option value="all">All</option><option value="Low">Low</option><option value="Moderate">Moderate</option><option value="High">High</option></select></label>
      </div>
      <p className="result-count"><strong>{filtered.length}</strong> {copy.results}</p>
      {filtered.length > 0 ? <div className="server-grid">{filtered.map((server) => <ServerCard key={server.slug} server={server} />)}</div> : <div className="empty-state"><span>⌕</span><p>{copy.noResults}</p></div>}
    </section>
  );
}
