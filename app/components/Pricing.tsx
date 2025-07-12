
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Check } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Basic",
      price: "Free",
      period: "",
      description: "Perfect for personal bill payments",
      features: [
        "Pay all types of bills",
        "Payment history",
        "Email notifications",
        "Basic customer support",
        "Mobile app access"
      ],
      buttonText: "Get Started Free",
      highlighted: false
    },
    {
      name: "Premium",
      price: "₦500",
      period: "/month",
      description: "Ideal for families and small businesses",
      features: [
        "Everything in Basic",
        "Family account management",
        "Bill reminders & scheduling",
        "Priority customer support",
        "Advanced payment analytics",
        "Bulk payments",
        "Invoice creation tools",
        "AI accounting assistant"
      ],
      buttonText: "Start Premium",
      highlighted: true
    },
    {
      name: "Business",
      price: "₦2,000",
      period: "/month",
      description: "For businesses and organizations",
      features: [
        "Everything in Premium",
        "Unlimited team members",
        "Advanced reporting",
        "API access",
        "White-label options",
        "Dedicated account manager",
        "Legal consultation access",
        "Custom integrations"
      ],
      buttonText: "Contact Sales",
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start free and upgrade as your needs grow. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative ${
                plan.highlighted 
                  ? 'border-2 border-blue-500 shadow-xl scale-105 bg-gradient-to-b from-blue-50 to-purple-50' 
                  : 'border border-gray-200 hover:shadow-lg'
              } transition-all duration-300`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <Button 
                  className={`w-full mb-6 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      : 'bg-gray-900 hover:bg-gray-800'
                  } text-white py-3 rounded-lg font-semibold transition-all duration-300`}
                >
                  {plan.buttonText}
                </Button>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include secure payments and 24/7 customer support.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
