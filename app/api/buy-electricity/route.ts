// app/api/electricity/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await axios.post(
      'https://api.paybeta.ng/v2/electricity/purchase',
      {
        service: body.service, // e.g., "ikeja-electric"
        meterNumber: body.meterNumber,
        meterType: body.meterType, // "prepaid" or "postpaid"
        amount: body.amount,
        customerName: body.customerName,
        customerAddress: body.customerAddress,
        reference: body.reference, // must be unique per transaction
      },
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${process.env.PAYBETA_API_KEY}`, // if required
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Electricity purchase error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to purchase electricity token' },
      { status: 500 }
    );
  }
}
