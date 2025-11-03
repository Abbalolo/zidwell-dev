// app/dashboard/subscription/success/page.tsx
"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button"; 
import { CheckCircle, Mail, Calendar } from "lucide-react";
import Link from "next/link";

function SubscriptionSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subscriptionId = searchParams.get("subscriptionId");
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subscriptionId) {
      fetchSubscriptionDetails();
    } else {
      router.push('/dashboard');
    }
  }, [subscriptionId, router]);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C29307] mx-auto"></div>
          <p className="mt-4 text-gray-600">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Subscription Activated!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {subscription && (
            <div className="text-left bg-gray-50 p-4 rounded-lg space-y-2">
              <p><strong>Plan:</strong> {subscription.plan_name}</p>
              <p><strong>Amount:</strong> ₦{subscription.amount}</p>
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span><strong>Valid Until:</strong> {new Date(subscription.expires_at).toLocaleDateString()}</span>
              </p>
            </div>
          )}
          
          <p className="text-gray-600">
            Welcome to your new plan! You now have access to all the premium features.
            A confirmation email has been sent to your inbox.
          </p>
          
          <div className="space-y-2">
            <Button asChild className="w-full bg-[#C29307] hover:bg-[#a67a05]">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/account">
                Manage Subscription
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function Success() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionSuccess  />
    </Suspense>
  );
}