// app/api/data/mtn/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  try {
    const response = await axios.get(
      'https://api.paybeta.ng/v2/data-bundle/list?service=mtn_data',
      {
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${process.env.PAYBETA_API_KEY}`, // Optional, if required
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching MTN data list:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch MTN data bundle list' },
      { status: 500 }
    );
  }
}
