import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'UP',
    service: 'api-gateway (nextjs)',
    message: 'Fanta-Advisor Next.js API is running smoothly'
  });
}
