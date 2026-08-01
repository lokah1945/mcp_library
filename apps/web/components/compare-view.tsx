"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { catalogServers, localized, type CatalogServer } from "../lib/catalog";
import { useLanguage } from "./language-provider";

const rows: Array<{ label: { en: string; id: string }; value: (server: CatalogServer, locale: "en" | "id") => string }> = [
  { label: { en: "Publisher", id: "Publisher" }, value: (server) => server.publisher },
  { label: { en: "Execution", id: "Eksekusi" }, value: (server) => server.execution },
  { label: { en: "Transport", id: "Transport" }, value: (server) => server.transports.join(" · ") },
  { label: { en: "Authentication", id: "Autentikasi" }, value: (server, locale) => localized(server.auth, locale) },
  { label: { en: "Risk", id: "Risiko" }, value: (server) => server.risk },
  { label: { en: "Permissions", id: "Izin" }, value: (server, locale) => server.permissionTags.map((tag) => localized(tag, locale)).join("; ") },
  { label: { en: "Compatibility", id: "Kompatibilitas" }, value: (server) => server.compatibility.slice(0, 3).join(" · ") },
  { label: { en: "Verification", id: "Verifikasi" }, value: (server) => `${server.verification} / ${server.officialStatus}` }
];

export function CompareView({ initialServers, allServers }: { initialServers: CatalogServer[]; allServers?: CatalogServer[] }) {
  const { locale } = useLanguage();
  const serversList = allServers && allServers.length > 0 ? allServers : catalogServers;
  const [selectedSlugs, setSelectedSlugs] = useState(initialServers.map((server) => server.slug));
  const selected = useMemo(() => serversList.filter((server) => selectedSlugs.includes(server.slug)).slice(0, 3), [selectedSlugs, serversList]);
  const copy = locale === "id"
    ? { eyebrow: "COMPARE / SEED MODE", title: "Bandingkan dengan konteks, bukan hype.", body: "Bandingkan maksimum tiga profil berdasarkan transport, autentikasi, kompatibilitas, dan risiko. Semua nilai di bawah ini perlu verifikasi provider sebelum digunakan.", pick: "Pilih sampai 3", selected: "dipilih", open: "Buka profil", need: "Pilih setidaknya dua server untuk melihat perbandingan yang berguna." }
    : { eyebrow: "COMPARE / SEED MODE", title: "Compare with context, not hype.", body: "Compare up to three profiles across transport, authentication, compatibility, and risk. Every value below needs provider verification before use.", pick: "Select up to 3", selected: "selected", open: "Open profile", need: "Select at least two servers to see a useful comparison." };

  function toggle(slug: string) {
    setSelectedSlugs((current) => current.includes(slug) ? current.filter((item) => item !== slug) : current.length < 3 ? [...current, slug] : current);
  }

  return <section className="compare-page">
    <p className="eyebrow"><span className="pulse-dot" /> {copy.eyebrow}</p><h1>{copy.title}</h1><p className="page-intro">{copy.body}</p>
    <div className="picker-bar"><span>{copy.pick}: <strong>{selected.length}/3</strong> {copy.selected}</span><div>{serversList.slice(0, 15).map((server) => <button key={server.slug} onClick={() => toggle(server.slug)} className={selectedSlugs.includes(server.slug) ? "picker active" : "picker"}>{selectedSlugs.includes(server.slug) ? "✓ " : "+ "}{server.name}</button>)}</div></div>
    {selected.length >= 2 ? <div className="comparison-wrap"><table className="comparison-table"><thead><tr><th>Field</th>{selected.map((server) => <th key={server.slug}><span className="server-glyph mini-glyph">{server.name.slice(0, 1)}</span>{server.name}<Link href={`/servers/${server.slug}`}>{copy.open} →</Link></th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label.en}><th>{localized(row.label, locale)}</th>{selected.map((server) => <td key={server.slug}>{row.value(server, locale)}</td>)}</tr>)}</tbody></table></div> : <div className="empty-state"><span>⇄</span><p>{copy.need}</p></div>}
  </section>;
}
