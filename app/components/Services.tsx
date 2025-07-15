"use client";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { 
  Tv, 
  Smartphone, 
  GraduationCap, 
  Zap, 
  Wifi, 
  Calculator,
  Scale,
  FileText
} from "lucide-react";
import { useRouter } from "next/navigation";

const Services = () => {
  const router = useRouter();
  const services = [
    {
      icon: <Tv className="h-10 w-10" />,
      title: "Cable TV",
      description: "Pay for your cable TV subscriptions from all major providers instantly.",
      color: "from-red-500 to-red-600",
     
    },
    {
      icon: <Smartphone className="h-10 w-10" />,
      title: "Airtime",
      description: "Top up your mobile phone with airtime for all networks quickly.",
      color: "from-green-500 to-green-600",
     

    },
    {
      icon: <GraduationCap className="h-10 w-10" />,
      title: "Education",
      description: "Pay school fees, exam fees, and other educational expenses seamlessly.",
      color: "from-blue-500 to-blue-600",
     
    },
    {
      icon: <Zap className="h-10 w-10" />,
      title: "Buy Power",
      description: "Purchase electricity units for your home or office with ease.",
      color: "from-yellow-500 to-yellow-600",
      link: "/platform-services/#electricity"
    },
    {
      icon: <Wifi className="h-10 w-10" />,
      title: "Buy Data",
      description: "Get data bundles for all networks at competitive rates.",
      color: "from-purple-500 to-purple-600",
 
    },
    {
      icon: <Calculator className="h-10 w-10" />,
      title: "AI Accountant",
      description: "Smart accounting assistance powered by artificial intelligence.",
      color: "from-indigo-500 to-indigo-600",
      
    },
    {
      icon: <Scale className="h-10 w-10" />,
      title: "Legal Contact",
      description: "Connect with legal professionals for your business needs.",
      color: "from-gray-500 to-gray-600",
     
    },
    {
      icon: <FileText className="h-10 w-10" />,
      title: "Create Invoice",
      description: "Generate professional invoices for your business in minutes.",
      color: "from-orange-500 to-orange-600",
      
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-5 lg:px-20 ">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            All Your Bills
            <span className="ml-2 text-[#C29307]">
              One Platform
            </span>
          </h2>
          <p className="md:text-xl text-gray-600 max-w-3xl mx-auto">
            Save time and money by managing all your bill payments in one convenient location.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service:any, index) => (
            <Card 
              key={index} 
              onClick={() => router.push("/platform-services")}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-white hover:scale-105"
            >
              <CardContent className="p-8 text-center">
                <div className={`mb-6 w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${service.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                  {service.icon}
                </div>
                <Link href="/platform-services" className="text-xl hover:underline font-semibold text-gray-900 mb-3">
                  {service.title}
                </Link>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-0 md:space-x-8 text-gray-500">
            <div className="flex items-center flex-col ">
              <span className="text-3xl font-bold text-gray-900">500K+</span>
              <span className="ml-2">Bills Paid</span>
            </div>
            <div className="flex items-center  flex-col ">
              <span className="text-3xl font-bold text-gray-900">50K+</span>
              <span className="ml-2">Happy Users</span>
            </div>
            <div className="flex items-center  flex-col ">
              <span className="text-3xl font-bold text-gray-900">99.9%</span>
              <span className="ml-2">Success Rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
