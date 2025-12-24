import { HelmetProvider } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedExperiences from "@/components/home/FeaturedExperiences";
import CommunityPreview from "@/components/home/CommunityPreview";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <HelmetProvider>
      <SEOHead />
      <Layout>
        <Hero />
        <HowItWorks />
        <FeaturedExperiences />
        <CommunityPreview />
        <CTASection />
      </Layout>
    </HelmetProvider>
  );
};

export default Index;