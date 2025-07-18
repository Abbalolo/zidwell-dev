// app/api/cable/purchase/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await axios.post(
      'https://api.paybeta.ng/v2/cable/purchase',
      {
        service: body.service, // e.g., 'dstv'
        smartCardNumber: body.smartCardNumber, // e.g., '8216167618'
        amount: body.amount, // e.g., 500
        packageCode: body.packageCode, // e.g., 'COMPLE36'
        customerName: body.customerName, // e.g., 'JOHN DOE'
        reference: body.reference, // e.g., '1752763325'
      },
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PAYBETA_API_KEY || ''}`, // optional if API key is required
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Cable purchase error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to complete cable purchase' },
      { status: 500 }
    );
  }
}
