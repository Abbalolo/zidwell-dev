import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowRight, Receipt, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function CableCustomerCard(props: any) {
  const {
    customerName,
    decorderNumber,
    service,
    selectedProvider,
    selectedPlan,
    loading,
    validateForm,
    setIsOpen,
    errors,
  } = props;

  return (
    <div className="sticky top-6 flex flex-col gap-3">
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
            {service && (
              <div className="flex gap-2">
                <span className="font-medium">Subscriber Name:</span>
                <p className="font-semibold">{service}</p>
              </div>
            )}

            {decorderNumber && (
            <div className="flex gap-2">
              <span className="font-medium">Decoder Number:</span>
              <p className="font-semibold">{decorderNumber}</p>
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
          {selectedProvider && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 relative">
                <Image
                  src={selectedProvider.src}
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

          <Button
            onClick={() => {
                  if (validateForm()) {
                    setIsOpen(true);
                  }
                }}
            disabled={!selectedPlan}
            className="w-full bg-[#C29307] hover:opacity-90 py-3 font-semibold rounded-lg shadow-electric-glow transition-all duration-300"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                  Process Payment
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>

          {errors.verification && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.verification}</span>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground mt-4">
            <p>🔒 Secure payment powered by Zidwell</p>
            <p>Instant token generation • 24/7 support</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
