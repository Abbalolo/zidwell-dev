
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {

    const service = req.nextUrl.searchParams.get("service");

  if (!service) {
    return NextResponse.json(
      { error: "Missing service parameter in query string" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(`https://api.paybeta.ng/v2/cable/bouquet?service=${service}`, {
     
      maxBodyLength: Infinity,
     headers: {
          "Content-Type": "application/json",
          "P-API-KEY": process.env.PAYBETA_API_KEY || "",
        },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching GOTV bouquet:', error.response?.data || error.message);
     if (error.response?.data) {
      return NextResponse.json(error.response.data, {
        status: 400,
      });
    }
    return NextResponse.json(
      { error: 'Failed to fetch GOTV bouquet' },
      { status: 500 }
    );
  }
}
