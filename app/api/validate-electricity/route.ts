// app/api/electricity/validate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await axios.post(
      'https://api.paybeta.ng/v2/electricity/validate',
      {
        service: body.service, // e.g., "ikeja-electric"
        meterNumber: body.meterNumber,
        meterType: body.meterType, // e.g., "prepaid"
      },
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
          // Optionally add Authorization header:
          // Authorization: `Bearer ${process.env.PAYBETA_API_KEY}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Validation error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to validate electricity meter' },
      { status: 500 }
    );
  }
}
