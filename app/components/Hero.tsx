import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowRight, Zap, Shield } from "lucide-react";

const Hero = () => {
  const router = useRouter();
  return (
    <section
      data-aos="face-down"
      className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 "
    >
      {/* background design */}
      <div className="absolute h-full inset-0 bg-patterns"></div>

      {/* Main content */}
      <div className="container mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Zap className="w-4 h-4 mr-2" />
              Smart finance tools for Nigerian businesses
            </span>
          </div>

          <h1 className="text-4xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Fast & Easy to use Financial tools{" "}
            <span className="text-[#C29307]">for small businesses</span>
          </h1>

          <p className="md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            {/* We created Zidwell to make sure small businesses have all the financial tools they need to run smoothly. Everything here works as it should, we had you in mind when creating this platform */}
           Business is all about making Smart Moves. With Zidwell, you can take control of your business finances — pay bills, send invoices, manage business contracts, do your taxes, and even earn rewards per transaction. Now that's a smart move.
            
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={() => router.push("/auth/signup")}
              size="lg"
              className="bg-[#C29307] text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
            >
              Make Smart Moves
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="font-medium">✓ Instant Payments</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">✓ Secure Transactions</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">✓ 24/7 Support</span>
            </div>
          </div>
        </div>
        {/* <div className="flex justify-center mt-16 items-center p-10">

        <Image className="md:w-[400px] h-full w-full" src={payment} alt="payment ilustration"/>
        </div> */}
      </div>
    </section>
  );
};

export default Hero;
