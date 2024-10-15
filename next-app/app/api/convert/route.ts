import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const usdcAmount = url.searchParams.get('usdcAmount');

    if (!usdcAmount) {
      return NextResponse.json({ message: 'Invalid USDC amount' }, { status: 400 });
    }

    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=sol');
    const price = res.data['usd-coin']?.sol;
    const solAmount = Number(usdcAmount) * price;

    return NextResponse.json({ 
      message: 'USDC conversion success', 
      data: { 
        solAmount, 
        res: res.data
      } 
  }, { status: 200 });
  

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
