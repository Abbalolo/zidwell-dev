// No "use client" here → server component
import { dbAdmin } from '@/app/firebase/firebaseAdmin';
import { notFound } from 'next/navigation';
import SignForm from '@/app/components/SignForm';



export default async function SignPage({ params }: any) {
  const token = params.token;

  const doc = await dbAdmin.collection('contracts').doc(token).get();

  if (!doc.exists) return notFound();

  const contractData = doc.data();

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">{contractData?.contractTitle}</h1>

      {contractData?.status === 'signed' && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          ⚠️ Warning: This contract has already been signed and cannot be modified.
        </div>
      )}

      <p className="whitespace-pre-line border p-4 rounded bg-white shadow mb-6">
        {contractData?.contractText}
      </p>

      {/* Optionally disable or hide SignForm if signed */}
      {contractData?.status !== 'signed' && (
        <SignForm token={token} signeeEmail={contractData?.signeeEmail} />
      )}
    </div>
  );
}
