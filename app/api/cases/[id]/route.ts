import { NextResponse } from 'next/server';
import { getCaseById, getAuditLogsByCaseId } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const c = getCaseById(id);
    if (!c) {
      return NextResponse.json({ error: `Case ${id} not found` }, { status: 404 });
    }

    const auditLogs = getAuditLogsByCaseId(id);
    return NextResponse.json({ case: c, auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
