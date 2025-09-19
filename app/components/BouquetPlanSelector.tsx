"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle2 } from "lucide-react";

interface BouquePlanSelectorProps {
  plans: any;
  selectedPlan: any | null;
  onSelect: (plan: any) => void;
}

export default function BouquePlanSelector({
  plans,
  selectedPlan,
  onSelect,
}: BouquePlanSelectorProps) {


  if (!plans?.length) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center">
        No bouquet available. Please select a provider.
      </div>
    );
  }

  return (
    <div>
      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {plans.map((plan: any, idx: number) => {
          const isSelected = selectedPlan?.subScriptionType === plan.subScriptionType;
          const planPrice = parseFloat(plan.amount);

          return (
            <Card
              key={idx}
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
                {plan.subScriptionType && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.subScriptionType}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
