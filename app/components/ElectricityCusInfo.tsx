import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowRight, Receipt, AlertCircle } from "lucide-react";
import Image from "next/image";



export default function ElectricityCustomerCard({
  customerName,
  meterNumber,
  meterType,
  selectedProvider,
  selectedPlan,
  amount,
  loading,
  setIsOpen,
  validateForm,
  errors,
}: any) {
  const parsedAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const total = parsedAmount 

  return (
    <div className="sticky top-6 flex gap-3 flex-col ">
      {/* Customer Info Card */}

      {customerName && (
      <Card className="w-full shadow-md rounded-xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Customer Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          {customerName && (
          <div className="flex gap-2">
            <span className="font-medium">Name:</span>
            <p className="font-semibold">{customerName}</p>
          </div>

          )}

        
          {meterNumber && (
          <div className="flex gap-2">
            <span className="font-medium">Meter Number:</span>
            <p className="font-semibold">{meterNumber}</p>
          </div>

          )}

          {meterType && (
          <div className="flex gap-2">
            <span className="font-medium">Meter Type:</span>
            <p className="font-semibold">{meterType}</p>
          </div>

          )}

         
        </CardContent>
      </Card>

      )}

      {/* Payment Summary Card */}
      <Card className="">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Provider */}
          {selectedProvider && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 relative">
                <Image
                  src={selectedProvider.logo}
                  alt={selectedProvider.name}
                  fill
                  className="object-contain rounded"
                />
              </div>
              <div>
                <p className="font-medium">{selectedProvider.name}</p>
                {selectedProvider.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedProvider.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Amount */}
          {parsedAmount && parsedAmount > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {selectedPlan
                    ? `${selectedPlan.name} (${selectedPlan.duration})`
                    : meterType === "prepaid"
                    ? "Recharge Amount"
                    : "Payment Amount"}
                </span>
                <span>₦{parsedAmount?.toLocaleString()}</span>
              </div>

              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span>₦{total?.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Payment Button */}
          <Button
            onClick={() => {
                  if (validateForm()) {
                    setIsOpen(true);
                  }
                }}
            disabled={!parsedAmount || loading}
            className="w-full bg-[#C29307] hover:opacity-90 py-3 font-semibold rounded-lg shadow-electric-glow transition-all duration-300"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {meterType === "prepaid" ? "Recharge Meter" : "Pay Bill"}
                <ArrowRight className="w-4 h-4" />
                
              </div>
            )}
          </Button>

          {/* Error Message */}
          {errors.verification && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.verification}</span>
            </div>
          )}

          {/* Security Info */}
          <div className="text-center text-xs text-muted-foreground mt-4">
            <p>🔒 Secure payment powered by Zidwell</p>
            <p>Instant token generation • 24/7 support</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
