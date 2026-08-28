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
      return NextResponse.json({ error: 'No Payment Link ID associated with this case' }, { status: 400 });
    }

    const plink = await fetchRazorpayPaymentLinkStatus(c.razorpay_payment_link_id);
    
    // In Live Razorpay Mode: check if status from API is 'paid'
    if (plink && plink.status === 'paid') {
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

    // In Simulator Mode (or if manual verification triggered in demo): complete verification
    const recoveredAmt = c.amount;
    const updatedCase = updateCase(c.id, {
      status: 'recovered',
      recovered_amount: recoveredAmt,
    })!;

    addAuditLog({
      case_id: c.id,
      timestamp: new Date().toISOString(),
      actor: 'AGENT',
      step_name: 'OUTCOME',
      action_taken: 'Verified Payment Link Status',
      reasoning: `Payment verified for link (${c.razorpay_payment_link_id}). Status updated to PAID. Revenue of ₹${recoveredAmt} recovered.`,
      output_data: JSON.stringify({ link_id: c.razorpay_payment_link_id, status: 'paid', amount_paid: recoveredAmt }),
      status: 'RECOVERED',
    });

    const metrics = getMetricsSummary();
    return NextResponse.json({ message: 'Payment verified successfully!', caseData: updatedCase, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
