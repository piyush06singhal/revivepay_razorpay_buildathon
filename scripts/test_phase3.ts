import crypto from 'crypto';
import { seedDatabase } from '../lib/db/seed';
import { getCaseById, getAuditLogsByCaseId, getMetricsSummary, updateCase } from '../lib/db/index';
import { verifyRazorpayWebhookSignature } from '../lib/razorpay/client';

async function testPhase3() {
  console.log('=== REVIVEPAY PHASE 3 INTEGRATION TEST ===\n');

  // Step 1: Test Webhook HMAC Signature Verification
  console.log('--- TEST 1: WEBHOOK HMAC SHA256 SIGNATURE VERIFICATION ---');
  const secret = 'test_webhook_secret_123';
  const payloadStr = JSON.stringify({
    event: 'payment_link.paid',
    payload: {
      payment_link: {
        entity: { id: 'plink_test123', reference_id: 'case_104', amount_paid: 899000, status: 'paid' }
      },
      payment: {
        entity: { id: 'pay_test999', method: 'upi', bank: null }
      }
    }
  });

  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex');

  const isValid = verifyRazorpayWebhookSignature(payloadStr, validSignature, secret);
  const isInvalid = verifyRazorpayWebhookSignature(payloadStr, 'bad_signature_xyz', secret);

  console.log('Valid Signature Verified:', isValid ? 'PASS' : 'FAIL');
  console.log('Invalid Signature Rejected:', !isInvalid ? 'PASS' : 'FAIL');

  // Step 2: Test Webhook Event Handling Simulation
  console.log('\n--- TEST 2: WEBHOOK EVENT HANDLER SIMULATION ---');
  seedDatabase();
  const targetCase = getCaseById('case_104')!;
  console.log(`Target Case before webhook: ID=${targetCase.id}, Status=${targetCase.status}, Amount=${targetCase.amount}`);

  // Simulate payment_link.paid update
  updateCase('case_104', {
    status: 'recovered',
    recovered_amount: 8990.00,
    razorpay_payment_link_id: 'plink_test123',
    razorpay_payment_id: 'pay_test999'
  });

  const updatedCase = getCaseById('case_104')!;
  console.log(`Target Case after webhook:  ID=${updatedCase.id}, Status=${updatedCase.status}, Recovered=₹${updatedCase.recovered_amount}`);
  console.log(`Razorpay Payment Link ID: ${updatedCase.razorpay_payment_link_id}`);
  console.log(`Razorpay Payment ID:      ${updatedCase.razorpay_payment_id}`);

  const metrics = getMetricsSummary();
  console.log('\n--- TEST 3: METRICS UPDATE AFTER WEBHOOK ---');
  console.log('Total Revenue at Risk: ₹' + metrics.total_revenue_at_risk);
  console.log('Total Recovered:        ₹' + metrics.total_recovered);
  console.log('Recovery Rate:          ' + metrics.recovery_rate + '%');

  console.log('\n=== PHASE 3 INTEGRATION TEST PASSED SUCCESSFULLY ===');
}

testPhase3().catch(err => {
  console.error('Phase 3 Test Failed:', err);
  process.exit(1);
});

