"use client";
import { useRouter } from "next/navigation";
import { useUserContextData } from "../context/userData";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Check } from "lucide-react";
import Swal from "sweetalert2";
import { useState } from "react";

const Pricing = () => {
  const router = useRouter();

const handleSubscribe = (plan: any) => {
  router.push(`/subscribe?plan=${encodeURIComponent(plan.name)}&amount=${plan.price}`);
};


  const plans = [
    {
      name: "Pay Per Use",
      price: "Free",
      interval: "Join anytime",
      bestFor:
        "solo hustlers and side businesses who want to pay as they grow.",
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
    {
      name: "Business Starter",
      price: "₦5,000",
      interval: "per month",
      bestFor: "SMEs that want freedom from pay-per-use charges.",
      features: [
        "Unlimited Invoices & Receipts (no ₦100 fee)",
        "Invoice payment fees: 1.5% (reduced from 3%)",
        "Contracts: 10 contracts per month",
        "Lawyer-Signed Contracts: ₦9,500 each",
        "Cashback & rewards included",
        "Tax Filing Support: 2% of monthly revenue capped at ₦100k",
      ],
      buttonText: "Subscribe",
      highlighted: true,
    },
    {
      name: "Premium CFO",
      price: "₦20,000",
      interval: "per month",
      bestFor:
        "serious entrepreneurs who want peace of mind, growth, and full access.",
      features: [
        "Unlimited Invoices & Receipts",
        "Unlimited Contracts",
        "Zero Transaction Fees on invoices",
        "Priority Support",
      ],
      buttonText: "Subscribe",
    },
    {
      name: "Diamond CFO",
      price: "₦20,000",
      interval: "per month",
      bestFor:
        "Entrepreneurs who want one-on-one financial support.",
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${
                plan.highlighted
                  ? "border-2 border-[#C29307] shadow-xl scale-105"
                  : "border border-gray-200 hover:shadow-lg"
              } transition-all duration-300`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#C29307] text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-500 mb-4">{plan.bestFor}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.interval}</span>
                </div>
              </CardHeader>

              <CardContent>
                <Button
                  onClick={() => handleSubscribe(plan)}
                  className="w-full bg-[#C29307] hover:bg-[#a67a05] text-white py-3 rounded-lg font-semibold"
                >
                 {plan.buttonText}
                </Button>

                <ul className="space-y-3 list-disc list-inside mt-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-gray-600 text-sm">{feature}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
