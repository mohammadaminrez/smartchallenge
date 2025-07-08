// frontend/src/app/api/pinMetadata/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, description, category } = await request.json();

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: process.env.PINATA_API_KEY!,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY!
      },
      body: JSON.stringify({
        pinataOptions: { cidVersion: 1 },
        pinataMetadata: { name: `challenge-meta-${Date.now()}` },
        pinataContent: { name, description, category }
      })
    });

    if (!pinataRes.ok) {
      const errorText = await pinataRes.text();
      return NextResponse.json({ error: errorText }, { status: pinataRes.status });
    }

    const { IpfsHash } = await pinataRes.json();
    return NextResponse.json({ cid: IpfsHash });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
