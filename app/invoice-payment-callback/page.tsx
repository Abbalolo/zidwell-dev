"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  const invoiceId = searchParams.get("invoiceId");

  useEffect(() => {
    async function checkInvoiceStatus() {
      if (!invoiceId) return;

      try {
        const res = await fetch(
          `/api/check-invoice-status?invoiceId=${invoiceId}`
        );
        const data = await res.json();
       

        if (data?.status === "paid") {
          Swal.fire({
            title: "Payment Successful 🎉",
            text: `Invoice #${invoiceId} has been paid.`,
            icon: "success",
            confirmButtonText: "OK",
          })
          // .then(() => {
          //   if (data.public_token) {
          //     router.push(`/sign-invoice/${data.public_token}`);
          //   } else {
          //     router.push("/dashboard"); 
          //   }
          // });
          
        } else {
          Swal.fire(
            "Payment Pending ⏳",
            "Your payment has not been confirmed yet. Please wait a few moments.",
            "info"
          );
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error ❌", "Could not fetch invoice status.", "error");
      } finally {
        setLoading(false);
      }
    }

    checkInvoiceStatus();
  }, [invoiceId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading ? "Processing payment..." : "Redirecting..."}
    </div>
  );
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
