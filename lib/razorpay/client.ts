import crypto from 'crypto';
import { RecoveryCase } from '../agent/types';

export interface RazorpayPaymentLinkResponse {
  id: string;
  short_url: string;
  status: string;
  amount: number;
  amount_paid: number;
}

export function isRazorpayConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isEnabled = process.env.ENABLE_LIVE_RAZORPAY_API !== 'false';
  return Boolean(isEnabled && keyId && keySecret);
}

function getBasicAuthHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function createRazorpayPaymentLink(c: RecoveryCase): Promise<RazorpayPaymentLinkResponse> {
  const amountInPaise = Math.round(c.amount * 100);
  const cleanPhone = c.customer_phone.replace(/\s+/g, '');

  const payload = {
    amount: amountInPaise,
    currency: c.currency || 'INR',
    accept_partial: false,
    reference_id: c.id,
    description: `RevivePay Smart Recovery for ${c.issue_type.replace('_', ' ')} (${c.id})`,
    customer: {
      name: c.customer_name,
      email: c.customer_email,
      contact: cleanPhone,
    },
    notify: {
      sms: true,
      email: true,
    },
    reminder_enable: true,
    notes: {
      revivepay_case_id: c.id,
      issue_type: c.issue_type,
      risk_score: String(c.risk_score),
    },
  };

  const response = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getBasicAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Razorpay API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    short_url: data.short_url,
    status: data.status,
    amount: data.amount,
    amount_paid: data.amount_paid || 0,
  };
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf-8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');

    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}

export async function fetchRazorpayPaymentLinkStatus(plinkId: string): Promise<RazorpayPaymentLinkResponse | null> {
  if (!isRazorpayConfigured()) return null;

  try {
    const response = await fetch(`https://api.razorpay.com/v1/payment_links/${plinkId}`, {
      method: 'GET',
      headers: {
        Authorization: getBasicAuthHeader(),
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      short_url: data.short_url,
      status: data.status,
      amount: data.amount,
      amount_paid: data.amount_paid || 0,
    };
  } catch (err) {
    console.error('Fetch payment link status error:', err);
    return null;
  }
}
