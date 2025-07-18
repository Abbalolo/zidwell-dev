// app/api/electricity/providers/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const response = await axios.get('https://api.paybeta.ng/v2/electricity/providers', {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'application/json',
        // Optionally include an API key:
        // Authorization: `Bearer ${process.env.PAYBETA_API_KEY}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Electricity provider fetch error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch electricity providers' },
      { status: 500 }
    );
  }
}
