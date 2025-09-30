'use client';

import Navigation from '@/components/landing/Navigation';
import HeroSection from '@/components/landing/HeroSection';
import DashboardPreview from '@/components/landing/DashboardPreview';
import StatsSection from '@/components/landing/StatsSection';
import AIChatSection from '@/components/landing/AIChatSection';
import InstallationROISection from '@/components/landing/InstallationROISection';
import DemoFormSection from '@/components/landing/DemoFormSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-cyan-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10">
        <Navigation />
        <HeroSection />
        <DashboardPreview />
        <AIChatSection />
        <StatsSection />
        <InstallationROISection />
        <DemoFormSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
