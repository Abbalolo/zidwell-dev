// app/api/cable/bouquet/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const response = await axios.get('https://api.paybeta.ng/v2/cable/bouquet', {
      params: {
        service: 'gotv',
      },
      maxBodyLength: Infinity,
      headers: {
        Authorization: `Bearer ${process.env.PAYBETA_API_KEY || ''}`, // Optional: only if required
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching GOTV bouquet:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch GOTV bouquet' },
      { status: 500 }
    );
  }
}
