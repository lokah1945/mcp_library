"use client";

import Link from "next/link";
import { useState } from "react";
import { categoryBySlug, findServers, formatDateLabel, localized, type CatalogServer } from "../lib/catalog";
import { useLanguage } from "./language-provider";
import { ServerCard } from "./server-card";

function buildTemplate(server: CatalogServer) {
  const env = Object.fromEntries(server.credentialVariables.map((variable) => [variable, "${" + variable + "}"]));
  return JSON.stringify({
    mcpServers: {
      [server.slug]: {
        command: server.setup.command,
        args: server.setup.args,
        ...(server.credentialVariables.length ? { env } : {})
      }
    }
  }, null, 2);
}

export function DetailView({ server }: { server: CatalogServer }) {
  const { locale } = useLanguage();
  const [copied, setCopied] = useState(false);
  const categoryLabels = server.categories.map(categoryBySlug).filter(Boolean);
  const alternatives = findServers(server.alternatives);
  const code = buildTemplate(server);
  const copy = locale === "id"
    ? { seed: "DATA SEED — BELUM TERSINKRON", back: "Kembali ke katalog", about: "Ringkasan", useCases: "Cocok untuk", setup: "Template konfigurasi aman", config: "Contoh untuk Claude Desktop / Cursor", copy: "Salin template", copied: "Tersalin", requirements: "Kebutuhan", compatibility: "Kompatibilitas", safety: "Izin & risiko", evidence: "Sumber & provenance", alternatives: "Alternatif terkait", review: "Tinjau sebelum menghubungkan", reviewBody: "Profil ini adalah data seed. Verifikasikan paket, versi, URL, scope autentikasi, dan izin aktif pada dokumentasi provider sebelum instalasi.", auth: "Autentikasi", status: "Status", lastSeen: "Terakhir terlihat", source: "Sumber", open: "Buka sumber" }
    : { seed: "SEED DATA — NOT YET SYNCED", back: "Back to catalog", about: "Overview", useCases: "Good for", setup: "Safe configuration template", config: "Example for Claude Desktop / Cursor", copy: "Copy template", copied: "Copied", requirements: "Requirements", compatibility: "Compatibility", safety: "Permissions & risk", evidence: "Source & provenance", alternatives: "Related alternatives", review: "Review before connecting", reviewBody: "This profile is seed data. Verify the current package, version, URL, authentication scopes, and active permissions in provider documentation before installation.", auth: "Authentication", status: "Status", lastSeen: "Last seen", source: "Source", open: "Open source" };

  async function copyTemplate() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <section className="detail-page">
    <div className="breadcrumb"><Link href="/servers">← {copy.back}</Link><span>/</span><span>{server.name}</span></div>
    <div className="seed-notice"><span className="pulse-dot" /> {copy.seed}</div>
    <div className="detail-hero">
      <div>
        <div className="server-title-row detail-title"><div className="server-glyph large-glyph">{server.name.slice(0, 1)}</div><div><p className="publisher">{server.publisher}</p><h1>{server.name}</h1></div></div>
        <p className="detail-summary">{localized(server.summary, locale)}</p>
        <div className="tag-row">{categoryLabels.map((category) => category && <span className="tag tag-primary" key={category.slug}>{localized(category.label, locale)}</span>)}<span className="tag">{server.execution}</span><span className={`risk-badge risk-${server.risk.toLowerCase()}`}>{server.risk} {locale === "id" ? "risiko" : "risk"}</span></div>
      </div>
      <div className="detail-meta-card"><div><span>{copy.status}</span><strong>{server.officialStatus} · {server.lifecycle}</strong></div><div><span>{copy.lastSeen}</span><strong>{formatDateLabel(server.observedAt, locale)}</strong></div><a className="outline-link compact-outline" href={server.documentationUrl} target="_blank" rel="noreferrer">{copy.open} ↗</a></div>
    </div>

    <div className="detail-layout">
      <div className="detail-main">
        <section className="detail-section"><h2>{copy.about}</h2><p>{localized(server.description, locale)}</p></section>
        <section className="detail-section"><h2>{copy.useCases}</h2><ul className="check-list">{server.useCases.map((item) => <li key={item.en}><span>✓</span>{localized(item, locale)}</li>)}</ul></section>
        <section className="detail-section config-section"><div className="section-title-row"><div><h2>{copy.setup}</h2><p>{copy.config}</p></div><button className="copy-button" onClick={copyTemplate}>{copied ? `✓ ${copy.copied}` : `⧉ ${copy.copy}`}</button></div><pre><code>{code}</code></pre><p className="config-note">⚠ {copy.reviewBody}</p></section>
      </div>
      <aside className="detail-side">
        <section className="side-card"><h3>{copy.requirements}</h3><dl><div><dt>{copy.auth}</dt><dd>{localized(server.auth, locale)}</dd></div><div><dt>Runtime</dt><dd>{server.execution} · {server.transports.join(" / ")}</dd></div><div><dt>Variables</dt><dd>{server.credentialVariables.length ? server.credentialVariables.map((item) => <code key={item}>{item}</code>) : "None declared"}</dd></div></dl></section>
        <section className="side-card"><h3>{copy.compatibility}</h3><div className="tag-row">{server.compatibility.map((item) => <span className="tag" key={item}>{item}</span>)}</div></section>
        <section className="side-card risk-panel"><h3>{copy.safety}</h3><div className={`risk-badge risk-${server.risk.toLowerCase()}`}>{server.risk} {locale === "id" ? "risiko" : "risk"}</div><ul>{server.permissionTags.map((item) => <li key={item.en}>{localized(item, locale)}</li>)}</ul></section>
        <section className="side-card"><h3>{copy.evidence}</h3><dl><div><dt>{copy.source}</dt><dd>{server.sourceName}</dd></div><div><dt>Verification</dt><dd>{server.verification}</dd></div></dl><a className="source-link" href={server.sourceUrl} target="_blank" rel="noreferrer">{copy.open} ↗</a></section>
      </aside>
    </div>
    <section className="related-section"><div className="section-heading"><div><p className="eyebrow">RELATION GRAPH / SEED</p><h2>{copy.alternatives}</h2></div></div><div className="server-grid related-grid">{alternatives.map((item) => <ServerCard server={item} compact key={item.slug} />)}</div></section>
    <div className="review-callout"><strong>{copy.review}</strong><span>{copy.reviewBody}</span></div>
  </section>;
}
