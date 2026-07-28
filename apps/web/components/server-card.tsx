"use client";

import Link from "next/link";
import { categoryBySlug, localized, type CatalogServer } from "../lib/catalog";
import { useLanguage } from "./language-provider";

function riskClass(risk: CatalogServer["risk"]): string {
  return `risk-${risk.toLowerCase()}`;
}

export function ServerCard({ server, compact = false }: { server: CatalogServer; compact?: boolean }) {
  const { locale } = useLanguage();
  const primaryCategory = server.categories.at(0);
  const category = primaryCategory ? categoryBySlug(primaryCategory) : undefined;
  const copy = locale === "id"
    ? { seed: "DATA SEED", details: "Lihat profil", official: "Resmi", community: "Komunitas", claimed: "Diklaim", local: "Lokal", cloud: "Cloud", hybrid: "Hibrida" }
    : { seed: "SEED DATA", details: "View profile", official: "Official", community: "Community", claimed: "Claimed", local: "Local", cloud: "Cloud", hybrid: "Hybrid" };

  const status = server.officialStatus === "Official" ? copy.official : server.officialStatus === "Claimed" ? copy.claimed : copy.community;
  const execution = server.execution === "Local" ? copy.local : server.execution === "Cloud" ? copy.cloud : copy.hybrid;

  return (
    <article className={`server-card ${compact ? "server-card-compact" : ""}`}>
      <div className="card-topline">
        <span className="seed-badge">{copy.seed}</span>
        <span className={`risk-badge ${riskClass(server.risk)}`}>{server.risk} {locale === "id" ? "risiko" : "risk"}</span>
      </div>
      <div className="server-title-row">
        <div className="server-glyph">{server.name.slice(0, 1)}</div>
        <div>
          <h3><Link href={`/servers/${server.slug}`}>{server.name}</Link></h3>
          <p className="publisher">{server.publisher}</p>
        </div>
      </div>
      {!compact && <p className="server-summary">{localized(server.summary, locale)}</p>}
      <div className="tag-row">
        {category && <span className="tag tag-primary">{localized(category.label, locale)}</span>}
        <span className="tag">{status}</span>
        <span className="tag">{execution}</span>
      </div>
      <div className="card-footer">
        <span className="transport-label">{server.transports.join(" · ")}</span>
        <Link className="arrow-link" href={`/servers/${server.slug}`}>{copy.details} <span>→</span></Link>
      </div>
    </article>
  );
}
