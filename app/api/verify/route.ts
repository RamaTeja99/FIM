import { NextResponse } from 'next/server';
import { PBFTBlockchain } from '@/utils/blockchain';
import crypto from 'crypto';
const blockchain = new PBFTBlockchain();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const result = await blockchain.addBlock(buffer);
    const hash = crypto.createHash('sha512').update(buffer).digest('hex');

    return NextResponse.json({
      valid: result.valid,
      hash: hash,
      error: result.error
    });
  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(blockchain.getChain());
}