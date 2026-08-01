"use client";

import Link from "next/link";
import { categories, catalogServers, localized, type CatalogServer } from "../lib/catalog";
import { SearchHero } from "./search-hero";
import { ServerCard } from "./server-card";
import { useLanguage } from "./language-provider";

export function HomePage({ initialServers }: { initialServers?: CatalogServer[] }) {
  const { locale } = useLanguage();
  const displayServers = initialServers && initialServers.length > 0 ? initialServers : catalogServers;
  const copy = locale === "id"
    ? { catalog: "KATALOG TERPILIH", heading: "Mulai dari workflow developer.", body: "Dataset awal berfokus pada tool developer. Setiap entri menyertakan sinyal sumber, kompatibilitas, autentikasi, dan risiko—bukan sekadar rekomendasi populer.", explore: "Jelajahi semua server", taxonomy: "TAKSONOMI v1", taxonomyHeading: "Satu bahasa untuk ekosistem yang tersebar.", taxonomyBody: "Sumber memiliki istilah berbeda. mcp_library memetakan semuanya ke kategori dan facet yang konsisten, sambil menjaga provenance pada setiap fakta.", methodology: "Pelajari metodologi", safety: "SAFETY BY DESIGN", safetyHeading: "Tidak menyimpan secret. Tidak auto-run tool.", safetyBody: "Konfigurasi selalu memakai placeholder environment variable. Izin dan potensi aksi ditampilkan sebelum pengguna memasang atau menghubungkan server." }
    : { catalog: "CURATED CATALOG", heading: "Start with developer workflows.", body: "The first dataset focuses on developer tools. Every entry carries source, compatibility, authentication, and risk signals—not just popularity.", explore: "Explore all servers", taxonomy: "TAXONOMY v1", taxonomyHeading: "One language for a scattered ecosystem.", taxonomyBody: "Sources use different terms. mcp_library maps them to consistent categories and facets while retaining provenance for every fact.", methodology: "Explore the methodology", safety: "SAFETY BY DESIGN", safetyHeading: "No secrets stored. No tools auto-run.", safetyBody: "Configuration always uses environment-variable placeholders. Permissions and potential actions are visible before someone installs or connects a server." };

  return <>
    <SearchHero />
    <section className="content-section featured-section">
      <div className="section-heading split-heading">
        <div><p className="eyebrow">{copy.catalog}</p><h2>{copy.heading}</h2></div>
        <div><p>{copy.body}</p><Link className="arrow-link prominent-link" href="/servers">{copy.explore} <span>→</span></Link></div>
      </div>
      <div className="server-grid featured-grid">{displayServers.slice(0, 3).map((server) => <ServerCard server={server} key={server.slug} />)}</div>
    </section>
    <section className="content-section taxonomy-section">
      <div className="taxonomy-copy"><p className="eyebrow">{copy.taxonomy}</p><h2>{copy.taxonomyHeading}</h2><p>{copy.taxonomyBody}</p><Link className="outline-link" href="/methodology">{copy.methodology} <span>↗</span></Link></div>
      <div className="category-matrix">{categories.slice(0, 6).map((category, index) => <Link href={`/servers?category=${category.slug}`} className="category-tile" key={category.slug}><span className="category-index">0{index + 1}</span><span className="category-icon">{category.icon}</span><strong>{localized(category.label, locale)}</strong><small>{localized(category.description, locale)}</small><span className="tile-arrow">→</span></Link>)}</div>
    </section>
    <section className="safety-section"><div><p className="eyebrow">{copy.safety}</p><h2>{copy.safetyHeading}</h2></div><p>{copy.safetyBody}</p><div className="safety-metrics"><span><strong>0</strong> literal credentials</span><span><strong>100%</strong> placeholder exports</span></div></section>
  </>;
}
