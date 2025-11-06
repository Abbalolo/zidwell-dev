"use client";
import { useState } from "react";
import {
  ArrowLeft,
  Send,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DashboardHeader from "@/app/components/dashboard-hearder";
import { useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import PinPopOver from "@/app/components/PinPopOver";
import ContractsPreview from "@/app/components/previews/ContractsPreview";
import ContractSummary from "@/app/components/ContractSummary"; // Import the new component

const Page = () => {
  const inputCount = 4;
  const [contractTitle, setContractTitle] = useState("Untitled Contract");
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showContractSummary, setShowContractSummary] = useState(false); // New state for summary
  const [signeeEmail, setSigneeEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [contractContent, setContractContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [errors, setErrors] = useState({
    contractTitle: "",
    signeeEmail: "",
    contractContent: "",
    status: "",
    pin: "",
  });
  const router = useRouter();
  const { userData } = useUserContextData();

  const form = {
    isOpen: showPreview,
    contract: {
      contract_title: contractTitle,
      contract_text: contractContent,
      description: "",
    },
    onClose: () => setShowPreview(false),
  };

  // Basic validation function
  const validateInputs = () => {
    const newErrors = {
      contractTitle: "",
      signeeEmail: "",
      contractContent: "",
      status: "",
      pin: "",
    };

    if (!contractTitle.trim())
      newErrors.contractTitle = "Contract title is required.";
    if (signeeEmail.trim() === userData?.email) {
      newErrors.signeeEmail =
        "Sorry, the signee email address cannot be the same as the initiator's email address.";
    }
    if (!signeeEmail.trim())
      newErrors.signeeEmail = "Signee email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signeeEmail))
      newErrors.signeeEmail = "Invalid email format.";
    if (!contractContent.trim())
      newErrors.contractContent = "Contract content cannot be empty.";
    if (status === "") newErrors.status = "Please select a status.";

    setErrors(newErrors);

    // Return true if there are no errors, otherwise return false
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/send-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signeeEmail,
          contractText: contractContent,
          initiatorEmail: userData?.email,
          contractTitle,
          status,
          userId: userData?.id,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Contract sent for signature successfully!",
        }).then(() => {
          router.refresh();
        });
        return true;
      } else {
        await handleRefund();
        Swal.fire({
          icon: "error",
          title: "Failed to send",
          text: result.message || "Unknown error",
        });
        return false;
      }
    } catch (err) {
      console.error(err);
      await handleRefund();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while sending the contract.",
      });
      return false;
    }
  };

  const handleDeduct = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const pinString = pin.join("");
      
      fetch("/api/pay-app-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          pin: pinString,
          amount: 20,
          description: "Contract successfully generated",
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            Swal.fire(
              "Error",
              data.error || "Something went wrong",
              "error"
            );
            resolve(false);
          } else {
            resolve(true);
          }
        })
        .catch((err) => {
          Swal.fire("Error", err.message, "error");
          resolve(false);
        });
    });
  };

  const handleRefund = async () => {
    try {
      await fetch("/api/refund-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          amount: 20,
          description: "Refund for failed contract generation",
        }),
      });
      Swal.fire({
        icon: "info",
        title: "Refund Processed",
        text: "₦20 has been refunded to your wallet due to failed contract sending.",
      });
    } catch (err) {
      console.error("Refund failed:", err);
      Swal.fire({
        icon: "warning",
        title: "Refund Failed",
        text: "Payment deduction was made, but refund failed. Please contact support.",
      });
    }
  };

  // Function to process payment and submit contract
  const processPaymentAndSubmit = async () => {
    setLoading(true);
    
    try {
      // First process payment
      const paymentSuccess = await handleDeduct();
      
      if (paymentSuccess) {
        // If payment successful, send contract
        await handleSubmit();
      }
    } catch (error) {
      console.error("Error in process:", error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  // Function to show contract summary first
  const handleSendForSignature = () => {
    if (!validateInputs()) {
      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        text: "Please correct the errors before sending the contract.",
      });
      return;
    }

    // Show contract summary first
    setShowContractSummary(true);
  };

  // Function to proceed to PIN after summary confirmation
  const handleSummaryConfirm = () => {
    setShowContractSummary(false);
    setIsOpen(true); // Show PIN popup next
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen bg-gray-50 fade-in">
        <DashboardSidebar />
        <div className="lg:ml-64">
          <DashboardHeader />

          {/* Header */}
          <PinPopOver
            setIsOpen={setIsOpen}
            isOpen={isOpen}
            pin={pin}
            setPin={setPin}
            inputCount={inputCount}
            onConfirm={processPaymentAndSubmit}
          
          />

          {/* Contract Summary Modal */}
          <ContractSummary
            contractTitle={contractTitle}
            contractContent={contractContent}
            initiatorName={`${userData?.firstName || ''} ${userData?.lastName || ''}`}
            initiatorEmail={userData?.email || ''}
            signeeName={signeeEmail.split('@')[0]} // Extract name from email
            signeeEmail={signeeEmail}
            status={status}
            amount={20}
            confirmContract={showContractSummary}
            onBack={() => setShowContractSummary(false)}
            onConfirm={handleSummaryConfirm}
            contractType="Custom Contract"
            dateCreated={new Date().toLocaleDateString()}
          />

          <div className="border-b bg-card">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="flex text-[#C29307] items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground flex gap-3 items-center">
                      New Contract{" "}
                      <button
                        disabled
                        className="pointer-events-none text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-md"
                      >
                        ₦1,000
                      </button>
                    </h1>
                    <p className="text-muted-foreground">
                      Create a contract from scratch
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    disabled={loading}
                    className={`md:flex items-center text-white transition hidden  ${
                      loading
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-[#C29307] hover:bg-[#b28a06]"
                    }`}
                    onClick={handleSendForSignature}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send for Signature
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contract Details */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Contract Title</Label>
                      <Input
                        id="title"
                        value={contractTitle}
                        onChange={(e) => setContractTitle(e.target.value)}
                        placeholder="Enter contract title"
                      />
                      {errors.contractTitle && (
                        <p className="text-red-500 text-sm">
                          {errors.contractTitle}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="signeeEmail">Client Email</Label>
                      <Input
                        id="signeeEmail"
                        value={signeeEmail}
                        onChange={(e) => setSigneeEmail(e.target.value)}
                        placeholder="Enter signee email"
                      />
                      {errors.signeeEmail && (
                        <p className="text-red-500 text-sm">
                          {errors.signeeEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">
                          Pending Review for Signature
                        </option>
                      </select>
                      {errors.status && (
                        <p className="text-red-500 text-sm">{errors.status}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contract Editor */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Contract Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={contractContent}
                      onChange={(e) => setContractContent(e.target.value)}
                      placeholder="Enter your contract content here..."
                      className="min-h-[600px] font-mono text-sm"
                    />
                    {errors.contractContent && (
                      <p className="text-red-500 text-sm">
                        {errors.contractContent}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Send Button */}
              <div className="flex flex-col gap-3 md:hidden">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview Contract
                </Button>
                
                <Button
                  disabled={loading}
                  className={`flex items-center text-white transition ${
                    loading
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-[#C29307] hover:bg-[#b28a06]"
                  }`}
                  onClick={handleSendForSignature}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send for Signature
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContractsPreview 
        isOpen={showPreview} 
        contract={form.contract} 
        onClose={() => setShowPreview(false)} 
      />
    </div>
  );
};

export default Page;