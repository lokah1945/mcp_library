"use client";

import { useMemo, useState } from "react";
import type { LocalLibrarySnapshot } from "../lib/local-library";
import { useLanguage } from "./language-provider";

function command(server: string): string {
  return `npm run library:clone -- --server ${server} --yes`;
}

const readyPacks = [
  { id: "free-web-research", title: { en: "Free Web & Research", id: "Web & Riset Gratis" }, servers: "Context7 · Playwright", risk: { en: "Browser control needs session review.", id: "Kontrol browser perlu peninjauan sesi." } },
  { id: "free-thinking-memory", title: { en: "Free Thinking & Memory", id: "Berpikir & Memori Gratis" }, servers: "Sequential Thinking · Memory", risk: { en: "Local memory can persist context.", id: "Memori lokal dapat menyimpan konteks." } },
  { id: "free-developer", title: { en: "Free Developer Starter", id: "Starter Developer Gratis" }, servers: "GitHub · Playwright · Context7", risk: { en: "GitHub OAuth and browser control need review.", id: "OAuth GitHub dan kontrol browser perlu ditinjau." } }
] as const;

function packCommand(name: string): string {
  return `npm run library:pack -- --name ${name}`;
}

export function LibraryPage({ snapshot }: { snapshot: LocalLibrarySnapshot }) {
  const { locale } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "cloneable" | "verified">("all");
  const candidates = useMemo(() => snapshot.candidates.filter((candidate) => filter === "all" || filter === "cloneable" ? filter === "all" || candidate.cloneEligible : candidate.freeStatus === "verified-open-source"), [filter, snapshot.candidates]);
  const copy = locale === "id"
    ? { eyebrow: "LOCAL LIBRARY / PROVIDER SYNC", title: "Koleksi lokal, tetap terhubung ke provider.", intro: "Temukan MCP gratis/open-source, verifikasi lisensi dan provenance, clone source code secara lokal tanpa mengeksekusi apa pun, lalu pantau update dari provider.", sync: "Sync registry", free: "Daftar free", refresh: "Periksa update clone", packs: "Paket gratis siap pakai", packsBody: "Template konfigurasi credential-free untuk Claude Desktop, Cursor, dan VS Code. Package lokal dipin agar update dapat direview sebelum dipakai.", generate: "Buat pack", all: "Semua", cloneable: "Dapat di-clone", verified: "Open-source terverifikasi", shown: "ditampilkan", of: "dari", clone: "Clone lokal", copied: "Tersalin", safe: "Tidak ada instalasi dependency atau eksekusi server.", status: "Status", source: "Sumber", license: "Lisensi", provider: "Provider tracking", providerBody: "Sync metadata dapat dijadwalkan. Refresh clone hanya fetch HEAD dan tidak mengubah file; apply update membutuhkan konfirmasi eksplisit.", policy: "Policy keamanan", policyBody: "Hanya HTTPS public Git host yang diizinkan. Clone default hanya untuk lisensi open-source terverifikasi. Remote-only MCP tidak akan di-clone.", syncState: "Sinkron terakhir", notSynced: "Belum ada sync provider; menampilkan curated seed." }
    : { eyebrow: "LOCAL LIBRARY / PROVIDER SYNC", title: "A local collection that stays connected to providers.", intro: "Discover free/open-source MCPs, verify licence and provenance, clone source code locally without executing it, then track updates from the provider.", sync: "Sync registry", free: "List free", refresh: "Check clone updates", packs: "Free ready-to-use packs", packsBody: "Credential-free configuration templates for Claude Desktop, Cursor, and VS Code. Local packages are pinned so changes can be reviewed before use.", generate: "Generate pack", all: "All", cloneable: "Cloneable", verified: "Verified open source", shown: "shown", of: "of", clone: "Clone locally", copied: "Copied", safe: "No dependency installation or server execution occurs.", status: "Status", source: "Source", license: "Licence", provider: "Provider tracking", providerBody: "Metadata sync can be scheduled. Clone refresh only fetches HEAD and never changes files; applying an update needs explicit confirmation.", policy: "Security policy", policyBody: "Only public HTTPS Git hosts are allowed. Default cloning is limited to verified open-source licences. Remote-only MCPs are never cloned.", syncState: "Last synced", notSynced: "No provider sync yet; showing curated seeds." };

  async function copyCommand(server: string) {
    const isPack = server.startsWith("free-");
    await navigator.clipboard.writeText(isPack ? packCommand(server) : command(server));
    setCopied(server);
    window.setTimeout(() => setCopied(null), 1800);
  }

  const syncLabel = snapshot.officialRegistryLastSync ? new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.officialRegistryLastSync)) : copy.notSynced;
  return <section className="library-page">
    <div className="library-hero"><div><p className="eyebrow"><span className="pulse-dot" /> {copy.eyebrow}</p><h1>{copy.title}</h1><p className="page-intro">{copy.intro}</p></div><div className="sync-card"><span>{copy.syncState}</span><strong>{syncLabel}</strong><code>local-library/registry/catalog.json</code></div></div>
    <div className="command-rail"><div><span>01</span><strong>{copy.sync}</strong><code>npm run providers:sync -- --limit 25</code></div><div><span>02</span><strong>{copy.free}</strong><code>npm run library:free</code></div><div><span>03</span><strong>{copy.refresh}</strong><code>npm run library:refresh</code></div></div>
    <section className="ready-packs"><div className="ready-packs-heading"><p className="eyebrow">FREE PACKS / PINNED</p><h2>{copy.packs}</h2><p>{copy.packsBody}</p></div><div className="ready-pack-grid">{readyPacks.map((pack) => <article key={pack.id}><span className="source-status verified">FREE PACK</span><h3>{pack.title[locale]}</h3><strong>{pack.servers}</strong><p>{pack.risk[locale]}</p><button className="clone-command" onClick={() => copyCommand(pack.id)}>{copied === pack.id ? `✓ ${copy.copied}` : `⧉ ${copy.generate}`}</button><code>{packCommand(pack.id)}</code></article>)}</div></section>
    <div className="library-controls"><div className="filter-tabs"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{copy.all}</button><button className={filter === "cloneable" ? "active" : ""} onClick={() => setFilter("cloneable")}>{copy.cloneable}</button><button className={filter === "verified" ? "active" : ""} onClick={() => setFilter("verified")}>{copy.verified}</button></div><span>{candidates.length} {copy.shown} {copy.of} {snapshot.totalCandidates.toLocaleString(locale === "id" ? "id-ID" : "en-US")}</span></div>
    <div className="library-grid">{candidates.map((candidate) => <article className="library-card" key={candidate.canonicalName}><div className="card-topline"><span className={candidate.freeStatus === "verified-open-source" ? "source-status verified" : "source-status review"}>{candidate.freeStatus === "verified-open-source" ? "VERIFIED OSS" : "REVIEW LICENCE"}</span><span className="tag">{candidate.source === "official-registry" ? "Official Registry" : candidate.source === "glama" ? "Glama" : candidate.source === "mcpmarket" ? "MCPMarket" : "Provider repo"}</span></div><h2>{candidate.title}</h2><p>{candidate.description ?? candidate.canonicalName}</p><dl><div><dt>{copy.license}</dt><dd>{candidate.licenseSpdx ?? "Unverified"}</dd></div><div><dt>{copy.status}</dt><dd>{candidate.lifecycle}</dd></div><div><dt>{copy.source}</dt><dd className="canonical-name">{candidate.canonicalName}</dd></div></dl>{candidate.cloneEligible ? <><button className="clone-command" onClick={() => copyCommand(candidate.canonicalName)}>{copied === candidate.canonicalName ? `✓ ${copy.copied}` : `⧉ ${copy.clone}`}</button><code className="command-preview">{command(candidate.canonicalName)}</code><small>{copy.safe}</small></> : <a className="outline-link library-source-link" href={candidate.sourceUrl} target="_blank" rel="noreferrer">{locale === "id" ? "Tinjau provider dahulu" : "Review provider first"} ↗</a>}</article>)}</div>
    <section className="library-policy"><div><p className="eyebrow">{copy.provider.toUpperCase()}</p><h2>{copy.provider}</h2><p>{copy.providerBody}</p></div><div><p className="eyebrow">{copy.policy.toUpperCase()}</p><h2>{copy.policy}</h2><p>{copy.policyBody}</p></div></section>
  </section>;
}
