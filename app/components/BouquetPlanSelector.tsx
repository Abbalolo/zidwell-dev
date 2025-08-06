"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";


export interface PlansWrapper {
  packages: any[];
}

interface BouquePlanSelectorProps {
  plans: any;
  selectedPlan: any | null;
  onSelect: (plan: any) => void;
}




const tabs = ["Compact", "Family", "Premium"] as const;

export default function BouquePlanSelector({
  plans,
  selectedPlan,
  onSelect,
}: BouquePlanSelectorProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Compact");

  if (!plans?.packages?.length) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center">
        No bouquet available. Please select a provider.
      </div>
    );
  }

  const filteredPlans = plans.packages.filter((plan: any) => {
    const desc = plan.description?.toLowerCase() || "";
    return activeTab === "Compact" || desc.includes(activeTab.toLowerCase());
  });

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1 rounded-full text-sm border transition",
              activeTab === tab
                ? "bg-[#C29307] text-white border-[#C29307]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full text-sm text-muted-foreground text-center py-4">
            No {activeTab.toLowerCase()} plans available.
          </div>
        ) : (
          filteredPlans.map((plan: any) => {
            const isSelected = selectedPlan?.code === plan.code;
            const planPrice = parseFloat(plan.price);

            return (
              <Card
                key={plan.code}
                onClick={() => onSelect(plan)}
                className={`relative cursor-pointer transition-all border-2 rounded-xl ${
                  isSelected
                    ? "border-[#C29307] ring-2 ring-blue-200"
                    : "hover:border-gray-300 border-gray-200"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 text-[#C29307]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    ₦{planPrice.toLocaleString()}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
