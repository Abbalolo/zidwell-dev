"use client";

import { TabsContent } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { AlertCircle, Plus } from "lucide-react";
import InvoicePreview from "./previews/InvoicePreview";
import { useRouter } from "next/navigation";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useUserContextData } from "../context/userData";
import { Textarea } from "./ui/textarea";
import PinPopOver from "./PinPopOver";

type InvoiceItem = {
  item: string;
  quantity: string | number;
  price: string | number;
};

interface InvoiceForm {
  name: string;
  email: string;
  message: string;
  invoice_id: string;
  bill_to: string;
  from: string;
  issue_date: string;
  due_date: string;
  customer_note: string;
  invoice_items: InvoiceItem[];
  payment_type: "single" | "multiple";
  fee_option: "absorbed" | "customer";
  unit: number;
  status: "unpaid" | "paid" | "draft";
}

const generateInvoiceId = () => {
  const datePart = new Date().getFullYear();
  const randomToken = crypto
    .randomUUID()
    .replace(/-/g, "")
    .substring(0, 12)
    .toUpperCase();
  return `INV-${datePart}-${randomToken}`;
};

function CreateInvoice() {
  const inputCount = 4;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState<InvoiceForm>({
    name: "",
    email: "",
    message: "",
    invoice_id: "",
    bill_to: "",
    from: "",
    issue_date: "",
    due_date: "",
    customer_note: "",
    invoice_items: [],
    payment_type: "single",
    fee_option: "customer",
    unit: 0,
    status: "unpaid",
  });

  const { userData, setUserData } = useUserContextData();

  const updateInvoiceItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setForm((prev) => {
      const items = [...prev.invoice_items];
      items[index] = {
        ...items[index],
        [field]: field === "item" ? String(value) : Number(value),
      };
      return { ...prev, invoice_items: items };
    });
  };

  // ✅ add new item
  const addInvoiceItem = () => {
    setForm((prev) => ({
      ...prev,
      invoice_items: [
        ...prev.invoice_items,
        { item: "", quantity: "", price: "" },
      ],
    }));
  };

  // ✅ remove item
  const removeInvoiceItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      invoice_items: prev.invoice_items.filter((_, i) => i !== index),
    }));
  };

  // ✅ restore draft
  useEffect(() => {
    const storedDraft = localStorage.getItem("invoiceDraft");
    if (storedDraft) {
      const parsed: InvoiceForm = JSON.parse(storedDraft);
      setForm(parsed);
    }
  }, []);

  // ✅ initialize from userData
  useEffect(() => {
    if (userData) {
      const today = new Date().toISOString().slice(0, 10);
      const due = new Date();
      due.setDate(due.getDate() + 14);

      setForm((prev) => ({
        ...prev,
        invoice_id: generateInvoiceId(),
        issue_date: today,
        due_date: due.toISOString().slice(0, 10),
        from:
          userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData.email || "",
      }));
    }
  }, [userData]);

  const handleSaveInvoice = async () => {
    try {
      if (!userData?.id) {
        return Swal.fire({
          icon: "warning",
          title: "Unauthorized",
          text: "You must be logged in to send an invoice.",
        });
      }

      // calculate totals
      let totalAmount = form.invoice_items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.price),
        0
      );

      if (form.fee_option === "customer") {
        totalAmount += totalAmount * 0.035;
      }

      const payload = {
        userId: userData?.id,
        initiator_email: userData?.email || "",
        initiator_name: userData
          ? `${userData.firstName} ${userData.lastName}`
          : "",
        invoice_id: form.invoice_id || generateInvoiceId(),
        signee_name: form.name,
        signee_email: form.email,
        message: form.message,
        bill_to: form.bill_to,
        issue_date: form.issue_date,
        due_date: form.due_date,
        customer_note: form.customer_note,
        invoice_items: form.invoice_items,
        total_amount: totalAmount,
        payment_type: form.payment_type,
        fee_option: form.fee_option,
        unit: form.unit,
        status: form.status,
      };

      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      // if (result.newWalletBalance !== undefined) {
      //   setUserData((prev: any) => {
      //     const updated = { ...prev, walletBalance: result.result };
      //     localStorage.setItem("userData", JSON.stringify(updated));
      //     return updated;
      //   });
      // }

      Swal.fire({
        icon: "success",
        title: "Invoice Saved!",
        text: "Your invoice was successfully saved.",
        confirmButtonColor: "#3085d6",
      });

      window.location.reload();
    } catch (err) {
      console.error(err);
      await handleRefund();
      Swal.fire({
        icon: "error",
        title: "Failed to Save Invoice",
        text: (err as Error)?.message || "An unexpected error occurred.",
      });
    }
  };

  const validateInvoiceForm = () => {
    let newErrors: Record<string, string> = {};
    if (form.email.trim() === userData?.email) {
      newErrors.email = "Customer email cannot be initiator email.";
    }
    if (!form.name.trim()) newErrors.name = "Client name is required.";
    if (!form.email.trim()) {
      newErrors.email = "Client email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format.";
    }

    if (!form.from.trim()) newErrors.from = "From field is required.";
    if (!form.bill_to.trim()) newErrors.bill_to = "Bill To field is required.";
    if (!form.issue_date) newErrors.issue_date = "Invoice date is required.";
    if (!form.due_date) newErrors.due_date = "Due date is required.";
    if (form.issue_date && form.due_date && form.due_date < form.issue_date) {
      newErrors.due_date = "Due date cannot be before issue date.";
    }

    if (!form.message.trim()) newErrors.message = "message field is required.";
    if (!form.customer_note.trim())
      newErrors.customer_note = "customer_note field is required.";

    if (form.payment_type === "multiple" && (!form.unit || form.unit <= 0)) {
      newErrors.unit = "Unit must be greater than 0 for multiple payment.";
    }
    if (pin.length != 4) newErrors.pin = "Pin must be 4 digits";

    if (!pin) newErrors.pin = "Please enter transaction pin";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateInvoiceForm()) return;

    try {


      await handleSaveInvoice();
      await Swal.fire("Success", "Invoice created successfully!", "success");

      // window.location.reload();
    } catch (err) {
      await handleRefund();
      console.log(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while sending the invoice.",
      });
    } finally {
      setLoading(false);
    }
  };

   const handleDeduct = async (): Promise<boolean> => {
     setLoading(true);
     return new Promise((resolve) => {
       Swal.fire({
         title: "Confirm Deduction",
         text: "₦200 will be deducted from your wallet for generating this Invoice.",
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
                 amount: 200,
                 description: "Invoice successfully generated",
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
          amount: 200,
          description: "Refund for failed invoice generation",
        }),
      });
      Swal.fire({
        icon: "info",
        title: "Refund Processed",
        text: "₦200 has been refunded to your wallet due to failed invoice sending.",
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

  useEffect(() => {
    const storedDraft = localStorage.getItem("invoiceDraft");
    if (storedDraft) {
      const parsed = JSON.parse(storedDraft);
      setForm(parsed);
    }
  }, []);

  return (
    <>
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
      <TabsContent value="create" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Name */}
              <div>
                <Label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  Client Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter client name"
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Client Email */}
              <div>
                <Label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                >
                  Client Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="client@example.com"
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Invoice Number */}
              <div>
                <Label
                  htmlFor="invoice_id"
                  className="block text-sm font-medium mb-2"
                >
                  Invoice Number
                </Label>
                <Input
                  id="invoice_id"
                  name="invoice_id"
                  value={form.invoice_id}
                  onChange={handleChange}
                  placeholder="INV-2024-001"
                  disabled
                />
              </div>

              {/* From */}
              <div>
                <Label
                  htmlFor="from"
                  className="block text-sm font-medium mb-2"
                >
                  From
                </Label>
                <Input
                  id="from"
                  name="from"
                  value={form.from}
                  onChange={handleChange}
                  placeholder="Your business name or email"
                  required
                />
                {errors.from && (
                  <p className="text-red-500 text-xs mt-1">{errors.from}</p>
                )}
              </div>

              {/* Bill To */}
              <div>
                <Label
                  htmlFor="bill_to"
                  className="block text-sm font-medium mb-2"
                >
                  Bill To
                </Label>
                <Input
                  id="bill_to"
                  name="bill_to"
                  value={form.bill_to}
                  onChange={handleChange}
                  placeholder="Customer business or email"
                  required
                />
                {errors.bill_to && (
                  <p className="text-red-500 text-xs mt-1">{errors.bill_to}</p>
                )}
              </div>

              {/* Invoice Date */}
              <div>
                <Label
                  htmlFor="issue_date"
                  className="block text-sm font-medium mb-2"
                >
                  Invoice Date
                </Label>
                <Input
                  id="issue_date"
                  type="date"
                  name="issue_date"
                  value={form.issue_date}
                  onChange={handleChange}
                  required
                />
                {errors.issue_date && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.issue_date}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <Label
                  htmlFor="due_date"
                  className="block text-sm font-medium mb-2"
                >
                  Due Date
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                  required
                />
                {errors.due_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.due_date}</p>
                )}
              </div>

              {/* Payment Type */}
              <div>
                <Label
                  htmlFor="payment_type"
                  className="block text-sm font-medium mb-2"
                >
                  Payment Type
                </Label>
                <Select
                  value={form.payment_type}
                  onValueChange={(val: "single" | "multiple") =>
                    setForm((prev) => ({ ...prev, payment_type: val }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Buyer Invoice</SelectItem>
                    <SelectItem value="multiple">
                      Multiple Buyers Invoice
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fee Option */}
              <div>
                <Label
                  htmlFor="fee_option"
                  className="block text-sm font-medium mb-2"
                >
                  Fee Option
                </Label>
                <Select
                  value={form.fee_option}
                  onValueChange={(val: "absorbed" | "customer") =>
                    setForm((prev) => ({ ...prev, fee_option: val }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose fee option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absorbed">
                      Deduct 3.5% from my payout
                    </SelectItem>
                    <SelectItem value="customer">
                      Add 3.5% for the customer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Unit (only for multiple) */}
              {form.payment_type === "multiple" && (
                <div>
                  <Label
                    htmlFor="unit"
                    className="block text-sm font-medium mb-2"
                  >
                    Unit (total unit)
                  </Label>
                  <Input
                    id="unit"
                    type="number"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    placeholder="Total customer units"
                  />
                  {errors.unit && (
                    <p className="text-red-500 text-xs mt-1">{errors.unit}</p>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Items */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Invoice Items
              </Label>
              <div className="space-y-3">
                {form.invoice_items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    {/* Description */}
                    <div className="col-span-12 sm:col-span-5">
                      <Input
                        placeholder="Description"
                        value={item.item}
                        onChange={(e) =>
                          updateInvoiceItem(index, "item", e.target.value)
                        }
                        required
                      />
                    </div>

                    {/* Qty */}
                    <div className="col-span-6 sm:col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          updateInvoiceItem(
                            index,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                        required
                      />
                    </div>

                    {/* Rate */}
                    <div className="col-span-6 sm:col-span-2">
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={item.price}
                        onChange={(e) =>
                          updateInvoiceItem(
                            index,
                            "price",
                            Number(e.target.value)
                          )
                        }
                        required
                      />
                    </div>

                    {/* Amount */}
                    <div className="col-span-6 sm:col-span-2">
                      <Input
                        value={Number(item.quantity) * Number(item.price)}
                        disabled
                      />
                    </div>

                    {/* Remove */}
                    <div className="col-span-6 sm:col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeInvoiceItem(index)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvoiceItem}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>
            </div>

            {/* Message */}
            <div>
              <Label
                htmlFor="message"
                className="block text-sm font-medium mb-2"
              >
                Message
              </Label>
              <Input
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Short message or greeting..."
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1">{errors.message}</p>
              )}
            </div>

            {/* Customer Note */}
            <div>
              <Label
                htmlFor="customer_note"
                className="block text-sm font-medium mb-2"
              >
                Customer Note
              </Label>
              <Textarea
                id="customer_note"
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

            {/* Buttons */}
            <div className="flex flex-col md:flex-row gap-3">
              <Button
                onClick={() => {
                  if (validateInvoiceForm()) {
                    setIsOpen(true);
                  }
                }}
                disabled={loading}
                className="bg-[#C29307] hover:bg-[#C29307] hover:shadow-xl transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  "Generate Invoice"
                )}
              </Button>

              <Button
                type="button"
                className="hover:bg-[#C29307] hover:text-white border hover:shadow-xl transition-all duration-300"
                variant="outline"
                // onClick={saveDraftToLocalStorage}
              >
                Save as Draft
              </Button>

              <Button
                type="button"
                className="hover:bg-[#C29307] hover:text-white border hover:shadow-xl transition-all duration-300"
                variant="outline"
                onClick={() => setShowPreview(true)}
              >
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {showPreview && (
          <InvoicePreview form={form} onClose={() => setShowPreview(false)} />
        )}
      </TabsContent>
    </>
  );
}

export default CreateInvoice;
