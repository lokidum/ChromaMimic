import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { LookDemo } from "./components/LookDemo";
import { Tool } from "./components/tool/Tool";
import { HowItWorks } from "./components/HowItWorks";
import { Editors } from "./components/Editors";
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
        <LookDemo />
        <div className="flex flex-col gap-28 py-24 md:gap-40 md:py-32">
          <Tool />
          <HowItWorks />
          <Editors />
          <Pricing />
          <FAQ />
          <ServiceCTA />
        </div>
      </main>
      <Footer />
    </EntitlementsProvider>
  );
}
