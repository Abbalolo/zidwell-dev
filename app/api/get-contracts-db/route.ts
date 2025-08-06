import { NextResponse } from 'next/server';
import { dbAdmin } from '@/app/firebase/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ message: 'User email is required' }, { status: 400 });
    }

    const snapshot = await dbAdmin
      .collection('contracts')
      .where('initiatorEmail', '==', userEmail) 
      .orderBy('createdAt', 'desc')
      .get();

    const contracts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ contracts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
