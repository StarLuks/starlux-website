import HomeHero from "@/components/home/HomeHero";
import AboutSection from "@/components/home/AboutSection";
import ContactsSection from "@/components/home/ContactsSection";
import SiteFooter from "@/components/home/SiteFooter";

const Index = () => {
  return (
    <main>
      <HomeHero />
      <AboutSection />
      <ContactsSection />
      <SiteFooter />
    </main>
  );
};

export default Index;
