"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Send, Loader2, Eye } from "lucide-react";
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

import {
  ContractTemplateType,
  contractTemplates,
} from "@/app/components/ContractGen";
import { useParams, useRouter } from "next/navigation";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DashboardHeader from "@/app/components/dashboard-hearder";
import Swal from "sweetalert2";
import { useUserContextData } from "@/app/context/userData";
import PinPopOver from "@/app/components/PinPopOver";
import ContractsPreview from "@/app/components/previews/ContractsPreview";
import ContractSummary from "@/app/components/ContractSummary";

const Page = () => {
  const { templateId } = useParams();
  const inputCount = 4;
  const router = useRouter();
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showContractSummary, setShowContractSummary] = useState(false);
  const [template, setTemplate] = useState<ContractTemplateType | null>(null);
  const [contractTitle, setContractTitle] = useState("");
  const [contractContent, setContractContent] = useState("");
  const [signeeEmail, setSigneeEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("draft");
  const { userData, setUserData } = useUserContextData();
  
  // New state for toggle buttons
  const [ageAgreement, setAgeAgreement] = useState(false);
  const [termsAgreement, setTermsAgreement] = useState(false);
  
  const [errors, setErrors] = useState({
    contractTitle: "",
    signeeEmail: "",
    contractContent: "",
    status: "",
    pin: "",
    ageAgreement: "",
    termsAgreement: "",
  });

  const form = {
    isOpen: showPreview,
    contract: {
      contract_title: contractTitle,
      contract_text: contractContent,
      description: "",
    },
    onClose: () => setShowPreview(false),
  };

  const CurrentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const getTemplateContent = (
    template: ContractTemplateType,
    user: any,
    currentDate: string = new Date().toLocaleDateString()
  ): string => {
    if (!user?.firstName || !user?.lastName) {
      return "Error: Missing user name information.";
    }

    const templateContent: Record<string, string> = {
      "service-agreement": `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on ${currentDate} between:

Client: [CLIENT_NAME]
Address: [CLIENT_ADDRESS]

Service Provider: [PROVIDER_NAME]
Address: [PROVIDER_ADDRESS]

1. SERVICES
The Service Provider agrees to provide the following services:
[DESCRIPTION_OF_SERVICES]

2. COMPENSATION
Total compensation: [AMOUNT]
Payment terms: [PAYMENT_TERMS]

3. TIMELINE
Project start date: [START_DATE]
Expected completion: [END_DATE]

4. TERMS AND CONDITIONS
[ADDITIONAL_TERMS]


Client Signature: ${user.firstName} ${user.lastName}     Date: ${currentDate}
`,

      "employment-contract": `EMPLOYMENT CONTRACT

This Employment Contract is between [COMPANY_NAME] and [EMPLOYEE_NAME].

Position: [JOB_TITLE]
Start Date: [START_DATE]
Salary: [SALARY_AMOUNT]

Job Responsibilities:
[JOB_DESCRIPTION]

Terms of Employment:
[EMPLOYMENT_TERMS]


Employee Signature: ${user.firstName} ${user.lastName}      Date: ${currentDate}
`,

      "nda-template": `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("NDA") is entered into between:

Disclosing Party: [DISCLOSER_NAME]
Receiving Party: [RECIPIENT_NAME]

1. CONFIDENTIAL INFORMATION
[DEFINITION_OF_CONFIDENTIAL_INFO]

2. OBLIGATIONS
The Receiving Party agrees to:
- Keep all information confidential
- Not disclose to third parties
- Use information only for agreed purposes

3. DURATION
This agreement remains in effect for [DURATION].

Signature: ${user.firstName} ${user.lastName}      Date: ${currentDate}
`,
    };

    return (
      templateContent[template.id as keyof typeof templateContent] ||
      `[Template content for ${template.title}]\n\nPlease customize this contract according to your needs.`
    );
  };

  useEffect(() => {
    if (templateId && typeof templateId === "string" && userData) {
      const foundTemplate = contractTemplates.find((t) => t.id === templateId);
      if (foundTemplate) {
        setTemplate(foundTemplate);
        setContractTitle(`New ${foundTemplate.title}`);
        setContractContent(getTemplateContent(foundTemplate, userData));
      }
    }
  }, [templateId, userData]);

  const validateInputs = () => {
    const newErrors = {
      contractTitle: "",
      signeeEmail: "",
      contractContent: "",
      status: "",
      pin: "",
      ageAgreement: "",
      termsAgreement: "",
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
    if (!ageAgreement) newErrors.ageAgreement = "You must confirm you are 18 years or older.";
    if (!termsAgreement) newErrors.termsAgreement = "You must agree to the contract terms.";

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
          initiatorName: `${userData?.firstName} ${userData?.lastName}`,
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
            Swal.fire("Error", data.error || "Something went wrong", "error");
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

  // Toggle button component - Improved for mobile
  const ToggleButton = ({ 
    isActive, 
    onToggle, 
    label, 
    error 
  }: { 
    isActive: boolean; 
    onToggle: (active: boolean) => void; 
    label: string;
    error: string;
  }) => (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center md:items-end justify-between p-3 sm:p-4 border rounded-lg bg-gray-50 gap-3 sm:gap-4">
        <span className="text-xs sm:text-sm font-medium text-gray-700 flex-1">
          {label}
        </span>
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => onToggle(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C29307] focus:ring-offset-2 ${
              isActive ? 'bg-[#C29307]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-xs sm:text-sm mt-2 px-1">{error}</p>
      )}
    </div>
  );

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
            initiatorName={`${userData?.firstName || ""} ${
              userData?.lastName || ""
            }`}
            initiatorEmail={userData?.email || ""}
            signeeName={signeeEmail.split("@")[0]}
            signeeEmail={signeeEmail}
            status={status}
            amount={20}
            confirmContract={showContractSummary}
            onBack={() => setShowContractSummary(false)}
            onConfirm={handleSummaryConfirm}
            contractType={template?.title || "Contract"}
            dateCreated={CurrentDate}
          />

          {/* Improved Header for Mobile */}
          <div className="border-b bg-card">
            <div className="container mx-auto px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="flex text-[#C29307] items-center gap-2 p-2 sm:p-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground flex flex-wrap items-center gap-2">
                      <span>Contract Editor</span>
                      <button
                        disabled
                        className="pointer-events-none text-xs sm:text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-md whitespace-nowrap"
                      >
                        ₦1,000
                      </button>
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground truncate">
                      Based on: <strong>{template?.title}</strong>
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Hidden on mobile, shown in main content */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex items-center gap-2">
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

          {/* Main Content */}
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Contract Details Card */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl">Contract Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm sm:text-base">Contract Title</Label>
                      <Input
                        id="title"
                        value={contractTitle}
                        onChange={(e) => setContractTitle(e.target.value)}
                        placeholder="Enter contract title"
                        className="mt-1 text-sm sm:text-base"
                      />
                      {errors.contractTitle && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">
                          {errors.contractTitle}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="signeeEmail" className="text-sm sm:text-base">Client Email</Label>
                      <Input
                        id="signeeEmail"
                        value={signeeEmail}
                        onChange={(e) => setSigneeEmail(e.target.value)}
                        placeholder="Enter signee email"
                        className="mt-1 text-sm sm:text-base"
                      />
                      {errors.signeeEmail && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">
                          {errors.signeeEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="status" className="text-sm sm:text-base">Status</Label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background text-sm sm:text-base mt-1"
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">
                          Pending Review for Signature
                        </option>
                      </select>
                      {errors.status && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.status}</p>
                      )}
                    </div>

                    {/* Toggle Buttons Section */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-3">
                        <ToggleButton
                          isActive={ageAgreement}
                          onToggle={setAgeAgreement}
                          label="I agree that I am 18 years and above, the legal age to be engaged in a contract or financial transaction without supervision"
                          error={errors.ageAgreement}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <ToggleButton
                          isActive={termsAgreement}
                          onToggle={setTermsAgreement}
                          label="I have read the terms of this contract and I agree fully to them"
                          error={errors.termsAgreement}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contract Content */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl">Contract Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={contractContent}
                      onChange={(e) => setContractContent(e.target.value)}
                      placeholder="Enter your contract content here..."
                      className="min-h-[500px] sm:min-h-[600px] font-mono text-xs sm:text-sm"
                    />
                    {errors.contractContent && (
                      <p className="text-red-500 text-xs sm:text-sm mt-2">
                        {errors.contractContent}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Action Buttons - Always visible on mobile */}
              <div className="flex flex-col gap-3 lg:hidden sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 justify-center py-3"
                >
                  <Eye className="h-4 w-4" />
                  Preview Contract
                </Button>

                <Button
                  disabled={loading}
                  className={`flex items-center text-white transition justify-center py-3 ${
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

      {/* Preview Modal */}
      <ContractsPreview
        isOpen={showPreview}
        contract={form.contract}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
};

export default Page;