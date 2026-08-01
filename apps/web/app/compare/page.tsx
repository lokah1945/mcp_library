import { CompareView } from "../../components/compare-view";
import { getCombinedServers, findServersDynamic } from "../../lib/local-library";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ servers?: string }> }) {
  const params = await searchParams;
  const requested = params.servers?.split(",").filter(Boolean) ?? [];
  const initialServers = await findServersDynamic(requested);
  const combined = await getCombinedServers();
  const fallbackServers = combined.slice(0, 3);
  return <CompareView initialServers={initialServers.length >= 2 ? initialServers.slice(0, 3) : fallbackServers} allServers={combined} />;
}
