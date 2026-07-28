import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "../components/app-shell";
import { LanguageProvider } from "../components/language-provider";

export const metadata: Metadata = {
  title: "mcp_library — Trusted MCP discovery",
  description: "A bilingual, provenance-first catalog and recommendation layer for Model Context Protocol servers."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><LanguageProvider><AppShell>{children}</AppShell></LanguageProvider></body></html>;
}
