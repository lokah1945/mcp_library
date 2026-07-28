import { LibraryPage } from "../../components/library-page";
import { loadLocalLibrarySnapshot } from "../../lib/local-library";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <LibraryPage snapshot={await loadLocalLibrarySnapshot()} />;
}
