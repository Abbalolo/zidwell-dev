"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils"; // optional utility for className merging



export interface PlansWrapper {
  packages: any[];
}

interface DataPlanSelectorProps {
  plans: any;
  selectedPlan: any | null;
  onSelect: (plan: any) => void;
}

const tabs = ["Daily", "Weekly", "Monthly"] as const;

export default function DataPlanSelector({
  plans,
  selectedPlan,
  onSelect,
}: DataPlanSelectorProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Daily");

  if (!plans?.packages?.length) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center">
        No data plans available. Please select a provider.
      </div>
    );
  }

  const filteredPlans = plans.packages.filter((plan:any) => {
    const desc = plan.description?.toLowerCase() || "";
    return desc.includes(activeTab.toLowerCase());
  });

      const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };


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
      <div className="grid grid-cols-2  md:grid-cols-3 lg:grid-cols-3 gap-4">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full text-sm text-muted-foreground text-center py-4">
            No {activeTab.toLowerCase()} plans available.
          </div>
        ) : (
          filteredPlans.map((plan:any) => {
            const isSelected = selectedPlan?.code === plan.code;
           
            return (
              <Card
                key={plan.plan_id}
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
                    ₦{formatNumber(plan.price)}
                  </CardTitle>
                  {plan.popular && <Badge variant="default">Popular</Badge>}
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {plan.validity} validity
                  </p>
                  {plan.bonus && (
                    <p className="text-xs text-green-600 mt-1">
                      {plan.bonus}
                    </p>
                  )}
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
