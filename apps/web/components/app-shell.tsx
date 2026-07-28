import { Footer } from "./footer";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <><Header /><main>{children}</main><Footer /></>;
}
