export type FailureReason =
  | 'BANK_DOWNTIME'
  | 'CARD_DECLINED'
  | 'INSUFFICIENT_FUNDS'
  | 'EXPIRED_CARD'
  | 'ABANDONED_CHECKOUT'
  | 'REPEATED_FAILURE'
  | 'FRAUD_RISK';

export type CaseStatus =
  | 'at_risk'
  | 'recovering'
  | 'recovered'
  | 'escalated'
  | 'failed';

export type InterventionType =
  | 'AUTO_RETRY'
  | 'SEND_SMART_PAYMENT_LINK'
  | 'PROMPT_CARD_UPDATE'
  | 'SWITCH_GATEWAY_RETRY'
  | 'ESCALATE_HUMAN_OPS'
  | 'STOP_MAX_RETRIES';

export interface RecoveryCase {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  currency: string;
  channel: 'checkout' | 'subscription' | 'invoice' | 'recurring';
  issue_type: FailureReason;
  failure_code: string;
  failure_message: string;
  bank_name?: string;
  payment_method: string;
  status: CaseStatus;
  risk_score: number; // 0.0 to 1.0
  attempts_count: number;
  max_retries: number;
  recovered_amount: number;
  created_at: string;
  updated_at: string;
  recommended_action?: InterventionType;
  diagnosis_summary?: string;
  // Razorpay Specific Fields
  razorpay_payment_link_id?: string;
  payment_link_url?: string;
  razorpay_payment_id?: string;
}

export interface AuditLog {
  id: string;
  case_id: string;
  timestamp: string;
  actor: 'AGENT' | 'SYSTEM' | 'USER_OPS';
  step_name: 'DIAGNOSE' | 'STRATEGY_SELECTION' | 'EXECUTE_ACTION' | 'STOPPING_RULE_CHECK' | 'OUTCOME';
  action_taken: string;
  reasoning: string;
  input_data?: string;
  output_data?: string;
  status: string;
}

export interface MetricsSummary {
  total_revenue_at_risk: number;
  total_recovered: number;
  recovery_rate: number; // percentage e.g. 64.5
  total_cases: number;
  active_cases: number;
  recovered_cases: number;
  escalated_cases: number;
  failed_cases: number;
}

export interface DiagnosisResult {
  reason: FailureReason;
  risk_score: number;
  explanation: string;
  recommended_intervention: InterventionType;
  stopping_condition_met: boolean;
  stopping_reason?: string;
}

export interface ActionResult {
  success: boolean;
  action_type: InterventionType;
  action_description: string;
  outcome_message: string;
  recovered_amount: number;
  next_step: string;
  stop_or_escalate: boolean;
  new_status: CaseStatus;
}
