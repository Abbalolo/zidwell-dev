import { dbAdmin } from '@/app/firebase/firebaseAdmin';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type RouteContext = {
  params: {
    id: string;
  };
};

// ✅ GET a single invoice by ID
export async function GET(
  req: NextRequest,
  { params }: any
) {
  try {
    const invoiceId = params.id;
    const docRef = dbAdmin.collection('invoices').doc(invoiceId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ message: 'Failed to fetch invoice' }, { status: 500 });
  }
}

// ✅ PATCH a single invoice by ID
export async function PATCH(
  req: NextRequest,
  { params }: any
) {
  try {
    const invoiceId = params.id;
    const updates = await req.json();

    await dbAdmin.collection('invoices').doc(invoiceId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ message: 'Failed to update invoice' }, { status: 500 });
  }
}
