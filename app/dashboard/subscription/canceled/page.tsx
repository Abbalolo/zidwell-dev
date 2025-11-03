// app/dashboard/subscription/canceled/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button"; 
import { XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SubscriptionCanceled() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Payment Canceled</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your subscription payment was canceled. No charges have been made to your account.
          </p>
          
          <div className="space-y-2">
            <Button asChild className="w-full bg-[#C29307] hover:bg-[#a67a05]">
              <Link href="/pricing">
                Try Again
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}