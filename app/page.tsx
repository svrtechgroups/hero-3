import { MotionProvider } from '@/components/providers/MotionProvider';
import { JourneyCanvases } from '@/components/three/JourneyCanvases';
import { Navbar } from '@/components/sections/Navbar';
import { Hero } from '@/components/sections/Hero';
import { Process } from '@/components/sections/Process';
import { Impact } from '@/components/sections/Impact';
import { Services } from '@/components/sections/Services';
import { Testimonials } from '@/components/sections/Testimonials';
import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/sections/Footer';

export default function Home() {
  return (
    <MotionProvider>
      {/* fixed WebGL layers: world behind (z-0), traveling cube in front (z-30) */}
      <JourneyCanvases />
      <Navbar />
      <main id="main" className="relative z-10">
        <Hero />
        <Process />
        <Impact />
        <Services />
        <Testimonials />
        <Contact />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </MotionProvider>
  );
}
