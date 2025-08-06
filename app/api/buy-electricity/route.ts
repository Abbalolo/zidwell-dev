// app/api/electricity/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await axios.post(
      'https://api.paybeta.ng/v2/electricity/purchase',
      {
        service: body.service, 
        meterNumber: body.meterNumber,
        meterType: body.meterType, 
        amount: body.amount,
        customerName: body.customerName,
        customerAddress: body.customerAddress,
        reference: body.reference,
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
    console.error('Electricity purchase error:', error.response?.data || error.message);

     if (error.response?.data) {
      return NextResponse.json(error.response.data, {
        status: 400,
      });
    }
    return NextResponse.json(
      { error: 'Failed to purchase electricity token' },
      { status: 500 }
    );
  }
}
