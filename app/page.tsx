"use client";
import Contact from "./components/Contact";
import CTA from "./components/CTA";
import Faq from "./components/Faq";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import WhyWeDiff from "./components/WhyWeDiff";
import Podcast from "./components/Podcast";

import Services from "./components/Services";
import Testimonials from "./components/Testimonials";
import AOS from 'aos';
import { useEffect } from "react";
import 'aos/dist/aos.css'; // Import AOS styles
import PodcastSection from "./components/Podcast";
import Pricing from "./components/Pricing";

const page = () => {



useEffect(() => {
  AOS.init({
    duration: 800, // animation duration in ms
    once: true,    // whether animation should happen only once
  });
}, []);

  return (
    <div className="fade-in min-h-screen">
  <Header />
  <Hero />              
  <Services />           
  <WhyWeDiff />        
  <Features />           
  <Testimonials />      
  <Pricing />           
  <Faq />                
  <CTA />                
  <PodcastSection />    
  <Contact />           
  <Footer />           
</div>

  );
};

export default page;
