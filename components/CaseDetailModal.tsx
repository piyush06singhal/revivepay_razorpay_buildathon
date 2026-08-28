'use client';

import React, { useState, useEffect } from 'react';
import { RecoveryCase, AuditLog } from '@/lib/agent/types';
import { X, Bot, ShieldCheck, Play, RefreshCw, AlertTriangle, CheckCircle2, Clock, ShieldAlert, ArrowRight, User, Mail, Phone, Building2, CreditCard, Activity, ExternalLink, Check } from 'lucide-react';

interface CaseDetailModalProps {
  recoveryCase: RecoveryCase | null;
  onClose: () => void;
  onRecover: (caseId: string) => Promise<void>;
  isProcessing: boolean;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  recoveryCase,
  onClose,
  onRecover,
  isProcessing,
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isVerifyingLink, setIsVerifyingLink] = useState<boolean>(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (recoveryCase) {
      fetchLogs(recoveryCase.id);
      setVerifyMessage(null);
    }
  }, [recoveryCase?.id]);

  const fetchLogs = async (id: string) => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/cases/${id}`);
      const data = await res.json();
      if (data.auditLogs) {
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleVerifyPaymentStatus = async () => {
    if (!recoveryCase) return;
    setIsVerifyingLink(true);
    setVerifyMessage(null);
    try {
      const res = await fetch(`/api/cases/${recoveryCase.id}/verify-link`, {
        method: 'POST',
      });
      const data = await res.json();
      setVerifyMessage(data.message || 'Verification complete');
      await fetchLogs(recoveryCase.id);
      
      // Instantly refresh dashboard cases list and top metrics summary
      await onRecover(recoveryCase.id);
    } catch (err: any) {
      setVerifyMessage(err.message || 'Verification failed');
    } finally {
      setIsVerifyingLink(false);
    }
  };

  if (!recoveryCase) return null;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Determine stage progression for visual pipeline
  const isDiagnosed = auditLogs.some(l => l.step_name === 'DIAGNOSE' || l.step_name === 'STRATEGY_SELECTION');
  const isInterventionSelected = Boolean(recoveryCase.recommended_action);
  const isActionExecuted = auditLogs.some(l => l.step_name === 'EXECUTE_ACTION');
  const hasOutcome = recoveryCase.status !== 'at_risk';
  const isStopped = recoveryCase.status === 'recovered' || recoveryCase.status === 'escalated' || recoveryCase.status === 'failed';

  const getActionWhyRationale = (action?: string) => {
    switch (action) {
      case 'SEND_SMART_PAYMENT_LINK':
        return 'A payment link provides a low-friction recovery path without repeatedly retrying the original failed instrument.';
      case 'AUTO_RETRY':
        return 'Temporary bank downtime detected. Automatic gateway retry recovers authorization once bank core system recovers.';
      case 'PROMPT_CARD_UPDATE':
        return 'Expired card instrument requires customer payment detail update via dedicated card portal.';
      case 'SWITCH_GATEWAY_RETRY':
        return 'Primary gateway route declined. Failover route via Razorpay secondary gateway bypassing primary decline.';
      case 'ESCALATE_HUMAN_OPS':
        return 'High risk or max attempts reached. Escalating to human support operations to prevent chargeback risk.';
      default:
        return 'Selected optimal intervention based on risk score, failure code, and customer history.';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Case Recovery Detail</h2>
                <span className="font-mono text-xs text-slate-400">({recoveryCase.id})</span>
              </div>
              <p className="text-xs text-slate-400">
                {recoveryCase.customer_name} • {formatINR(recoveryCase.amount)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Customer & Info</span>
              <div className="font-semibold text-white truncate">{recoveryCase.customer_name}</div>
              <div className="text-[11px] text-slate-400 truncate">{recoveryCase.customer_email}</div>
              <div className="text-[11px] text-slate-400">{recoveryCase.customer_phone}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Why Detected (At Risk)</span>
              <div className="font-semibold text-amber-400">{recoveryCase.issue_type.replace('_', ' ')}</div>
              <div className="text-[11px] text-slate-400 font-mono">{recoveryCase.failure_code}</div>
              <div className="text-[11px] text-slate-400">{recoveryCase.bank_name || 'Razorpay Gateway'}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Bounded Retries</span>
              <div className="font-semibold text-white">
                Attempts: {recoveryCase.attempts_count} / {recoveryCase.max_retries}
              </div>
              <div className="text-[11px] text-slate-400">
                Risk Score: <span className="font-mono text-slate-200">{recoveryCase.risk_score.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-slate-400 capitalize">Channel: {recoveryCase.channel}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Amount & Outcome</span>
              <div className="font-semibold text-white">At Risk: {formatINR(recoveryCase.amount)}</div>
              <div className="text-[11px] text-emerald-400 font-semibold">
                Recovered: {formatINR(recoveryCase.recovered_amount)}
              </div>
              <div className="text-[10px] font-mono text-slate-400 capitalize">Status: {recoveryCase.status.replace('_', ' ')}</div>
            </div>
          </div>

          {/* Live Razorpay Test Mode Payment Link Hero Card */}
          {recoveryCase.payment_link_url && (
            <div className="bg-emerald-950/30 border border-emerald-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4" /> Real Razorpay Test Payment Link Active
                </div>
                <div className="text-slate-300 font-mono text-xs truncate max-w-md">
                  {recoveryCase.payment_link_url}
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Link ID: <span className="font-mono text-slate-200">{recoveryCase.razorpay_payment_link_id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={recoveryCase.payment_link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition shadow-md shadow-emerald-600/20"
                >
                  Open Razorpay Checkout <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {recoveryCase.status === 'recovering' && (
                  <button
                    onClick={handleVerifyPaymentStatus}
                    disabled={isVerifyingLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-xs border border-slate-700 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingLink ? 'animate-spin' : ''}`} />
                    Verify Payment Status
                  </button>
                )}
              </div>
            </div>
          )}

          {verifyMessage && (
            <div className="bg-slate-950 border border-slate-800 text-blue-400 px-3 py-2 rounded-lg text-xs font-mono">
              {verifyMessage}
            </div>
          )}

          {/* AI Decision Rationale Box */}
          <div className="bg-blue-950/30 border border-blue-800/60 rounded-xl p-4 relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between border-b border-blue-800/40 pb-2">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                <Bot className="w-4 h-4 text-blue-400" /> AI DECISION RATIONALE
              </div>
              <span className="bg-blue-900/60 text-blue-400 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-700/50">
                Action: {recoveryCase.recommended_action || 'AUTO_RETRY'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Detected Issue</span>
                <p className="text-slate-200 font-semibold">{recoveryCase.issue_type.replace('_', ' ')} ({recoveryCase.failure_code})</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Selected Intervention</span>
                <p className="text-blue-400 font-mono font-semibold">{recoveryCase.recommended_action || 'AUTO_RETRY'}</p>
              </div>

              <div className="md:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">AI Diagnosis</span>
                <p className="text-slate-300 leading-relaxed">{recoveryCase.diagnosis_summary || recoveryCase.failure_message}</p>
              </div>

              <div className="md:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Why Selected</span>
                <p className="text-slate-300 leading-relaxed">{getActionWhyRationale(recoveryCase.recommended_action)}</p>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-blue-800/30 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  <strong className="text-slate-300">Stopping Rule:</strong> Stop when payment succeeds or attempt reaches max retries ({recoveryCase.max_retries}).
                </span>
                <span className="text-emerald-400 font-semibold">
                  Recovered: {formatINR(recoveryCase.recovered_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Execution Workflow Pipeline */}
          <div>
            <h4 className="font-bold text-slate-300 mb-3 text-xs uppercase tracking-wider">
              Agent Recovery Audit Flow
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              {[
                { label: 'DETECTED', desc: 'Failure Logged', active: true },
                { label: 'DIAGNOSED', desc: recoveryCase.issue_type, active: isDiagnosed },
                { label: 'INTERVENTION', desc: recoveryCase.recommended_action || 'Pending', active: isInterventionSelected },
                { label: 'ACTION EXECUTED', desc: `Attempt ${recoveryCase.attempts_count}`, active: isActionExecuted },
                { label: 'OUTCOME', desc: recoveryCase.status.toUpperCase(), active: hasOutcome },
                { label: 'FINAL STATE', desc: isStopped ? recoveryCase.status.toUpperCase() : 'ACTIVE', active: isStopped },
              ].map((step) => (
                <div
                  key={step.label}
                  className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                    step.active
                      ? 'bg-slate-800/90 border-blue-500/50 text-white shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="text-[9px] font-mono font-bold text-blue-400 mb-1">{step.label}</div>
                  <div className="text-[10px] font-semibold truncate">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stopping Rule / Escalation Card & Action Button */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Stopping Rules & Bounded Execution Check
              </div>
              <p className="text-slate-400 text-[11px]">
                {recoveryCase.status === 'recovered'
                  ? 'Stopping Rule Met: Recovery completed successfully. Case closed.'
                  : recoveryCase.status === 'escalated'
                  ? 'Stopping Rule Met: Escalated to Razorpay Operations due to high risk or fraud indicator.'
                  : recoveryCase.status === 'failed'
                  ? 'Stopping Rule Met: Max retries (3) reached. Halted further retries.'
                  : `Bounded Execution Active: ${recoveryCase.max_retries - recoveryCase.attempts_count} retries remaining.`}
              </p>
            </div>

            {recoveryCase.status === 'at_risk' || recoveryCase.status === 'recovering' ? (
              <button
                onClick={async () => {
                  await onRecover(recoveryCase.id);
                  await fetchLogs(recoveryCase.id);
                }}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-md shadow-blue-600/30 transition disabled:opacity-50 whitespace-nowrap"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Executing Recovery...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run AI Recovery
                  </>
                )}
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded bg-slate-800 text-slate-400 text-xs font-mono border border-slate-700">
                Case Closed ({recoveryCase.status.toUpperCase()})
              </span>
            )}
          </div>

          {/* Complete Chronological Audit Trail */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-blue-400" /> Complete Chronological Audit Trail
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">{auditLogs.length} Audit Entries</span>
            </div>

            <div className="space-y-2">
              {loadingLogs ? (
                <div className="text-center py-6 text-slate-500">Loading audit trail...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-500">No audit logs recorded.</div>
              ) : (
                auditLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <div
                      key={log.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs transition hover:border-slate-700"
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer select-none"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold border border-slate-700">
                            {log.step_name}
                          </span>
                          <span className="font-semibold text-slate-200">{log.action_taken}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              log.status === 'SUCCESS' || log.status === 'RECOVERED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : log.status === 'ESCALATED' || log.status === 'HALTED'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-slate-400 leading-relaxed text-[11px]">
                        {log.reasoning}
                      </div>

                      {/* Expandable Technical JSON Payload */}
                      {isExpanded && (log.input_data || log.output_data) && (
                        <div className="mt-3 pt-2 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                          {log.input_data && (
                            <div className="bg-slate-900 p-2 rounded border border-slate-800">
                              <span className="text-slate-500 block font-semibold mb-1">INPUT PAYLOAD:</span>
                              <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">{log.input_data}</pre>
                            </div>
                          )}
                          {log.output_data && (
                            <div className="bg-slate-900 p-2 rounded border border-slate-800">
                              <span className="text-slate-500 block font-semibold mb-1">OUTPUT RESULT:</span>
                              <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">{log.output_data}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
