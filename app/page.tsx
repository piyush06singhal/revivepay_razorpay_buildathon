'use client';

import React, { useState, useEffect } from 'react';
import { RecoveryCase, MetricsSummary } from '@/lib/agent/types';
import { Header } from '@/components/Header';
import { MetricsOverview } from '@/components/MetricsOverview';
import { CasesTable } from '@/components/CasesTable';
import { CaseDetailModal } from '@/components/CaseDetailModal';
import { ShieldCheck, Bot, RefreshCw, Zap, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const [batchSummaryMessage, setBatchSummaryMessage] = useState<string | null>(null);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (data.cases) {
        setCases(data.cases);
        setMetrics(data.metrics);

        // Update selected case modal if open
        if (selectedCase) {
          const updated = data.cases.find((c: RecoveryCase) => c.id === selectedCase.id);
          if (updated) setSelectedCase(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecoverCase = async (caseId: string) => {
    if (isProcessingId === caseId) return; // Prevent duplicate requests
    setIsProcessingId(caseId);
    try {
      const res = await fetch(`/api/cases/${caseId}/recover`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.caseData) {
        await fetchData();
        if (selectedCase && selectedCase.id === caseId) {
          setSelectedCase(data.caseData);
        }
      }
    } catch (err) {
      console.error('Recovery failed:', err);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleBatchRecover = async () => {
    if (isProcessingBatch) return; // Prevent duplicate requests
    setIsProcessingBatch(true);
    setBatchSummaryMessage(null);
    try {
      const res = await fetch('/api/batch-recover', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.cases) {
        setCases(data.cases);
        setMetrics(data.metrics);

        const escalatedCount = data.cases.filter((c: RecoveryCase) => c.status === 'escalated').length;
        const failedCount = data.cases.filter((c: RecoveryCase) => c.status === 'failed').length;

        const summary = `${data.processedCount} cases processed · ${formatINR(data.recoveredAmount)} recovered · ${escalatedCount} escalated · ${failedCount} failed`;
        setBatchSummaryMessage(summary);
      }
    } catch (err) {
      console.error('Batch recovery failed:', err);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleResetSeed = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setBatchSummaryMessage(null);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (data.cases) {
        setCases(data.cases);
        setMetrics(data.metrics);
        setSelectedCase(null);
      }
    } catch (err) {
      console.error('Reset seed failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        onBatchRecover={handleBatchRecover}
        onResetSeed={handleResetSeed}
        isProcessingBatch={isProcessingBatch}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Banner / Agent Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                RevivePay Autonomous Recovery Engine Active
              </h2>
              <p className="text-xs text-slate-400">
                Analyzing payment failures and revenue-at-risk events with bounded AI recovery workflows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bounded & Compliant Execution Active
          </div>
        </div>

        {/* Batch Execution Notification Toast Banner */}
        {batchSummaryMessage && (
          <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-4 flex items-center justify-between gap-4 shadow-md animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600 text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-emerald-300 text-xs uppercase tracking-wider block">
                  Batch Recovery Complete
                </span>
                <span className="text-white text-sm font-medium">
                  {batchSummaryMessage}
                </span>
              </div>
            </div>
            <button
              onClick={() => setBatchSummaryMessage(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-900 rounded border border-slate-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State or Metrics & Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Initializing RevivePay Agent Console...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <MetricsOverview metrics={metrics} />

            {/* Cases Table View */}
            <CasesTable
              cases={cases}
              onSelectCase={c => setSelectedCase(c)}
              onRecoverCase={handleRecoverCase}
              isProcessingId={isProcessingId}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        RevivePay AI Agent • Razorpay Buildathon 2026 Prototype • Track 03: AI Revenue Recovery
      </footer>

      {/* Case Detail Modal */}
      <CaseDetailModal
        recoveryCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onRecover={handleRecoverCase}
        isProcessing={isProcessingId === selectedCase?.id}
      />
    </div>
  );
}
