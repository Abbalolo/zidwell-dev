"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";  

export default function PaymentCallback() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

const router = useRouter()

const tx_ref = searchParams.get("tx_ref");


  useEffect(() => {
    async function handlePayment() {
      if (!invoiceId || !status) return;

      if (status === "completed") {
        // 1️⃣ Verify payment with backend
        const verifyRes = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify( {tx_ref,invoiceId} ),
        });
 console.log("verifyRes" , verifyRes)
        const verifyData = await verifyRes.json();

         console.log("payment Data" , verifyData)


        if (verifyData.message === "Payment verified") {
        
          await fetch("/api/sign-invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invoiceId }),
          });

          Swal.fire({
            title: "Invoice Signed 🎉",
            text: `Payment verified and contract signed for invoice #${invoiceId}`,
            icon: "success",
            confirmButtonText: "OK",
          });
          router.push(`/sign-invoice/${invoiceId}`)
        } else {
          Swal.fire("Verification Failed", "Could not verify payment.", "error");
        }
      } else {
        Swal.fire("Payment Failed ❌", "Your payment was not successful.", "error");
      }
    }

    handlePayment();
  }, [status, invoiceId]);

  return <div className="min-h-screen flex items-center justify-center">Processing...</div>;
}
