import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    project: {
      id: 'launch-nova',
      name: 'Launch Nova',
      deadline: '2026-09-04',
      mode: 'Collaborative',
      health: 'at_risk',
    },
  });
}
