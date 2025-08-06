// app/api/airtime/providers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  try {
    const res = await axios.get(
      'https://api.paybeta.ng/v2/airtime/providers',
      {
          headers: {
          "Content-Type": "application/json",
          "P-API-KEY": process.env.PAYBETA_API_KEY || "",
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
