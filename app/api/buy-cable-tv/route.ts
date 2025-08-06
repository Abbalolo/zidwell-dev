// app/api/cable/purchase/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await axios.post(
      'https://api.paybeta.ng/v2/cable/purchase',
      {
        service: body.service, 
        smartCardNumber: body.smartCardNumber, 
        amount: body.amount, 
        packageCode: body.packageCode, 
        customerName: body.customerName, 
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
    console.error('Cable purchase error:', error.response?.data || error.message);
       if (error.response?.data) {
      return NextResponse.json(error.response.data, {
        status: 400,
      });
    }
    return NextResponse.json(
      { error: 'Failed to complete cable purchase' },
      { status: 500 }
    );
  }
}
