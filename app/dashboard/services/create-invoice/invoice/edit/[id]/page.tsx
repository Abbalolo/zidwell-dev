"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import Swal from "sweetalert2";
import Loader from "@/app/components/Loader";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DashboardHeader from "@/app/components/dashboard-hearder";

interface InvoiceItem {
  item: string;
  quantity: number;
  price: number;
}

interface InvoiceForm {
  signee_name: string;
  signee_email: string;
  invoice_id: string;
  bill_to: string;
  initiator_name: string;
  issue_date: string;
  due_date: string;
  invoice_items: InvoiceItem[];
  customer_note: string;
  message: string;
}

type Errors = Partial<Record<keyof InvoiceForm, string>>;

export default function Page() {
  const { id } = useParams();
  const [form, setForm] = useState<InvoiceForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const firstErrorRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoice/${id}`);
        if (!res.ok) {
          Swal.fire("Error", "Failed to fetch invoice", "error");
          return;
        }
        const data = await res.json();
        setForm({
          ...data,
          invoice_items: data.invoice_items || [],
        });
      } catch (error) {
        console.error("Fetch error:", error);
        Swal.fire("Error", "Failed to fetch invoice", "error");
      }
    };

    if (id) fetchInvoice();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!form) return;
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const updateItem = (index: number, key: keyof InvoiceItem, value: any) => {
    if (!form) return;
    const updatedItems = [...form.invoice_items];
    updatedItems[index] = { ...updatedItems[index], [key]: value };
    setForm({ ...form, invoice_items: updatedItems });
  };
  const validateForm = () => {
    if (!form) return false;

    const newErrors: Errors = {};

    if (!(form.signee_name || "").trim())
      newErrors.signee_name = "Client name is required.";
    if (!(form.signee_email || "").trim())
      newErrors.signee_email = "Client email is required.";
    if (!(form.bill_to || "").trim())
      newErrors.bill_to = "Bill to is required.";
    if (!form.issue_date) newErrors.issue_date = "Issue date is required.";
    if (!form.due_date) newErrors.due_date = "Due date is required.";
    if (!(form.message || "").trim())
      newErrors.message = "Message is required.";
    if (!(form.customer_note || "").trim())
      newErrors.customer_note = "Customer note is required.";

    // Validate invoice items
    const hasIncompleteItem = form.invoice_items.some(
      (item) => !(item.item || "").trim() || !item.quantity || !item.price
    );

    if (hasIncompleteItem) {
      newErrors.invoice_items = "All invoice items must be completed.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!form) return;

    const isValid = validateForm();
    if (!isValid) {
      // Scroll to first error input
      setTimeout(
        () => firstErrorRef.current?.scrollIntoView({ behavior: "smooth" }),
        0
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/invoice/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok) {
        return Swal.fire(
          "Error",
          result.message || "Failed to update invoice",
          "error"
        );
      }

      Swal.fire(
        "Success",
        result.message || "Invoice updated successfully",
        "success"
      );
    } catch (error) {
      setLoading(false);
      Swal.fire("Error", "Failed to update invoice", "error");
    }
  };

  if (!form)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );

  const inputClass = "mb-1";

  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <DashboardSidebar />
      <div className="lg:ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl text-center font-bold mb-6">
              Edit Invoice
            </h1>

            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="signee_name" className="block font-medium mb-1">
                  Client Name
                </label>
                <Input
                  id="signee_name"
                  name="signee_name"
                  value={form.signee_name}
                  onChange={handleChange}
                  ref={errors.signee_name ? firstErrorRef : undefined}
                />
                {errors.signee_name && (
                  <p className="text-red-600 text-sm">{errors.signee_name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signee_email"
                  className="block font-medium mb-1"
                >
                  Client Email
                </label>
                <Input
                  id="signee_email"
                  name="signee_email"
                  value={form.signee_email}
                  onChange={handleChange}
                  ref={errors.signee_email ? firstErrorRef : undefined}
                />
                {errors.signee_email && (
                  <p className="text-red-600 text-sm">{errors.signee_email}</p>
                )}
              </div>

              <div>
                <label htmlFor="invoice_id" className="block font-medium mb-1">
                  Invoice ID
                </label>
                <Input
                  id="invoice_id"
                  name="invoice_id"
                  value={form.invoice_id}
                  disabled
                />
              </div>

              <div>
                <label
                  htmlFor="initiator_name"
                  className="block font-medium mb-1"
                >
                  From
                </label>
                <Input
                  id="initiator_name"
                  name="initiator_name"
                  value={form.initiator_name}
                  disabled
                />
              </div>

              <div>
                <label htmlFor="bill_to" className="block font-medium mb-1">
                  Bill To
                </label>
                <Input
                  id="bill_to"
                  name="bill_to"
                  value={form.bill_to}
                  onChange={handleChange}
                  ref={errors.bill_to ? firstErrorRef : undefined}
                />
                {errors.bill_to && (
                  <p className="text-red-600 text-sm">{errors.bill_to}</p>
                )}
              </div>

              <div>
                <label htmlFor="issue_date" className="block font-medium mb-1">
                  Issue Date
                </label>
                <Input
                  id="issue_date"
                  name="issue_date"
                  type="date"
                  value={form.issue_date}
                  onChange={handleChange}
                  ref={errors.issue_date ? firstErrorRef : undefined}
                />
                {errors.issue_date && (
                  <p className="text-red-600 text-sm">{errors.issue_date}</p>
                )}
              </div>

              <div>
                <label htmlFor="due_date" className="block font-medium mb-1">
                  Due Date
                </label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={handleChange}
                  ref={errors.due_date ? firstErrorRef : undefined}
                />
                {errors.due_date && (
                  <p className="text-red-600 text-sm">{errors.due_date}</p>
                )}
              </div>

              <div>
                <p className="font-medium mb-1">Invoice Items</p>
                {form.invoice_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                    <Input
                      value={item.item}
                      onChange={(e) =>
                        updateItem(index, "item", e.target.value)
                      }
                      placeholder="Item"
                    />
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", +e.target.value)
                      }
                      placeholder="Qty"
                    />
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, "price", +e.target.value)
                      }
                      placeholder="Price"
                    />
                  </div>
                ))}
                {errors.invoice_items && (
                  <p className="text-red-600 text-sm">{errors.invoice_items}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block font-medium mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Message"
                />
                {errors.message && (
                  <p className="text-red-600 text-sm">{errors.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="customer_note"
                  className="block font-medium mb-1"
                >
                  Customer Note
                </label>
                <textarea
                  id="customer_note"
                  name="customer_note"
                  value={form.customer_note}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Customer Note"
                />
                {errors.customer_note && (
                  <p className="text-red-600 text-sm">{errors.customer_note}</p>
                )}
              </div>

              <Button
                className="bg-[#C29307]"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Invoice"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
