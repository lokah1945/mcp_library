import Link from "next/link";

export default function NotFound() {
  return <section className="not-found"><p className="eyebrow">404</p><h1>Server profile not found.</h1><p>The profile may not exist in this seed catalog yet.</p><Link className="outline-link" href="/servers">Explore the catalog →</Link></section>;
}
