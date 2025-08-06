// app/api/cable/validate/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await axios.post(
      'https://api.paybeta.ng/v2/cable/validate',
      {
        service: body.service,
        smartCardNumber: body.smartCardNumber, 
      },
      {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
          "P-API-KEY": process.env.PAYBETA_API_KEY || "",
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
