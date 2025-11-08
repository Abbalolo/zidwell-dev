// components/Pricing.tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Check, Crown, Zap, Building, Star } from "lucide-react";
import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import { useUserContextData } from "../context/userData";

const Pricing = () => {
  const router = useRouter();
  const { user } = useUserContextData();
  const [loading, setLoading] = useState<string | null>(null);

  // Check if we should auto-scroll to pricing after login
  useEffect(() => {
    // Check URL parameters for login redirect
    const urlParams = new URLSearchParams(window.location.search);
    const fromLogin = urlParams.get('fromLogin');
    const scrollToPricing = urlParams.get('scrollToPricing');

    if (fromLogin === 'true' && scrollToPricing === 'true' && user) {
      // Get the stored plan from localStorage
      const savedPlan = localStorage.getItem('selectedPlan');
      
      if (savedPlan) {
        const plan = JSON.parse(savedPlan);
        
        // Clear the stored plan
        localStorage.removeItem('selectedPlan');
        
        // Remove the query parameters from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // Scroll to pricing section
        setTimeout(() => {
          const pricingSection = document.getElementById('pricing');
          if (pricingSection) {
            pricingSection.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          
          // Show a message that we're resuming their subscription
          Swal.fire({
            title: 'Welcome Back!',
            text: `Continuing with your ${plan.name} subscription...`,
            icon: 'info',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            // Automatically proceed with the subscription
            handlePlanSubscription(plan);
          });
        }, 1000);
      }
    }
  }, [user]);

  const handleSubscribe = async (plan: any) => {
    if (!user) {
      // Store the selected plan in localStorage
      localStorage.setItem('selectedPlan', JSON.stringify(plan));
      
      // Get current page path for return URL
      const currentPath = window.location.pathname;
      
      // Redirect to login with return URL that includes scroll parameters
      router.push(`/auth/login?returnUrl=${currentPath}&fromLogin=true&scrollToPricing=true`);
      return;
    }

    // User is authenticated, proceed with subscription
    handlePlanSubscription(plan);
  };

  const handlePlanSubscription = async (plan: any) => {
    if (plan.name === "Pay Per Use") {
      // Handle free plan
      // try {
      //   const response = await fetch('/api/subscriptions/free', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       userId: user?.id,
      //       planName: plan.name,
      //     }),
      //   });

      //   const data = await response.json();
        
      //   if (data.success) {
      //     Swal.fire({
      //       icon: 'success',
      //       title: 'Welcome!',
      //       text: 'You are now on the Pay Per Use plan.',
      //     }).then(() => {
      //       router.push('/dashboard');
      //     });
      //   } else {
      //     throw new Error(data.message || 'Failed to activate free plan');
      //   }
      // } catch (error: any) {
      //   Swal.fire({
      //     icon: 'error',
      //     title: 'Error',
      //     text: error.message || 'Failed to activate free plan.',
      //   });
      // }

      router.push('/auth/signup');
      return;
    }

    setLoading(plan.name);

    try {
      // Generate a simple plan ID based on plan name
      const planId = plan.name.toLowerCase().replace(/\s+/g, '-');
      const amount = parseFloat(plan.price.replace('₦', '').replace(',', ''));

      // Initialize subscription payment
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          fullName: `${user?.firstName} ${user?.lastName}`,
          planId: planId,
          planName: plan.name,
          amount: amount,
          userId: user?.id,
          features: plan.features
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to payment page
        window.location.href = data.checkoutUrl;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Subscription Failed',
          text: data.error || data.detail || 'Could not initialize subscription',
        });
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "Business Starter": return <Zap className="w-6 h-6" />;
      case "Premium CFO": return <Building className="w-6 h-6" />;
      case "Diamond CFO": return <Crown className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  const plans = [
    {
      name: "Pay Per Use",
      price: "Free",
      interval: "Join anytime",
      bestFor: "solo hustlers and side businesses who want to pay as they grow.",
      features: [
        "Bill Payments: Airtime, Data, Electricity, Cable (Govt. standard fees apply)",
        "Invoices/payment links: ₦100 each + 3% per paid invoice (transferable to payee)",
        "Receipts: ₦100 each",
        "Simple Contracts: ₦1,000 each",
        "Lawyer-Signed Contracts: ₦11,000 each",
        "Tax Filing Support: 3% of monthly revenue",
        "Free virtual bank account creation",
        "Deposit fee: 0.75%",
        "Withdrawals/settlements fee: 0.75%",
        "Cashback: ₦20 back for every ₦2,000 spent",
        "Referral Rewards: ₦20 per signup",
        "Referral Transaction Rewards: ₦20 per ₦10,000 spent by your referral",
      ],
      buttonText: "Get Started",
    },
    // {
    //   name: "Business Starter",
    //   price: "₦5,000",
    //   interval: "per month",
    //   bestFor: "SMEs that want freedom from pay-per-use charges.",
    //   features: [
    //     "Unlimited Invoices & Receipts (no ₦100 fee)",
    //     "Invoice payment fees: 1.5% (reduced from 3%)",
    //     "Contracts: 10 contracts per month",
    //     "Lawyer-Signed Contracts: ₦9,500 each",
    //     "Cashback & rewards included",
    //     "Tax Filing Support: 2% of monthly revenue capped at ₦100k",
    //   ],
    //   buttonText: "Subscribe",
    //   highlighted: true,
    // },
    {
      name: "Premium CFO",
      price: "₦20,000",
      interval: "per month",
      bestFor: "serious entrepreneurs who want peace of mind, growth, and full access.",
      features: [
        "Unlimited Invoices & Receipts",
        "Unlimited Contracts",
        "Zero Transaction Fees on invoices",
        "Priority Support",
      ],
      buttonText: "Subscribe",
      highlighted: true,
    },
    {
      name: "Diamond CFO",
      price: "₦250,000",
      interval: "per month",
      bestFor: "Entrepreneurs who want one-on-one financial support.",
      features: [
        "Dedicated Business Advisor",
        "Premium CFO Support",
        "Free Access to BOH Events",
      ],
      buttonText: "Subscribe",
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple
            <span className="block bg-[#C29307] bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start free and upgrade as your needs grow. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-auto md:mx-16">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative flex flex-col h-full ${
                plan.highlighted
                  ? "border-2 border-[#C29307] shadow-xl scale-105"
                  : "border border-gray-200 hover:shadow-lg"
              } transition-all duration-300`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#C29307] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-6 pt-8">
                <div className="flex justify-center mb-3">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-3">{plan.bestFor}</p>
                <div className="mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 text-sm ml-1">{plan.interval}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.name}
                  className={`w-full ${
                    plan.highlighted 
                      ? 'bg-[#C29307] hover:bg-[#a67a05] text-white' 
                      : plan.name === "Pay Per Use"
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  } py-3 rounded-lg font-semibold mb-6`}
                >
                  {loading === plan.name ? 'Processing...' : plan.buttonText}
                </Button>

                <div className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional info */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            All paid plans include a 7-day money-back guarantee. No long-term contracts.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;