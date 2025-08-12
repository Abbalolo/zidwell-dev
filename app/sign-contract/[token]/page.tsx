// No "use client" here → Server component
import supabase from "@/app/supabase/supabase";
import { notFound } from "next/navigation";

import SignContractForm from "@/app/components/SignContractForm";

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: any }>;
}) {
  const token = (await params).token;

  // Fetch contract from Supabase using the token
  const { data: contractData, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !contractData) return notFound();

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">{contractData.contractTitle}</h1>

      {contractData.status === "signed" && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          ⚠️ Warning: This contract has already been signed and cannot be
          modified.
        </div>
      )}

      <p className="whitespace-pre-line border p-4 rounded bg-white shadow mb-6">
        {contractData.contractText}
      </p>

      {/* Optionally disable or hide SignForm if signed */}
      {contractData.status !== "signed" && (
        <SignContractForm token={token} signeeEmail={contractData.signee_email} />
      )}
    </div>
  );
}
