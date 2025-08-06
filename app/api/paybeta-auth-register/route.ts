// app/api/paybeta/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await axios.post(
      'https://api.paybeta.ng/v1/wallet/register',
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          "P-API-KEY": process.env.PAYBETA_API_KEY as string,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Paybeta API Error:', error.response?.data || error.message);

    return NextResponse.json(
      {
        error: 'Something went wrong with the Paybeta API',
        details: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
