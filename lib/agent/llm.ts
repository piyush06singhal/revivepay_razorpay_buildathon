import { GoogleGenAI } from '@google/genai';
import { RecoveryCase, FailureReason, InterventionType, DiagnosisResult } from './types';

const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export async function diagnoseCaseWithAI(c: RecoveryCase): Promise<DiagnosisResult> {
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are RevivePay AI, an autonomous revenue recovery agent for Razorpay.
Analyze this payment failure and recommend a bounded recovery intervention.

Case Data:
- ID: ${c.id}
- Customer: ${c.customer_name} (${c.customer_email})
- Amount: ₹${c.amount}
- Issue Type: ${c.issue_type}
- Failure Code: ${c.failure_code}
- Failure Message: ${c.failure_message}
- Bank Name: ${c.bank_name || 'N/A'}
- Attempts Count: ${c.attempts_count} / Max Retries: ${c.max_retries}
- Channel: ${c.channel}

Instructions:
Respond ONLY with a valid JSON object matching this schema:
{
  "reason": "${c.issue_type}",
  "risk_score": <number between 0.0 and 1.0>,
  "explanation": "<concise 2-sentence human readable diagnosis>",
  "recommended_intervention": "<one of: AUTO_RETRY | SEND_SMART_PAYMENT_LINK | PROMPT_CARD_UPDATE | SWITCH_GATEWAY_RETRY | ESCALATE_HUMAN_OPS | STOP_MAX_RETRIES>",
  "stopping_condition_met": <boolean>,
  "stopping_reason": "<reason string if stopping_condition_met is true>"
}`,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reason: parsed.reason || c.issue_type,
          risk_score: typeof parsed.risk_score === 'number' ? parsed.risk_score : c.risk_score,
          explanation: parsed.explanation || c.diagnosis_summary || 'Analyzed failure context and calculated recovery probability.',
          recommended_intervention: parsed.recommended_intervention || 'SEND_SMART_PAYMENT_LINK',
          stopping_condition_met: Boolean(parsed.stopping_condition_met),
          stopping_reason: parsed.stopping_reason,
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to rule-based engine:', err);
    }
  }

  // Deterministic Rules-Engine Fallback
  return fallbackDiagnosis(c);
}

function fallbackDiagnosis(c: RecoveryCase): DiagnosisResult {
  // Check max retries first
  if (c.attempts_count >= c.max_retries) {
    return {
      reason: c.issue_type,
      risk_score: 0.90,
      explanation: `Maximum retry limit (${c.max_retries}) reached. Agent halted further automated actions to protect customer experience.`,
      recommended_intervention: 'ESCALATE_HUMAN_OPS',
      stopping_condition_met: true,
      stopping_reason: `Max retries (${c.max_retries}) exceeded.`,
    };
  }

  // Check Fraud Risk
  if (c.issue_type === 'FRAUD_RISK' || c.risk_score >= 0.85) {
    return {
      reason: 'FRAUD_RISK',
      risk_score: Math.max(c.risk_score, 0.90),
      explanation: 'Razorpay Fraud Shield flagged transaction velocity or device anomaly. Retries blocked for safety.',
      recommended_intervention: 'ESCALATE_HUMAN_OPS',
      stopping_condition_met: true,
      stopping_reason: 'High fraud risk detected.',
    };
  }

  switch (c.issue_type) {
    case 'BANK_DOWNTIME':
      return {
        reason: 'BANK_DOWNTIME',
        risk_score: 0.20,
        explanation: `${c.bank_name || 'Issuer bank'} core systems experienced temporary downtime. High probability of auto-recovery via gateway retry.`,
        recommended_intervention: 'AUTO_RETRY',
        stopping_condition_met: false,
      };

    case 'EXPIRED_CARD':
      return {
        reason: 'EXPIRED_CARD',
        risk_score: 0.60,
        explanation: `Payment instrument has expired. Customer must update payment details before retry can succeed.`,
        recommended_intervention: 'PROMPT_CARD_UPDATE',
        stopping_condition_met: false,
      };

    case 'INSUFFICIENT_FUNDS':
    case 'ABANDONED_CHECKOUT':
      return {
        reason: c.issue_type,
        risk_score: 0.35,
        explanation: `Soft decline on checkout/subscription. Smart payment link via WhatsApp/SMS allows instant payment retry via alternate methods.`,
        recommended_intervention: 'SEND_SMART_PAYMENT_LINK',
        stopping_condition_met: false,
      };

    case 'REPEATED_FAILURE':
      if (c.attempts_count >= 2) {
        return {
          reason: 'REPEATED_FAILURE',
          risk_score: 0.80,
          explanation: `Multiple consecutive payment failures recorded. Escalated to Human Operations for manual intervention.`,
          recommended_intervention: 'ESCALATE_HUMAN_OPS',
          stopping_condition_met: true,
          stopping_reason: 'Repeated hard failures across attempts.',
        };
      }
      return {
        reason: 'REPEATED_FAILURE',
        risk_score: 0.50,
        explanation: `Primary payment route failed repeatedly. Switching to secondary fallback gateway route.`,
        recommended_intervention: 'SWITCH_GATEWAY_RETRY',
        stopping_condition_met: false,
      };

    default:
      return {
        reason: c.issue_type,
        risk_score: 0.40,
        explanation: `Standard payment decline. Recommended sending a smart payment link with auto-fallback.`,
        recommended_intervention: 'SEND_SMART_PAYMENT_LINK',
        stopping_condition_met: false,
      };
  }
}

