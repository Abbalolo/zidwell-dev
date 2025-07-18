// app/api/cable/providers/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const response = await axios.get('https://api.paybeta.ng/v2/cable/providers', {
      maxBodyLength: Infinity,
      headers: {
        Authorization: `Bearer ${process.env.PAYBETA_API_KEY || ''}`, // Optional if required
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching cable providers:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch cable providers' },
      { status: 500 }
    );
  }
}
