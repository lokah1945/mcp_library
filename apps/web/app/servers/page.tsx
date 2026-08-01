import { ServerExplorer } from "../../components/server-explorer";
import { categories, type CategorySlug } from "../../lib/catalog";
import { getCombinedServers } from "../../lib/local-library";

export default async function ServersPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const initialCategory: "all" | CategorySlug = categories.some((category) => category.slug === params.category) ? params.category as CategorySlug : "all";
  const servers = await getCombinedServers();
  return <ServerExplorer initialQuery={params.q ?? ""} initialCategory={initialCategory} servers={servers} />;
}
