import HomeHero from "@/components/home/HomeHero";
import AboutBento from "@/components/home/AboutBento";
import ContactsFooter from "@/components/home/ContactsFooter";

const Index = () => {
  return (
    <main className="bg-background">
      <HomeHero />
      <AboutBento />
      <ContactsFooter />
    </main>
  );
};

export default Index;