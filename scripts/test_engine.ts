import { seedDatabase } from '../lib/db/seed';
import { getAllCases, getMetricsSummary, getAuditLogsByCaseId } from '../lib/db/index';
import { processCaseRecovery, runBatchRecovery } from '../lib/agent/engine';

async function testPhase2() {
  console.log('=== REVIVEPAY PHASE 2 VERIFICATION TEST ===\n');

  console.log('--- STEP 1: SEEDING SYNTHETIC DATASET ---');
  seedDatabase();
  const cases = getAllCases();
  console.log(`Successfully seeded ${cases.length} revenue-risk cases into local database.`);

  const metricsInitial = getMetricsSummary();
  console.log('Initial Metrics:', JSON.stringify(metricsInitial, null, 2));

  console.log('\n--- STEP 2: SINGLE CASE RECOVERY VIA AGENT ENGINE ---');
  const singleResult = await processCaseRecovery('case_101');
  console.log('Intervention Selected:', singleResult.actionResult.action_type);
  console.log('Action Executed:', singleResult.actionResult.action_description);
  console.log('Outcome:', singleResult.actionResult.outcome_message);
  console.log('New Status:', singleResult.caseData.status);
  console.log('Recovered Amount: ₹' + singleResult.caseData.recovered_amount);

  const logs = getAuditLogsByCaseId('case_101');
  console.log(`\nAudit Trail Flow Timeline for case_101 (${logs.length} entries):`);
  logs.forEach(l => console.log(`  [${l.step_name}] ${l.action_taken} -> Status: ${l.status}`));

  console.log('\n--- STEP 3: BATCH RECOVERY ACROSS ALL AT-RISK CASES ---');
  const batchResult = await runBatchRecovery();
  console.log(`Processed ${batchResult.processedCount} cases.`);
  console.log(`Batch Total Revenue Recovered: ₹${batchResult.recoveredAmount}`);

  const finalMetrics = getMetricsSummary();
  console.log('\n--- STEP 4: FINAL MEASURED METRICS SUMMARY ---');
  console.log('Total Revenue at Risk: ₹' + finalMetrics.total_revenue_at_risk);
  console.log('Total Recovered:        ₹' + finalMetrics.total_recovered);
  console.log('Recovery Rate:          ' + finalMetrics.recovery_rate + '%');
  console.log('Recovered Cases:        ' + finalMetrics.recovered_cases);
  console.log('Escalated Cases:        ' + finalMetrics.escalated_cases);
  console.log('Failed Cases:           ' + finalMetrics.failed_cases);
  console.log('Active Cases Remaining: ' + finalMetrics.active_cases);

  console.log('\n=== PHASE 2 VERIFICATION COMPLETE & SUCCESSFUL ===');
}

testPhase2().catch(err => {
  console.error('Phase 2 Test Failed:', err);
  process.exit(1);
});
