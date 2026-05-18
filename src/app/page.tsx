import { DemoSection } from "@/components/landing/DemoSection";
import { FeaturedUniverses } from "@/components/landing/FeaturedUniverses";
import { Hero } from "@/components/landing/Hero";
import { HomeAtmosphere } from "@/components/landing/HomeAtmosphere";
import { HomeEditorial } from "@/components/landing/HomeEditorial";
import { MarketingShell } from "@/components/landing/MarketingShell";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050506] text-foreground">
      <HomeAtmosphere />
      <MarketingShell>
        <Hero />
        <FeaturedUniverses />
        <HomeEditorial />
        <DemoSection />
      </MarketingShell>
    </div>
  );
}
