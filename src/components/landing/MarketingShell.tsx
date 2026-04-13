import { Footer } from "./Footer";
import { SiteHeader } from "./SiteHeader";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
