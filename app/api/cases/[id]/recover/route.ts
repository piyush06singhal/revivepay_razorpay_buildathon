import { NextResponse } from 'next/server';
import { processCaseRecovery } from '@/lib/agent/engine';
import { getMetricsSummary } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await processCaseRecovery(id);
    const metrics = getMetricsSummary();

    return NextResponse.json({
      caseData: result.caseData,
      actionResult: result.actionResult,
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process case recovery' },
      { status: 500 }
    );
  }
}
