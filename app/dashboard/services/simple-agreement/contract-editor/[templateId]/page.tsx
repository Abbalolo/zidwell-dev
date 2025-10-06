"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Download,
  Send,
  Loader2,
  AlertCircle,
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

const Page = () => {
  const { templateId } = useParams();
  const inputCount = 4;
  const router = useRouter();
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
  const [template, setTemplate] = useState<ContractTemplateType | null>(null);
  const [contractTitle, setContractTitle] = useState("");
  const [contractContent, setContractContent] = useState("");
  const [signeeEmail, setSigneeEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("draft");
  const { userData, setUserData } = useUserContextData();
  const [errors, setErrors] = useState({
    contractTitle: "",
    signeeEmail: "",
    contractContent: "",
    status: "",
    pin: "",
  });

  const CurrentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  type ContractTemplateType = {
    id: string;
    title: string;
  };

  const getTemplateContent = (
    template: ContractTemplateType,
    user: any,
    currentDate: string = new Date().toLocaleDateString()
  ): string => {
    if (!user.firstName || !user.lastName) {
      return "Error: Missing user email.";
    }

    const templateContent = {
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
    if (!status) newErrors.status = "Please select a status.";

    if (pin.length != 4) newErrors.pin = "Pin must be 4 digits";
    if (!pin) newErrors.pin = "Please enter transaction pin";

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSend = async () => {


    if (!validateInputs()) {
      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        text: "Please correct the errors before sending the contract.",
      });
      return;
    }

    const paid = await handleDeduct();

    if (!paid) {
      setLoading(false);
      return;
    }

    Swal.fire({
      title: "Sending contract...",
      text: "Please wait while we send your contract for signature.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      setLoading(true);
      const res = await fetch("/api/send-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signeeEmail,
          contractText: contractContent,
          initiatorEmail: userData?.email,
          contractTitle,
          status,
        }),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Contract sent for signature successfully!",
        });

        setLoading(false);
        window.location.reload();
      } else {
        const errorData = await res.json();
        await handleRefund();
        Swal.fire({
          icon: "error",
          title: "Failed to send",
          text: errorData.message || "Unknown error",
        });
      }
    } catch (err) {
      console.error(err);
      await handleRefund();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while sending the contract.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeduct = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      Swal.fire({
        title: "Confirm Deduction",
        text: "₦1,000 will be deducted from your wallet for generating this Contract.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, proceed",
      }).then(async (result) => {
        if (!result.isConfirmed) {
          return resolve(false);
        }

        try {
          const res = await fetch("/api/pay-app-service", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userData?.id,
              pin,
              amount: 1000,
              description: "Contract successfully generated",
            }),
          });

          const result = await res.json();

          if (!res.ok) {
            await Swal.fire(
              "Error",
              result.error || "Something went wrong",
              "error"
            );
            return resolve(false);
          }

          if (result.newWalletBalance !== undefined) {
            setUserData((prev: any) => {
              const updated = { ...prev, walletBalance: result.result };
              localStorage.setItem("userData", JSON.stringify(updated));
              return updated;
            });
          }

          resolve(true);
        } catch (err: any) {
          await Swal.fire("Error", err.message, "error");
          resolve(false);
        }
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
          amount: 2000,
          description: "Refund for failed contract generation",
        }),
      });
      Swal.fire({
        icon: "info",
        title: "Refund Processed",
        text: "₦1,000 has been refunded to your wallet due to failed contract sending.",
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
            onConfirm={() => {
              handleSend();
            }}
          />
          <div className="border-b bg-card">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      Contract Editor
                    </h1>
                    <p className="text-muted-foreground">
                      Based on: <strong>{template?.title}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* <Button variant="outline" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button> */}

                  <Button
                    disabled={loading}
                    className={`md:flex items-center text-white transition hidden  ${
                      loading
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-[#C29307] hover:bg-[#b28a06]"
                    }`}
                    onClick={handleSend}
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

                    {/* <div className="border-t pt-4">
                      <Label htmlFor="pin">Transaction Pin</Label>

                      <Input
                        id="pin"
                        type="password"
                        inputMode="numeric"
                        pattern="\d*"
                        placeholder="Enter Pin here.."
                        value={pin}
                        maxLength={4}
                        onChange={(e) => setPin(e.target.value)}
                        className={` ${errors.pin ? "border-red-500" : ""}`}
                      />
                    </div>

                    {errors.pin && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{errors.pin}</span>
                      </div>
                    )} */}
                  </CardContent>
                </Card>
              </div>

              {/* Contract Content */}
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
                  </CardContent>
                </Card>
              </div>

              <Button
                disabled={loading}
                className={`flex items-center text-white transition md:hidden ${
                  loading
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-[#C29307] hover:bg-[#b28a06]"
                }`}
                onClick={() => {
                  if (validateInputs()) {
                    setIsOpen(true);
                  }
                }}
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
  );
};

export default Page;
