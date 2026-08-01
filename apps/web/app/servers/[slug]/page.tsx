import { notFound } from "next/navigation";
import { DetailView } from "../../../components/detail-view";
import { getCombinedServers, findServerDynamic } from "../../../lib/local-library";

export async function generateStaticParams() {
  const servers = await getCombinedServers();
  return servers.map((server) => ({ slug: server.slug }));
}

export default async function ServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const server = await findServerDynamic(slug);
  if (!server) notFound();
  return <DetailView server={server} />;
}
