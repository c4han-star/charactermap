import { DemoSection } from "@/components/landing/DemoSection";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { Problem } from "@/components/landing/Problem";
import { Solution } from "@/components/landing/Solution";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingShell>
        <Hero />
        <Problem />
        <Solution />
        <DemoSection />
        <HowItWorks />
      </MarketingShell>
    </div>
  );
}
