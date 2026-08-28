import { NextResponse } from 'next/server';
import { getAllCases, getMetricsSummary } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';

export async function GET() {
  try {
    const cases = getAllCases();
    // If no cases exist yet, seed them automatically
    if (cases.length === 0) {
      seedDatabase();
    }
    const freshCases = getAllCases();
    const metrics = getMetricsSummary();
    return NextResponse.json({ cases: freshCases, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'seed' || body.action === 'reset') {
      seedDatabase();
      const cases = getAllCases();
      const metrics = getMetricsSummary();
      return NextResponse.json({ message: 'Synthetic dataset re-seeded successfully', cases, metrics });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset seed data' }, { status: 500 });
  }
}

