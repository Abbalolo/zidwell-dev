// app/api/data/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
      const cookieStore = await cookies();
      const token = cookieStore.get("paybeta_token")?.value;
    
      if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }


    const body = await req.json();

    const response = await axios.post(
      'https://api.paybeta.ng/v1/wallet/payment',
      {
        amount: body.amount,   
        service: body.service,
        customerId: body.customerId,
        billerCode: body.billerCode,       
        reference: body.reference,
        pin: body.pin,
      },
      {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
          "P-API-KEY": process.env.PAYBETA_API_KEY || "",
           "Authorization": `Bearer ${token}`
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error purchasing data:', error.response?.data || error.message);
    
      if (error.response?.data) {
      return NextResponse.json(error.response.data, {
        status: 400,
      });
    }

    return NextResponse.json(
      { error: 'Failed to purchase data bundle' },
      { status: 500 }
    );
  }
}
