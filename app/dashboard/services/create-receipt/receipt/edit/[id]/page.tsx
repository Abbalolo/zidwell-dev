"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import Swal from "sweetalert2";
import Loader from "@/app/components/Loader";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DashboardHeader from "@/app/components/dashboard-hearder"; 

interface ReceiptItem {
  item: string;
  quantity: number;
  price: number;
}

interface ReceiptForm {
  signee_name: string;
  signee_email: string;
  receipt_id: string;
  bill_to: string;
  from: string;
  issue_date: string;
  due_date: string;
  receipt_items: ReceiptItem[];
  customer_note: string;
  message: string;
  payment_for: string;
  initiator_name: string;
}

export default function Page() {
  const { id } = useParams();
  const [form, setForm] = useState<ReceiptForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchReceipt = async () => {
      const res = await fetch(`/api/receipt/${id}`);
      const data = await res.json();
      setForm(data);
    };

    if (id) fetchReceipt();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!form) return;

    const { name, value } = e.target;

    // Map input names to form keys if needed
    const keyMap: { [key: string]: keyof ReceiptForm } = {
      signee_name: "signee_name",
      signee_email: "signee_email",
      receipt_id: "receipt_id",
      bill_to: "bill_to",
      from: "from",
      issue_date: "issue_date",
      due_date: "due_date",
      customer_note: "customer_note",
      message: "message",
      payment_for: "payment_for",
    };

    const formKey = keyMap[name];

    if (!formKey) return;

    setForm({ ...form, [formKey]: value });

    // Clear error for field on change
    setErrors((prev) => ({ ...prev, [formKey]: "" }));
  };

  const updateItem = (index: number, key: keyof ReceiptItem, value: any) => {
    if (!form) return;
    const updatedItems = [...form.receipt_items];
    updatedItems[index] = { ...updatedItems[index], [key]: value };
    setForm({ ...form, receipt_items: updatedItems });
  };

  const validate = () => {
    if (!form) return false;

    const newErrors: { [key: string]: string } = {};

    if (!form.signee_name.trim()) newErrors.signee_name = "Name is required";
    if (!form.signee_email.trim()) {
      newErrors.signee_email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.signee_email)
    ) {
      newErrors.signee_email = "Invalid email address";
    }

    if (!form.payment_for.trim())
      newErrors.payment_for = "Payment description is required";

    if (!form.bill_to.trim()) newErrors.bill_to = "Bill To is required";
    if (!form.customer_note.trim()) newErrors.bill_to = "Customer note is required";

 

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!form) return;

    if (!validate()) {
      return Swal.fire(
        "Validation Error",
        "Please fix the errors in the form",
        "error"
      );
    }

    setLoading(true);
    const res = await fetch(`/api/receipt/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      return Swal.fire("Error", result.message || "Failed to update", "error");
    }

    Swal.fire("Success", result.message || "Receipt updated successfully", "success");
  };

  if (!form)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );


    console.log(form)

  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl text-center font-bold text-gray-900 mb-2">
                Edit Receipt
              </h1>
            </div>

            <div className="p-4 space-y-4">
              <Input
                name="signee_name"
                value={form.signee_name}
                onChange={handleChange}
                placeholder="Client Name"
              />
              {errors.signee_name && (
                <p className="text-red-500 text-sm">{errors.signee_name}</p>
              )}

              <Input
                name="signee_email"
                value={form.signee_email}
                onChange={handleChange}
                placeholder="Client Email"
              />
              {errors.signee_email && (
                <p className="text-red-500 text-sm">{errors.signee_email}</p>
              )}

              <Input
                name="receipt_id"
                value={form.receipt_id}
                disabled
                placeholder="Receipt ID"
              />

              <Input
                name="from"
                value={form.initiator_name}
                disabled
                placeholder="From"
              />

              <Input
                name="bill_to"
                value={form.bill_to}
                onChange={handleChange}
                placeholder="Bill To"
              />
              {errors.bill_to && (
                <p className="text-red-500 text-sm">{errors.bill_to}</p>
              )}

              <Input
                name="issue_date"
                type="date"
                value={form.issue_date}
                onChange={handleChange}
              />

            

              <div className="space-y-2">
                {form.receipt_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
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
                        updateItem(index, "quantity", Number(e.target.value))
                      }
                      placeholder="Qty"
                    />
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, "price", Number(e.target.value))
                      }
                      placeholder="Price"
                    />
                  </div>
                ))}
              </div>

              <Input
                name="payment_for"
                value={form.payment_for}
                onChange={handleChange}
                placeholder="Payment Description"
              />
              {errors.payment_for && (
                <p className="text-red-500 text-sm">{errors.payment_for}</p>
              )}

              <textarea
                name="customer_note"
                value={form.customer_note}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Customer Note"
              />

              <Button
                className="bg-[#C29307]"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Receipt"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
