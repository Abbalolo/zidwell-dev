// app/api/data/providers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  try {
    const response = await axios.get(
      'https://api.paybeta.ng/v2/data-bundle/providers',
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
    console.error('Failed to fetch data providers:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch data providers' },
      { status: 500 }
    );
  }
}
