import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay/client';
import { getCaseById, updateCase, addAuditLog, getMetricsSummary } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.warn('Razorpay webhook signature verification failed.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const eventData = JSON.parse(rawBody);
    const eventName = eventData.event;

    console.log(`Received Razorpay Webhook Event: ${eventName}`);

    if (eventName === 'payment_link.paid') {
      const plinkEntity = eventData.payload?.payment_link?.entity;
      const paymentEntity = eventData.payload?.payment?.entity;

      const caseId = plinkEntity?.reference_id || plinkEntity?.notes?.revivepay_case_id;
      if (caseId) {
        const existingCase = getCaseById(caseId);
        if (existingCase) {
          const amountPaidINR = plinkEntity.amount_paid ? plinkEntity.amount_paid / 100 : existingCase.amount;

          updateCase(caseId, {
            status: 'recovered',
            recovered_amount: amountPaidINR,
            razorpay_payment_id: paymentEntity?.id || null,
          });

          addAuditLog({
            case_id: caseId,
            timestamp: new Date().toISOString(),
            actor: 'SYSTEM',
            step_name: 'OUTCOME',
            action_taken: 'Razorpay Webhook: payment_link.paid',
            reasoning: `Received official Razorpay webhook verification. Payment of ₹${amountPaidINR} captured successfully via ${paymentEntity?.method || 'Razorpay Link'}.`,
            input_data: JSON.stringify({ event: eventName, payment_link_id: plinkEntity?.id, payment_id: paymentEntity?.id }),
            output_data: JSON.stringify({ status: 'recovered', amount_recovered: amountPaidINR }),
            status: 'RECOVERED',
          });

          return NextResponse.json({ status: 'success', case_id: caseId, message: 'Case updated to RECOVERED' });
        }
      }
    }

    return NextResponse.json({ status: 'ignored', event: eventName });
  } catch (error: any) {
    console.error('Razorpay webhook handling error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
