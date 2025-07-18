// app/api/airtime/providers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const res = await axios.post(
      'https://api.paybeta.ng/v2/airtime/providers',
      {}, // POST body if needed
      {
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${process.env.PAYBETA_API_KEY}`, // if required
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error('PayBeta Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch airtime providers' },
      { status: 500 }
    );
  }
}
