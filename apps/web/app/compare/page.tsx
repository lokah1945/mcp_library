import { CompareView } from "../../components/compare-view";
import { catalogServers, findServers } from "../../lib/catalog";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ servers?: string }> }) {
  const params = await searchParams;
  const requested = params.servers?.split(",").filter(Boolean) ?? [];
  const initialServers = findServers(requested).slice(0, 3);
  return <CompareView initialServers={initialServers.length >= 2 ? initialServers : catalogServers.slice(0, 3)} />;
}
