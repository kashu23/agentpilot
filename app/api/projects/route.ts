import { NextResponse } from 'next/server';
import { INITIAL_PROJECT, INITIAL_TASKS } from '@/lib/initial-data';

export async function GET() {
  return NextResponse.json({
    project: INITIAL_PROJECT,
    tasks: INITIAL_TASKS
  });
}
