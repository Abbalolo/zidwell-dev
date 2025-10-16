import {
  Shield,
  Zap,
  Clock,
  Smartphone,
  CreditCard,
  Users,
  CheckCircle,
  HeadphonesIcon,
  Bell,
  HelpCircle,
  File,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";

const Features = () => {
  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Smooth, Instant Payments",
      description:
        "Pay bills and handle transactions in seconds, without the usual stress or delay.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Bank-Level Security",
      description:
        "Your money and data are protected with the same encryption trusted by top financial institutions.",
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Always On, Always Reliable",
      description:
        "Day or night, Zidwell is here — ready whenever your business needs to move.",
    },

    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Multiple Payment Options",
      description:
        "Use cards, bank transfers, or mobile money. We support all major payment methods.",
    },

    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "All-in-One Simplicity",
      description:
        "From bank transfers to mobile payments, every method works seamlessly inside Zidwell.",
    },

    {
      icon: <File className="h-8 w-8" />,
      title: "Stay Organized Effortlessly",
      description:
        "See your entire financial history, download receipts, and stay on top of your business in one view.",
    },
    {
      icon: <HelpCircle className="h-8 w-8" />,
      title: "Real Support, Real People",
      description:
        "Whenever you need help, our support team is just a message away — fast, friendly, and ready to help you win.",
    },
  ];

  return (
    <section data-aos="fade-down" id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose <span className="text-[#C29307]">Zidwell?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Because managing your business should feel effortless. Zidwell
            brings everything — bills, invoices, contracts, and taxes — into one
            simple, secure space designed for peace of mind.
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
