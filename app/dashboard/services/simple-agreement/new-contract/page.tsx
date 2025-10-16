"use client";
import { useState } from "react";
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
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DashboardHeader from "@/app/components/dashboard-hearder";
import { useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import PinPopOver from "@/app/components/PinPopOver";

const Page = () => {
  const inputCount = 4;
  const [contractTitle, setContractTitle] = useState("Untitled Contract");
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
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
  const { userData, setUserData } = useUserContextData();

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
    if (pin.length != 4) newErrors.pin = "Pin must be 4 digits";

    if (!pin) newErrors.pin = "Please enter transaction pin";
    setErrors(newErrors);

    // Return true if there are no errors, otherwise return false
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSave = () => {
    console.log({
      title: contractTitle,
      content: contractContent,
      message: "Contract saved as draft.",
    });
  };

  // const handleDownload = () => {
  //   console.log({
  //     title: contractTitle,
  //     message: "Downloading contract as PDF...",
  //   });
  // };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        text: "Please correct the errors before sending the contract.",
      });
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

      const result = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Contract sent for signature successfully!",
        });

        // if (result.newWalletBalance !== undefined) {
        //   setUserData((prev: any) => {
        //     const updated = { ...prev, walletBalance: result.result };
        //     localStorage.setItem("userData", JSON.stringify(updated));
        //     return updated;
        //   });
        // }

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
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      await handleRefund();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while sending the contract.",
      });
      setLoading(false);
    }
  };

  const handleDeduct = async (): Promise<boolean> => {
    setLoading(true);
    return new Promise((resolve) => {
      Swal.fire({
        title: "Confirm Deduction",
        text: "₦100 will be deducted from your wallet for generating this Contract.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, proceed",
      }).then((result) => {
        if (!result.isConfirmed) {
          setLoading(false);
          return resolve(false);
        }

        // ✅ Wait until PIN is entered
        const checkPinInterval = setInterval(() => {
          if (pin.join("").length === 4) {
            clearInterval(checkPinInterval);

            fetch("/api/pay-app-service", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: userData?.id,
                pin,
                amount: 100,
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
                  setLoading(false);
                  resolve(false);
                } else {
                  resolve(true);
                }
              })
              .catch((err) => {
                setLoading(false);
                Swal.fire("Error", err.message, "error");
                resolve(false);
              });
          }
        }, 300);
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
          amount: 100,
          description: "Refund for failed contract generation",
        }),
      });
      Swal.fire({
        icon: "info",
        title: "Refund Processed",
        text: "₦100 has been refunded to your wallet due to failed contract sending.",
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
            onConfirm={async () => {
              const paid = await handleDeduct();
              if (paid) {
                await handleSubmit();
              }
            }}
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
                  {/* <Button variant="outline" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button> */}
                  {/* <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button> */}

                  <Button
                    disabled={loading}
                    className={`md:flex items-center text-white transition hidden  ${
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
                    {/* 
                    <div className="border-t pt-4">
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
