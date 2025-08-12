"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import Loader from "@/app/components/Loader";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

interface Contract {
  id: string;
  contract_title: string;
  contract_text: string;
  status: string;
}

export default function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use React.use() to unwrap the Promise params (NEW in Next.js 14+)
  const unwrappedParams = React.use(params);
  const contractId = unwrappedParams.id;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchContract = async () => {
    try {
      const res = await fetch(`/api/get-contract-id?id=${contractId}`);
      const data = await res.json();
      setContract(data.contract);
    } catch (error) {
      console.error("Failed to fetch contract", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const handleSave = async () => {
    if (!contract) return;

    const res = await fetch("/api/update-contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contract),
    });

    if (res.ok) {
      router.push("/dashboard/services/simple-agreement");
    } else {
         Swal.fire("Failed to save contract");
     
    }
  };

  if (loading)
    return (
      <div className="p-4">
        <Loader />
      </div>
    );
  if (!contract) return <p className="p-4">Contract not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <h1 className="text-xl font-bold mb-4 text-center">Edit Contract</h1>

      <Input
        placeholder="Contract Title"
        value={contract.contract_title}
        onChange={(e) =>
          setContract({ ...contract, contract_title: e.target.value })
        }
        className="mb-4"
      />

      <Textarea
        placeholder="Contract Text"
        rows={20}
        value={contract.contract_text}
        onChange={(e) =>
          setContract({ ...contract, contract_text: e.target.value })
        }
        className="mb-4"
      />

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
