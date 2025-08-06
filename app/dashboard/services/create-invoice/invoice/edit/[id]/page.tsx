"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  name: string;
  email: string;
  invoiceId: string;
  billTo: string;
  from: string;
  issueDate: string;
  dueDate: string;
  invoiceItems: InvoiceItem[];
  customerNote: string;
  message: string;
}

export default function page() {
  const { id } = useParams();
  const [form, setForm] = useState<InvoiceForm | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      const res = await fetch(`/api/invoice/${id}`);
      const data = await res.json();
      setForm(data);
    };

    if (id) fetchInvoice();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!form) return;
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateItem = (index: number, key: keyof InvoiceItem, value: any) => {
    if (!form) return;
    const updatedItems = [...form.invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [key]: value };
    setForm({ ...form, invoiceItems: updatedItems });
  };

  const handleUpdate = async () => {
    if (!form) return;
    setLoading(true);
    const res = await fetch(`/api/invoice/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      return Swal.fire("Error", result.message, "error");
    }

    Swal.fire("Success", result.message, "success");
  };

  if (!form) return <div className="flex justify-center items-center h-screen"><Loader /></div> ;

  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl text-center font-bold text-gray-900 mb-2">
                Edit Invoice
              </h1>
            </div>

            <div className=" p-4 space-y-4">
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Client Name"
              />
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Client Email"
              />
              <Input
                name="invoiceId"
                value={form.invoiceId}
                onChange={handleChange}
                placeholder="Invoice ID"
              />
              <Input
                name="from"
                value={form.from}
                onChange={handleChange}
                placeholder="From"
              />
              <Input
                name="billTo"
                value={form.billTo}
                onChange={handleChange}
                placeholder="Bill To"
              />
              <Input
                name="issueDate"
                type="date"
                value={form.issueDate}
                onChange={handleChange}
              />
              <Input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
              />

              <div className="space-y-2">
                {form.invoiceItems.map((item, index) => (
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
              </div>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Message"
              />

              <textarea
                name="customerNote"
                value={form.customerNote}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Customer Note"
              />

              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? "Updating..." : "Update Invoice"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
