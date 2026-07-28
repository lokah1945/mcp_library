"use client";

import Link from "next/link";
import { useLanguage } from "./language-provider";

export function Footer() {
  const { locale } = useLanguage();
  return (
    <footer className="site-footer">
      <div>
        <span className="brand-mark">m/</span> <strong>mcp_library</strong>
        <p>{locale === "id" ? "Katalog MCP yang dapat ditelusuri sumbernya dan berorientasi pada keamanan." : "A provenance-first, safety-aware MCP catalog."}</p>
      </div>
      <div className="footer-links">
        <Link href="/methodology">{locale === "id" ? "Metodologi" : "Methodology"}</Link>
        <a href="https://modelcontextprotocol.io/specification/2025-11-25" target="_blank" rel="noreferrer">MCP Spec ↗</a>
      </div>
    </footer>
  );
}
