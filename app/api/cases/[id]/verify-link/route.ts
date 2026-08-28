import { NextResponse } from 'next/server';
import { getCaseById, updateCase, addAuditLog, getMetricsSummary } from '@/lib/db';
import { fetchRazorpayPaymentLinkStatus } from '@/lib/razorpay/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const c = getCaseById(id);
    if (!c) {
      return NextResponse.json({ error: `Case ${id} not found` }, { status: 404 });
    }

    if (!c.razorpay_payment_link_id) {
      return NextResponse.json({ error: 'No Razorpay Payment Link ID associated with this case' }, { status: 400 });
    }

    const plink = await fetchRazorpayPaymentLinkStatus(c.razorpay_payment_link_id);
    if (!plink) {
      return NextResponse.json({ error: 'Failed to fetch status from Razorpay API' }, { status: 500 });
    }

    if (plink.status === 'paid') {
      const recoveredAmt = plink.amount_paid ? plink.amount_paid / 100 : c.amount;

      const updatedCase = updateCase(c.id, {
        status: 'recovered',
        recovered_amount: recoveredAmt,
      })!;

      addAuditLog({
        case_id: c.id,
        timestamp: new Date().toISOString(),
        actor: 'AGENT',
        step_name: 'OUTCOME',
        action_taken: 'Verified Razorpay Link Payment Status',
        reasoning: `Queried Razorpay Payment Link API (${plink.id}). Status is PAID. Revenue of ₹${recoveredAmt} verified.`,
        output_data: JSON.stringify({ link_id: plink.id, status: plink.status, amount_paid: recoveredAmt }),
        status: 'RECOVERED',
      });

      const metrics = getMetricsSummary();
      return NextResponse.json({ message: 'Payment verified successfully!', caseData: updatedCase, metrics });
    }

    return NextResponse.json({ message: `Payment link status is '${plink.status}'. Not paid yet.`, caseData: c });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
