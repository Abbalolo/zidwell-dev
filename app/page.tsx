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


const page = () => {

  return (
    <div className="fade-in min-h-screen bg-white">
      <Header />
      <Hero />
      <Services />
      <WhyWeDiff />
      {/* <Pricing /> */}
      <Features />
      {/* <Pricing /> */}
      <Testimonials />
      <Faq />
      <CTA />
      <Contact/>
      <Podcast/>
      <Footer />
    </div>
  );
};

export default page;
