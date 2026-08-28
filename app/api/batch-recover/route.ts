import { NextResponse } from 'next/server';
import { runBatchRecovery } from '@/lib/agent/engine';
import { getMetricsSummary } from '@/lib/db';

export async function POST() {
  try {
    const result = await runBatchRecovery();
    const metrics = getMetricsSummary();
    return NextResponse.json({
      message: `Batch recovery completed for ${result.processedCount} cases.`,
      recoveredAmount: result.recoveredAmount,
      cases: result.cases,
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Batch recovery failed' }, { status: 500 });
  }
}

