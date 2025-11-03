// components/SubscriptionManagement.tsx
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useUserContextData } from "../context/userData";
import { Calendar, RefreshCw, X, Crown } from "lucide-react";
import Swal from "sweetalert2";

interface Subscription {
  id: string;
  plan_name: string;
  amount: number;
  status: string;
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
  features: string[];
}

export default function SubscriptionManagement() {
  const { userData } = useUserContextData();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, [userData?.id]);

  const fetchSubscription = async () => {
    if (!userData?.id) return;
    
    try {
      const response = await fetch(`/api/subscriptions/user/${userData.id}`);
      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    const result = await Swal.fire({
      title: 'Cancel Auto-Renewal?',
      text: 'Your subscription will remain active until the end of the billing period, but will not automatically renew.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'Keep Auto-Renewal'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/subscriptions/cancel-auto-renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData?.id,
            subscriptionId: subscription?.id
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSubscription(prev => prev ? { ...prev, auto_renew: false } : null);
          Swal.fire('Cancelled!', 'Auto-renewal has been disabled.', 'success');
        }
      } catch (error) {
        Swal.fire('Error!', 'Failed to cancel auto-renewal.', 'error');
      }
    }
  };

  const handleRenewSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/enable-auto-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData?.id,
          subscriptionId: subscription?.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubscription(prev => prev ? { ...prev, auto_renew: true } : null);
        Swal.fire('Success!', 'Auto-renewal has been enabled.', 'success');
      }
    } catch (error) {
      Swal.fire('Error!', 'Failed to enable auto-renewal.', 'error');
    }
  };

  if (loading) return <div>Loading subscription details...</div>;

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">You don't have an active subscription.</p>
          <Button 
            onClick={() => window.location.href = '/pricing'}
            className="bg-[#C29307] hover:bg-[#a67a05]"
          >
            View Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isExpired = new Date(subscription.expires_at) < new Date();
  const isActive = subscription.status === 'active' && !isExpired;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Your Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{subscription.plan_name} Plan</h3>
            <p className="text-gray-600">₦{subscription.amount} every 30 days</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isExpired ? 'Expired' : subscription.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>Started: {new Date(subscription.starts_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>Expires: {new Date(subscription.expires_at).toLocaleDateString()}</span>
          </div>
        </div>

        {subscription.features && subscription.features.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {subscription.features.slice(0, 3).map((feature, index) => (
                <li key={index}>• {feature}</li>
              ))}
              {subscription.features.length > 3 && (
                <li className="text-blue-600">+ {subscription.features.length - 3} more features</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          {subscription.auto_renew ? (
            <Button variant="outline" onClick={handleCancelSubscription} className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Cancel Auto-Renewal
            </Button>
          ) : (
            <Button onClick={handleRenewSubscription} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Enable Auto-Renewal
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/pricing'}
          >
            Change Plan
          </Button>
        </div>

        {isExpired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              Your subscription has expired. Renew to continue enjoying premium features.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}