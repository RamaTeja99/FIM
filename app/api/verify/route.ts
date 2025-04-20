import { NextResponse } from 'next/server';
import { Blockchain } from '@/utils/blockchain';
import crypto from 'crypto';
const blockchain = new Blockchain();

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  const isValid = await blockchain.addBlock(buffer);

  return NextResponse.json({
    valid: isValid,
    log: {
      id: crypto.randomUUID(),
      fileName: file.name,
      hash: crypto.createHash('sha512').update(buffer).digest('hex'),
      status: isValid ? 'valid' : 'tampered',
      timestamp: new Date().toISOString()
    }
  });
}