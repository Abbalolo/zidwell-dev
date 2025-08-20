"use client";

import React, { useEffect, useState } from "react";
import { TabsContent } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ArrowRight, Plus, Router } from "lucide-react";
import InvoicePreview from "./previews/InvoicePreview";
import { useUserContextData } from "../context/userData";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Label } from "./ui/label";

interface InvoiceItem {
  item: string;
  quantity: number;
  price: number;
}

interface InvoiceForm {
  name: string;
  email: string;
  message: string;
  invoice_id: string;
  bill_to: string;
  from: string;
  issue_date: string;
  due_date: string;
  delivery_due: string;
  delivery_issue: string;
  delivery_time: string;
  customer_note: string;
  // account_number: string;
  // account_name: string;
  // account_to_pay_name: string;
  invoice_items: InvoiceItem[];
}

const generateInvoiceId = () => {
  const datePart = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${randomPart}`;
};

function CreateInvoice() {
  const router = useRouter();
  const [form, setForm] = useState<InvoiceForm>({
    name: "",
    email: "",
    message: "",
    invoice_id: "",
    bill_to: "",
    from: "",
    issue_date: "",
    due_date: "",
    delivery_due: "",
    delivery_issue: "",
    delivery_time: "",
    customer_note: "",
    // account_number: "",
    // account_name: "",
    // account_to_pay_name: "",
    invoice_items: [],
  });

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { userData } = useUserContextData();

  const saveDraftToLocalStorage = () => {
    try {
      const draft = {
        ...form,
        status: "draft",
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem("invoiceDraft", JSON.stringify(draft));
      Swal.fire({
        icon: "success",
        title: "Draft saved!",
        text: "Your Draft was successfully saved.",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error("Failed to save draft:", err);

      Swal.fire({
        icon: "error",
        title: "Failed to save draft",
        text: (err as Error)?.message || "An unexpected error occurred.",
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateInvoiceItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const items: any = [...form.invoice_items];
    items[index][field] = field === "item" ? String(value) : Number(value);
    setForm((prev) => ({ ...prev, invoice_items: items }));
  };

  const addInvoiceItem = () => {
    setForm((prev) => ({
      ...prev,
      invoice_items: [
        ...prev.invoice_items,
        { item: "", quantity: 1, price: 0 },
      ],
    }));
  };

  const removeInvoiceItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      invoice_items: prev.invoice_items.filter((_, i) => i !== index),
    }));
  };

  const today = new Date().toISOString().slice(0, 10);

  const getDueDate = (days = 14) => {
    const due = new Date();
    due.setDate(due.getDate() + days);
    return due.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (userData) {
      setForm((prev) => ({
        ...prev,
        invoice_id: generateInvoiceId(),
        issue_date: today,
        due_date: getDueDate(14),
        from:
          userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData.email || "",
      }));
    }
  }, [userData]);

  const handleSaveInvoice = async () => {
    try {
      if (!userData?.email) {
        return Swal.fire({
          icon: "warning",
          title: "Unauthorized",
          text: "You must be logged in to send an invoice.",
        });
      }

      const payload = {
        data: form,
        initiatorName: userData
          ? `${userData.firstName} ${userData.lastName}`
          : "",
        initiatorEmail: userData?.email || "",
        invoiceId: form?.invoice_id || generateInvoiceId(),
      };

      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      Swal.fire({
        icon: "success",
        title: "Invoice Save!",
        text: "Your invoice was successfully saved.",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error(err);
      await handleRefund()
      Swal.fire({
        icon: "error",
        title: "Failed to Send Invoice",
        text: (err as Error)?.message || "An unexpected error occurred.",
      });
    }
  };

  const validateInvoiceForm = (form: InvoiceForm) => {
    const errors: string[] = [];

    if (!form.name.trim()) errors.push("Client name is required.");
    if (!form.email.trim()) {
      errors.push("Client email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.push("Invalid email format.");
    }
    if (!form.invoice_id.trim()) errors.push("Invoice number is required.");
    if (!form.from.trim()) errors.push("From field is required.");
    if (!form.bill_to.trim()) errors.push("Bill To field is required.");
    if (!form.issue_date) errors.push("Invoice date is required.");
    if (!form.due_date) errors.push("Due date is required.");
    if (form.issue_date && form.due_date && form.due_date < form.issue_date) {
      errors.push("Due date cannot be before issue date.");
    }

    // invoice items
    if (form.invoice_items.length === 0) {
      errors.push("At least one invoice item is required.");
    } else {
      form.invoice_items.forEach((item, index) => {
        if (!item.item.trim())
          errors.push(`Item ${index + 1}: description required.`);
        if (item.quantity <= 0)
          errors.push(`Item ${index + 1}: quantity must be greater than 0.`);
        if (item.price <= 0)
          errors.push(`Item ${index + 1}: price must be greater than 0.`);
      });
    }

    // bank details
    // if (!form.account_number.trim())
    //   errors.push("Bank account number is required.");
    // if (!form.account_to_pay_name.trim())
    //   errors.push("Account to pay name is required.");
    // if (!form.account_name.trim()) errors.push("Bank name is required.");

    return errors;
  };



const handleSubmit = async (e?: React.FormEvent) => {
  if (e) e.preventDefault(); 

  const errors = validateInvoiceForm(form);

  if (errors.length > 0) {
    Swal.fire({
      title: "Validation Errors",
      html: errors.join("<br/>"),
      icon: "error",
    });
    return;
  }

  setLoading(true);

  try {
    const paid = await handleDeduct();

    if (!paid) {
      setLoading(false); 
      return;
    }

    await handleSaveInvoice();
    await Swal.fire("Success", "Invoice created successfully!", "success");

// setForm({
    //   name: "",
    //   email: "",
    //   message: "",
    //   invoice_id: "",
    //   bill_to: "",
    //   from: "",
    //   issue_date: "",
    //   due_date: "",
    //   delivery_due: "",
    //   delivery_issue: "",
    //   delivery_time: "",
    //   customer_note: "",
    //   account_number: "",
    //   account_name: "",
    //   account_to_pay_name: "",
    //   invoice_items: [],
    // });

    
    window.location.reload();
  } catch (err) {
     await handleRefund()
     console.log(err)
      Swal.fire({
             icon: "error",
             title: "Error",
             text: "An error occurred while sending the invoice.",
           });
    }
  
  finally {
    setLoading(false);
  }
};

const handleDeduct = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    Swal.fire({
      title: "Confirm Deduction",
      text: "₦200 will be deducted from your wallet for generating this invoice.",
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
            amount: 200,
            description: "Invoice successfully generated",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          await Swal.fire("Error", data.error || "Something went wrong", "error");
          return resolve(false);
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
    <TabsContent value="create" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <Label className="block text-sm font-medium mb-2">
                Client Name
              </Label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter client name"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">
                Client Email
              </Label>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">
                Invoice Number
              </Label>
              <Input
                name="invoiceId"
                value={generateInvoiceId()}
                onChange={handleChange}
                placeholder="INV-2024-001"
                disabled
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">From</Label>
              <Input
                name="from"
                value={form.from}
                onChange={handleChange}
                placeholder="Your business name or email"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">Bill To</Label>
              <Input
                name="bill_to"
                value={form.bill_to}
                onChange={handleChange}
                placeholder="Customer business or email"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">
                Invoice Date
              </Label>
              <Input
                type="date"
                name="issue_date"
                value={form.issue_date}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">Due Date</Label>
              <Input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">
                Delivery Issue Date
              </Label>
              <Input
                type="date"
                name="delivery_issue"
                value={form.delivery_issue}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">
                Delivery Due Date
              </Label>
              <Input
                type="date"
                name="delivery_due"
                value={form.delivery_due}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">
                Delivery Time
              </Label>
              <Input
                name="delivery_time"
                value={form.delivery_time}
                onChange={handleChange}
                placeholder="e.g. 3 Days"
              />
            </div>
          </div>

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
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.item}
                      onChange={(e) =>
                        updateInvoiceItem(index, "item", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
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
                    />
                  </div>
                  <div className="col-span-2">
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
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Amount"
                      value={item.quantity * item.price}
                      disabled
                    />
                  </div>
                  <div className="col-span-1">
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
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">Message</Label>
            <Input
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Short message or greeting..."
            />
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
          </div>

          {/* <div className="flex md:flex-row flex-col gap-4">
            <div className="flex-1">
              <Label className="block text-sm font-medium mb-2">
                Bank Account Number
              </Label>
              <Input
                name="account_number"
                value={form.account_number}
                onChange={handleChange}
                placeholder="2257555555"
              />
            </div>

            <div className="flex-1">
              <Label className="block text-sm font-medium mb-2">
                Account to Pay Name
              </Label>
              <Input
                name="account_to_pay_name"
                value={form.account_to_pay_name}
                onChange={handleChange}
                placeholder="josh emmanuel"
              />
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">
              Bank Account Name
            </Label>
            <Input
              name="account_name"
              value={form.account_name}
              onChange={handleChange}
              placeholder="GTB,UBA etc.."
            />
          </div> */}

          <div className="flex flex-col md:flex-row gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!form}
              className="bg-[#C29307] hover:bg-[#C29307]hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">Generate Invoice</div>
              )}
            </Button>

            {/* <Button type="button" onClick={handleSubmit}>Create & Send Invoice</Button> */}
            <Button
              type="button"
              className=" hover:bg-[#C29307] hover:text-white border hover:shadow-xl transition-all duration-300"
              variant="outline"
              onClick={saveDraftToLocalStorage}
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
  );
}

export default CreateInvoice;
