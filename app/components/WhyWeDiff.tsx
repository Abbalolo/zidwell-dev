import { Coins, GraduationCap, Bot, Smartphone, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const WhyWeDiff = () => {
  return (
    <section data-aos="fade-up" className="py-20 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 lg:px-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Why We Are Different
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Yes, we know there are many other bill payment platforms out there. 
            But Zidwell isn't just another payment app - we're revolutionizing how you manage your finances.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Earn While You Spend */}
          <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-2xl border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="mb-6 relative">
                <div className="w-20 h-20 mx-auto bg-[#C29307] rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <Coins className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#e4b421] rounded-full animate-pulse"></div>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Earn While You Spend
              </h3>
              
              <div className="space-y-4 text-muted-foreground">
                <p className="font-semibold text-primary">
                  Zidcoins Rewards System
                </p>
                <p>
                  Earn 1 Zidcoin for every ₦1,000 spent on bills
                </p>
                <p>
                  Convert points to cash, airtime, or investment opportunities
                </p>
                <p className="text-sm font-medium text-foreground">
                  Turn your daily expenses into earnings!
                </p>
              </div>

              <Button className="mt-6 bg-[#C29307] hover:to-primary/70">
                Start Earning
              </Button>
            </CardContent>
          </Card>

          {/* Financial Literacy */}
          <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-2xl border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="mb-6 relative">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Financial Education
              </h3>
              
              <div className="space-y-4 text-muted-foreground">
                <p className="font-semibold text-blue-600">
                  Learn While You Pay
                </p>
                <p>
                  Access free financial literacy resources
                </p>
                <p>
                  Business growth tips and wealth building strategies
                </p>
                <p className="text-sm font-medium text-foreground">
                  Knowledge is your greatest investment!
                </p>
              </div>

              <Button className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Learn More
              </Button>
            </CardContent>
          </Card>

          {/* AI Assistant */}
          <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-2xl border-0 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="mb-6 relative">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500 rounded-full animate-pulse"></div>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">
                AI Assistant - Ziddy
              </h3>
              
              <div className="space-y-4 text-muted-foreground">
                <p className="font-semibold text-teal-600">
                  Your Personal Finance Helper
                </p>
                <p>
                 Get your business accounting done in minutes
                </p>
                <p>
                 Get simple analysis of your business income and expenses 

                </p>
                <p className="text-sm font-medium text-foreground">
                 Ziddy makes complex things simple
                </p>
              </div>

              <Button className="mt-6 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white">
                Meet Ziddy
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Steps */}
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-3xl p-8 md:p-12">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            How Zidwell Works
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto bg-[#C29307] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="w-8 h-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-2">1. Choose Your Bills</h4>
              <p className="text-muted-foreground">Select from electricity, water, internet, cable TV, and more</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto bg-[#C29307] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-2">2. Pay Securely</h4>
              <p className="text-muted-foreground">Load your zidcoin wallet with simple bank transfer 
</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto bg-[#C29307] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-2">3. Earn & Learn</h4>
              <p className="text-muted-foreground">Earn bonuses  as you pay bills - easy pizzy</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhyWeDiff;