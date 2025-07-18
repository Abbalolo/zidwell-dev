// app/api/data/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await axios.post(
      'https://api.paybeta.ng/v2/data-bundle/purchase',
      {
        service: body.service, // e.g., "mtn_data"
        amount: body.amount,   // e.g., 1000
        phoneNumber: body.phoneNumber, // e.g., "08060000000"
        code: body.code,       // e.g., "MT1"
        reference: body.reference, // e.g., "1752763325"
      },
      {
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${process.env.PAYBETA_API_KEY}`, // Optional if required
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error purchasing data:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to purchase data bundle' },
      { status: 500 }
    );
  }
}
