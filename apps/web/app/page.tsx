import { HomePage } from "../components/home-page";
import { getCombinedServers } from "../lib/local-library";

export default async function Page() {
  const servers = await getCombinedServers();
  return <HomePage initialServers={servers} />;
}
