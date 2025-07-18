// app/api/cable/validate/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await axios.post(
      'https://api.paybeta.ng/v2/cable/validate',
      {
        service: body.service, // e.g., 'gotv'
        smartCardNumber: body.smartCardNumber, // e.g., '8072916698'
      },
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PAYBETA_API_KEY || ''}`, // Optional if API key required
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Cable validation error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to validate cable details' },
      { status: 500 }
    );
  }
}
