import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { LiveMonitoring } from "@/components/landing/live-monitoring";
import { DetectionEngine } from "@/components/landing/detection-engine";
import { Features } from "@/components/landing/features";
import { GridIntelligence } from "@/components/landing/grid-intel";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";
import { CtaSection } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main className="relative overflow-hidden">
        <Hero />
        <Features />
        <DetectionEngine />
        <LiveMonitoring />
        <GridIntelligence />
        <Stats />
        <Testimonials />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
