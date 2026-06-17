import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Tool } from "./components/tool/Tool";
import { HowItWorks } from "./components/HowItWorks";
import { UseCases } from "./components/UseCases";
import { Pricing } from "./components/Pricing";
import { FAQ } from "./components/FAQ";
import { ServiceCTA } from "./components/ServiceCTA";
import { Footer } from "./components/Footer";
import { EntitlementsProvider } from "./lib/entitlements";

export default function App() {
  return (
    <EntitlementsProvider>
      <Nav />
      <main>
        <Hero />
        <div className="flex flex-col gap-28 py-24 md:gap-40 md:py-32">
          <Tool />
          <HowItWorks />
          <UseCases />
          <Pricing />
          <FAQ />
          <ServiceCTA />
        </div>
      </main>
      <Footer />
    </EntitlementsProvider>
  );
}
