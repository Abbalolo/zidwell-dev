"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataPlan {
  plan: string;
  amount: number;
}

interface DataPlanSelectorProps {
  plans: DataPlan[];
  selectedPlan: DataPlan | null;
  onSelect: (plan: DataPlan) => void;
}

// Better matching with your sample data
const tabs = ["Daily", "Weekly", "Monthly", "2Months"] as const;

export default function DataPlanSelector({
  plans,
  selectedPlan,
  onSelect,
}: DataPlanSelectorProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Daily");

  if (!plans?.length) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center">
        No data plans available. Please select a provider.
      </div>
    );
  }

  // Filter based on tab
  const filteredPlans = plans.filter((plan) => {
    const desc = plan.plan.toLowerCase();
    if (activeTab === "Daily") return desc.includes("day");
    if (activeTab === "Weekly") return desc.includes("7day") || desc.includes("week");
    if (activeTab === "Monthly") return desc.includes("30day") || desc.includes("month");
    if (activeTab === "2Months") return desc.includes("2month");
    return false;
  });

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-NG", { style: "decimal" }).format(value);

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
          filteredPlans.map((plan, index) => {
            const isSelected = selectedPlan?.plan === plan.plan;

            return (
              <Card
                key={index}
                onClick={() => onSelect(plan)}
                className={`relative cursor-pointer transition-all border-2 rounded-xl ${
                  isSelected
                    ? "border-[#C29307] ring-1 ring-[#C29307]"
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
                    ₦{formatNumber(plan.amount)}
                  </CardTitle>
                 
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground">{plan.plan}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
