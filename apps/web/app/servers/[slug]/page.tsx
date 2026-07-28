import { notFound } from "next/navigation";
import { DetailView } from "../../../components/detail-view";
import { catalogServers, findServer } from "../../../lib/catalog";

export function generateStaticParams() {
  return catalogServers.map((server) => ({ slug: server.slug }));
}

export default async function ServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const server = findServer(slug);
  if (!server) notFound();
  return <DetailView server={server} />;
}
