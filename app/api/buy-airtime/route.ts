// app/api/airtime/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload = {
      service: body.service,
      phoneNumber: body.phoneNumber,
      amount: body.amount,
      reference: body.reference,
    };

    const response = await axios.post(
      'https://api.paybeta.ng/v2/airtime/purchase',
      payload,
      {
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${process.env.PAYBETA_API_KEY}`, // if required
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Airtime Purchase Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to purchase airtime' },
      { status: 500 }
    );
  }
}
