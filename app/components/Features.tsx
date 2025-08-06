
import { 
  Shield, 
  Zap, 
  Clock, 
  Smartphone, 
  CreditCard, 
  Users,
  CheckCircle,
  HeadphonesIcon,
  Bell
} from "lucide-react";
import { Card, CardContent } from "./ui/card";

const Features = () => {
  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Payments",
      description: "Complete your bill payments in seconds with our lightning-fast processing system."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Bank-Level Security",
      description: "Your transactions are protected with military-grade encryption and security protocols."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "24/7 Availability",
      description: "Pay your bills anytime, anywhere. Our platform never sleeps, so you're always covered."
    },
   
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Multiple Payment Options",
      description: "Use cards, bank transfers, or mobile money. We support all major payment methods."
    },
   
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Payment History",
      description: "Track all your payments with detailed history and downloadable receipts."
    },
  
    {
      icon: <HeadphonesIcon className="h-8 w-8" />,
      title: "Expert Support",
      description: "Get help when you need it with our friendly customer support team."
    }
  ];

  return (
    <section data-aos="fade-down" id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose{" "}
            <span className="text-[#C29307]">
              Zidwell?
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the easiest, fastest, and most secure way to pay all your bills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 border-0 bg-gray-50 hover:bg-white hover:scale-105"
            >
              <CardContent className="p-8">
                <div className="mb-4 text-[#C29307] transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
