import { NextResponse } from 'next/server';

let auditLogs: any[] = [];

export async function GET() {
  return NextResponse.json(auditLogs);
}

export async function POST(request: Request) {
  const log = await request.json();
  auditLogs.push(log);
  return NextResponse.json({ success: true });
}