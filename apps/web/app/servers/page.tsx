import { ServerExplorer } from "../../components/server-explorer";
import { catalogServers, categories, type CategorySlug } from "../../lib/catalog";

export default async function ServersPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const initialCategory: "all" | CategorySlug = categories.some((category) => category.slug === params.category) ? params.category as CategorySlug : "all";
  return <ServerExplorer initialQuery={params.q ?? ""} initialCategory={initialCategory} servers={catalogServers} />;
}
