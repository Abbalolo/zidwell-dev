"use client";
import { useState } from "react";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button"; 
import FirstTimeForm from "@/app/components/FirstTimeForm";
import ReturningForm from "@/app/components/ReturningForm";
import TaxFilingGen from "./TaxGen";


type ViewType = 'main' | 'first-time' | 'returning';

const TaxFiling = () => {
  const navigate = useRouter();
  const [currentView, setCurrentView] = useState<ViewType>('main');

  const renderMainView = () => (
    <>

      {/* Video Placeholder */}
      <Card className=" p-6 mb-2 shadow-card">
        {/* <div className="aspect-video bg-tax-gray rounded-lg mb-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-tax-navy rounded-full flex items-center justify-center mb-4 mx-auto">
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-white ml-1"></div>
            </div>
            <p className="text-tax-navy font-semibold">Tax Filing Process Overview</p>
            <p className="text-sm text-muted-foreground">Click to watch our step-by-step guide</p>
          </div>
        </div> */}
        
        <div className="">
          <h3 className="text-xl font-semibold mb-3">How Our Tax Filing Process Works</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Submit your required documents through our secure platform</li>
            <li>• Our certified tax professionals review your information</li>
            <li>• We calculate your taxes and provide a detailed breakdown</li>
            <li>• You receive an invoice with tax amounts and service charges</li>
            <li>• Upon payment, we file your taxes and provide official receipts</li>
          </ul>
        </div>
      </Card>

      {/* Options */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-8 shadow-card hover:shadow-form transition-shadow">
          <h3 className="text-2xl font-bold  mb-4">First-Time Tax Filing</h3>
          <p className="text-muted-foreground mb-6">
            New to our services? We'll guide you through the complete process and 
            set up your tax profile for future filings.
          </p>
          <ul className="text-sm text-muted-foreground mb-6 space-y-1">
            <li>• Complete document verification</li>
            <li>• NIN and business registration</li>
            <li>• Full tax assessment setup</li>
          </ul>
          <Button
            size="lg"
            className="w-full bg-[#C29307] hover:bg-[#C29307] text-white cursor-pointer"
            onClick={() => setCurrentView('first-time')}
          >
            Start First-Time Filing
          </Button>
        </Card>

        <Card className="p-8 shadow-card hover:shadow-form transition-shadow">
          <h3 className="text-2xl font-bold text-tax-navy mb-4">Returning Tax Filing</h3>
          <p className="text-muted-foreground mb-6">
            Already have an account with us? Quick and easy filing with 
            your existing profile information.
          </p>
          <ul className="text-sm text-muted-foreground mb-6 space-y-1">
            <li>• Streamlined process</li>
            <li>• Bank statement upload only</li>
            <li>• Faster processing time</li>
          </ul>
          <Button
            size="lg"
           
            className="w-full  bg-[#C29307] text-white cursor-pointer"
            onClick={() => setCurrentView('returning')}
          >
            Continue as Returning Client
          </Button>
        </Card>
      </div>
    </>
  );

  return (
    <div className="min-h-screen">

      <main className="md:container md:mx-auto p-5">
        {currentView === 'main' && renderMainView()}
        {currentView === 'first-time' && <FirstTimeForm />}
        {currentView === 'returning' && <ReturningForm />}
      </main>

      <TaxFilingGen/>
    </div>
  );
};

export default TaxFiling;
