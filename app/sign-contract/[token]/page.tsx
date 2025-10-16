import { notFound } from "next/navigation";

import SignContractForm from "@/app/components/SignContractForm";
import { createClient } from "@supabase/supabase-js";
import { Textarea } from "@/app/components/ui/textarea";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function page({
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
  // console.log(contractData, error)
  if (error || !contractData) return notFound();

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">{contractData.contract_title}</h1>

      {contractData.status === "signed" && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          ⚠️ Warning: This contract has already been signed and cannot be
          modified.
        </div>
      )}

      <Textarea
        value={contractData.contract_text}
        className="min-h-[600px] font-mono text-sm"
        readOnly
      />

      {/* Optionally disable or hide SignForm if signed */}
      {contractData.status !== "signed" && (
        <SignContractForm
          token={token}
          signeeEmail={contractData.signee_email}
        />
      )}
    </div>
  );
}
