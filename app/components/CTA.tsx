"use client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  const router = useRouter();
  return (
    <section data-aos="fade-down" className="py-20 bg-[#C29307]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Simplify
            <span className="block">Your Bill Payments?</span>
          </h2>
          
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of users who have streamlined their bill payments and never missed a due date with Zidwell.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              onClick={() => router.push("/auth/signup")}
              size="lg" 
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Start Paying Bills Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
          
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-blue-100">
            <div className="flex items-center">
              <span className="font-medium">✓ No setup fees</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">✓ Free to start</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">✓ Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
