import { NextResponse } from 'next/server';
import { dbAdmin } from '@/app/firebase/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.createdBy || !data.invoiceId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Save invoice as "sent"
    await dbAdmin.collection('invoices').doc(data.invoiceId).set({
      ...data,
      status: 'pending',
      sentAt: new Date().toISOString(),
    });

    // Optional: send notification or email here (if implemented)
    // await sendEmailToClient(data.email, data.invoiceId);

    return NextResponse.json({ message: 'Invoice sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json({ message: 'Failed to send invoice' }, { status: 500 });
  }
}
