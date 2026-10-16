import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import SkillsSection from '@/components/SkillsSection';
import ProjectsSection from '@/components/ProjectsSection';
import AILabSection from '@/components/AILabSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

export default function Page() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <SkillsSection />
      <ProjectsSection />
      <AILabSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
