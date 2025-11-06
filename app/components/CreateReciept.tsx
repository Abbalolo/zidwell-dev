"use client";

import React, { useEffect, useState } from "react";
import { TabsContent } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useUserContextData } from "../context/userData";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Label } from "./ui/label";
import ReceiptPreview from "./previews/RecieptPreview";
import { Plus } from "lucide-react";
import PinPopOver from "./PinPopOver";
import ReceiptSummary from "./ReceiptSummary"; 

interface ReceiptItem {
  item: string;
  quantity: string | number;
  price: string | number;
}

interface ReceiptForm {
  name: string;
  email: string;
  receiptId: string;
  bill_to: string;
  from: string;
  issue_date: string;
  customer_note: string;
  payment_for: string;
  receipt_items: ReceiptItem[];
}

function CreateReceipt() {
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();
  const inputCount = 4;
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showReceiptSummary, setShowReceiptSummary] = useState(false); // New state for summary
  const [form, setForm] = useState<ReceiptForm>({
    name: "",
    email: "",
    receiptId: "",
    bill_to: "",
    from: "",
    issue_date: "",
    customer_note: "",
    payment_for: "",
    receipt_items: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const generateReceiptId = () => {
    const datePart = new Date().getFullYear();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `REP-${datePart}-${randomPart}`;
  };

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (userData) {
      setForm((prev) => ({
        ...prev,
        receiptId: generateReceiptId(),
        issue_date: today,
        from:
          userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData.email || "",
      }));
    }
  }, [userData]);

  // Calculate total amount
  const calculateTotal = () => {
    return form.receipt_items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return total + (quantity * price);
    }, 0);
  };

  const updateReceiptItem = (
    index: number,
    field: keyof ReceiptItem,
    value: string | number
  ) => {
    const items: any = [...form.receipt_items];
    items[index][field] = field === "item" ? String(value) : Number(value);
    setForm((prev) => ({ ...prev, receipt_items: items }));
  };

  const addReceiptItem = () => {
    setForm((prev) => ({
      ...prev,
      receipt_items: [
        ...prev.receipt_items,
        { item: "", quantity: "", price: "" },
      ],
    }));
  };

  const removeReceiptItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      receipt_items: prev.receipt_items.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = "Customer name is required.";
    if (!form.email.trim()) {
      newErrors.email = "Customer email is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format.";
    }

    if (form.email.trim() === userData?.email) {
      newErrors.email = "Customer email cannot be initiator email.";
    }
    if (!form.receiptId.trim())
      newErrors.receiptId = "Receipt number is required.";
    if (!form.from.trim()) newErrors.from = "From field is required.";
    if (!form.bill_to.trim()) newErrors.bill_to = "Bill To is required.";
    if (!form.issue_date.trim())
      newErrors.issue_date = "Receipt date is required.";
    if (!form.customer_note.trim())
      newErrors.customer_note = "Customer note is required";
    if (!form.payment_for.trim())
      newErrors.payment_for = "Payment description is required.";

    // Validate receipt items
    if (form.receipt_items.length === 0) {
      newErrors.receipt_items = "At least one receipt item is required.";
    } else {
      form.receipt_items.forEach((item, index) => {
        if (!item.item.trim()) {
          newErrors[`item_${index}`] = `Item ${index + 1} description is required.`;
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          newErrors[`quantity_${index}`] = `Item ${index + 1} quantity must be greater than 0.`;
        }
        if (!item.price || Number(item.price) <= 0) {
          newErrors[`price_${index}`] = `Item ${index + 1} price must be greater than 0.`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveReceipt = async () => {
    try {
      if (!userData?.email) {
        return Swal.fire({
          icon: "warning",
          title: "Unauthorized",
          text: "You must be logged in to send a receipt.",
        });
      }

      const payload = {
        data: form,
        userId: userData?.id,
        pin,
        initiatorName: userData
          ? `${userData.firstName} ${userData.lastName}`
          : "",
        initiatorEmail: userData?.email || "",
        receiptId: form.receiptId || generateReceiptId(),
      };

      const res = await fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        result.message;
        Swal.fire({
          icon: "error",
          title: "Failed to Send Receipt",
          text: result.message || "An unexpected error occurred.",
        });
        await handleRefund();
        return false;
      }

      Swal.fire({
        icon: "success",
        title: "Receipt Saved!",
        text: "Your receipt was successfully saved.",
        confirmButtonColor: "#3085d6",
      }).then(() => {
        router.refresh();
      });
      return true;
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Send Receipt",
        text: (err as Error)?.message || "An unexpected error occurred.",
      });
      await handleRefund();
      return false;
    }
  };

  const handleSubmit = async () => {
    // ✅ Save receipt after successful payment
    const success = await handleSaveReceipt();

    if (success) {
      // ✅ Reset states after success
      setPin(Array(inputCount).fill(""));
      setForm({
        name: "",
        email: "",
        receiptId: generateReceiptId(),
        bill_to: "",
        from: "",
        issue_date: today,
        customer_note: "",
        payment_for: "",
        receipt_items: [],
      });
    }

    setLoading(false);
    setIsOpen(false);
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
          amount: 100,
          description: "Receipt successfully generated",
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
          amount: 100,
          description: "Refund for failed receipt generation",
        }),
      });
      Swal.fire({
        icon: "info",
        title: "Refund Processed",
        text: "₦100 has been refunded to your wallet due to failed receipt sending.",
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

  // Function to process payment and submit receipt
  const processPaymentAndSubmit = async () => {
    setLoading(true);
    
    try {
      // First process payment
      const paymentSuccess = await handleDeduct();
      
      if (paymentSuccess) {
        // If payment successful, send receipt
        await handleSubmit();
      }
    } catch (error) {
      console.error("Error in process:", error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  // Function to show receipt summary first
  const handleGenerateReceipt = () => {
    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        text: "Please correct the errors before generating the receipt.",
      });
      return;
    }

    // Show receipt summary first
    setShowReceiptSummary(true);
  };

  // Function to proceed to PIN after summary confirmation
  const handleSummaryConfirm = () => {
    setShowReceiptSummary(false);
    setIsOpen(true); // Show PIN popup next
  };

  return (
    <>
      <PinPopOver
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        pin={pin}
        setPin={setPin}
        inputCount={inputCount}
        onConfirm={processPaymentAndSubmit}
      />

      {/* Receipt Summary Modal */}
      <ReceiptSummary
        receiptData={form}
        totalAmount={calculateTotal()}
        initiatorName={`${userData?.firstName || ''} ${userData?.lastName || ''}`}
        initiatorEmail={userData?.email || ''}
        amount={100}
        confirmReceipt={showReceiptSummary}
        onBack={() => setShowReceiptSummary(false)}
        onConfirm={handleSummaryConfirm}
      />

      <TabsContent value="create" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Receipt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div>
                <Label>Customer Name</Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Customer name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>

              {/* Customer Email */}
              <div>
                <Label>Customer Email</Label>
                <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Customer email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Receipt Number */}
              <div>
                <Label>Receipt Number</Label>
                <Input
                  name="receiptId"
                  value={form.receiptId}
                  onChange={handleChange}
                />
                {errors.receiptId && (
                  <p className="text-red-500 text-sm">{errors.receiptId}</p>
                )}
              </div>

              {/* From */}
              <div>
                <Label>From</Label>
                <Input name="from" value={form.from} onChange={handleChange} />
                {errors.from && (
                  <p className="text-red-500 text-sm">{errors.from}</p>
                )}
              </div>

              {/* Bill To */}
              <div>
                <Label>Bill To</Label>
                <Input
                  name="bill_to"
                  value={form.bill_to}
                  onChange={handleChange}
                  placeholder="Customer business or email"
                />
                {errors.bill_to && (
                  <p className="text-red-500 text-sm">{errors.bill_to}</p>
                )}
              </div>

              {/* Receipt Date */}
              <div>
                <Label>Receipt Date</Label>
                <Input
                  type="date"
                  name="issue_date"
                  value={form.issue_date}
                  onChange={handleChange}
                />
                {errors.issue_date && (
                  <p className="text-red-500 text-sm">{errors.issue_date}</p>
                )}
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">
                Receipt Items
              </Label>
              <div className="space-y-3">
                {form.receipt_items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <Input
                        placeholder="Description"
                        value={item.item}
                        onChange={(e) =>
                          updateReceiptItem(index, "item", e.target.value)
                        }
                      />
                      {errors[`item_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`item_${index}`]}
                        </p>
                      )}
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          updateReceiptItem(
                            index,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                      />
                      {errors[`quantity_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`quantity_${index}`]}
                        </p>
                      )}
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={item.price}
                        onChange={(e) =>
                          updateReceiptItem(
                            index,
                            "price",
                            Number(e.target.value)
                          )
                        }
                      />
                      {errors[`price_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`price_${index}`]}
                        </p>
                      )}
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Input
                        placeholder="Amount"
                        value={Number(item.quantity) * Number(item.price)}
                        disabled
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeReceiptItem(index)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                {errors.receipt_items && (
                  <p className="text-red-500 text-sm">{errors.receipt_items}</p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReceiptItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Payment For */}
            <div>
              <Label>Payment For</Label>
              <Input
                name="payment_for"
                value={form.payment_for}
                onChange={handleChange}
                placeholder="payment description"
              />
              {errors.payment_for && (
                <p className="text-red-500 text-sm">{errors.payment_for}</p>
              )}
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">
                Customer Note
              </Label>
              <textarea
                name="customer_note"
                value={form.customer_note}
                onChange={handleChange}
                className="w-full p-3 border rounded-md h-24"
                placeholder="Additional notes..."
              />

              {errors.customer_note && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.customer_note}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGenerateReceipt}
                disabled={loading}
                className="bg-[#C29307] hover:bg-[#C29307] hover:shadow-xl transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  "Generate Receipt"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(true)}
              >
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {showPreview && (
          <ReceiptPreview form={form} onClose={() => setShowPreview(false)} />
        )}
      </TabsContent>
    </>
  );
}

export default CreateReceipt;