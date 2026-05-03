import Navbar from '../components/layout/Navbar'
import HeroSection from '../components/sections/HeroSection'
import FeaturesSection from '../components/sections/FeaturesSection'
import CTASection from '../components/sections/CTASection'
import Footer from '../components/layout/Footer'

function HomePage() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default HomePage
