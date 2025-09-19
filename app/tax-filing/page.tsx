"use client"
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ArrowLeft, CheckCircle, Download, Upload, CreditCard, Mail } from "lucide-react";
import { useRouter } from "next/navigation";


const TaxFilingInfoPage = () => {
  const navigate = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-white py-6">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate.push('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Tax Filing Information</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-tax-navy mb-6">Professional Tax Filing Services</h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Many SMEs don't know how much they're making or owing until it's too late and they get into trouble with tax officials, 
            which will cost them much more to resolve. Poor bookkeeping blocks access to loans, grants, investors, and proper business 
            growth planning. We have standby professionals to help you with your basic accounting and tax filing for the state and 
            federal government.
          </p>
        </div>

        {/* 4 Reasons Section */}
        <Card className="mb-12 shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl text-tax-navy">4 Reasons You Need Proper Accounting and Tax Filing With Us</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-tax-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <p className="text-muted-foreground">You'll get a detailed financial report every month of the financial health of your business</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-tax-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <p className="text-muted-foreground">We take the headache out of tax calculations so you can focus on your business</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-tax-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <p className="text-muted-foreground">You'll pay the lowest tax possible with our guidance</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-tax-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <p className="text-muted-foreground">You'll sit in your office, we'll do the running around the state and federal tax offices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works Section */}
        <Card className="mb-12 shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl text-tax-navy">How It Works (Tax Filing Made Easy)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-tax-navy mb-2">Step 1: Download Your Bank Statement</h3>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• If this is your first time tax filing, download the last 6 months of statements from your business bank app (or request it from your bank).</li>
                    <li>• If you're a returning user, just download last month's statement.</li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-tax-navy mb-2">Step 2: Choose Your Filing Type</h3>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Click "First-Time Tax Filing" if this is your first submission with us.</li>
                    <li>• Click "Returning Tax Filing" if you filed with us last month and are filing again.</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-tax-navy mb-2">Step 3: Upload Your Documents</h3>
                  <p className="text-muted-foreground">Upload your bank statement (and any required documents if you're a first-time filer).</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-tax-navy mb-2">Step 4: Submit & Make Payment</h3>
                  <p className="text-muted-foreground">Click Submit and Pay to process your request securely.</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-tax-navy mb-2">Step 5: Get Confirmation</h3>
                  <p className="text-muted-foreground">You'll receive an instant success message on screen and a confirmation email.</p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-tax-navy mb-2">Step 6: Receive Your Filing Summary</h3>
                  <p className="text-muted-foreground mb-2">We'll review your data and send you:</p>
                  <ul className="text-muted-foreground space-y-1 ml-4">
                    <li>• A summarized financial statement for the month. Explaining how your business is doing financially from an accountant's perspective.</li>
                    <li>• An invoice showing how much tax you owe. This invoice will also contain our service charge</li>
                  </ul>
                </div>
              </div>

              {/* Step 7 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-tax-green rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">7</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-tax-navy mb-2">Step 7: Complete Your Tax Filing</h3>
                  <p className="text-muted-foreground">Once you pay the tax invoice, we'll file your taxes and send you the official tax receipt via email.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-primary text-white shadow-card">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-white" />
            <h2 className="text-2xl font-bold mb-4">Just like that, your business taxes are up to date, with no stress.</h2>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate.push('/tax-filing')}
              className="bg-white text-tax-navy hover:bg-white/90"
            >
              Start Tax Filing Process
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TaxFilingInfoPage;