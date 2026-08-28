'use client';

import React from 'react';
import { MetricsSummary } from '@/lib/agent/types';
import { IndianRupee, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: MetricsSummary | null;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  if (!metrics) return null;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      {/* Metric 1: Total Revenue at Risk */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Revenue at Risk</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-white tracking-tight">
            {formatINR(metrics.total_revenue_at_risk)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {metrics.total_cases} total cases</p>
        </div>
      </div>

      {/* Metric 2: Revenue Recovered */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Revenue Recovered</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-emerald-400 tracking-tight">
            {formatINR(metrics.total_recovered)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Measured across batch</p>
        </div>
      </div>

      {/* Metric 3: Recovery Rate */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Recovery Rate</span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-blue-400 tracking-tight">
            {metrics.recovery_rate}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.recovery_rate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metric 4: Active Cases */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Active Recovery</span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-white tracking-tight">
            {metrics.active_cases}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending agent action</p>
        </div>
      </div>

      {/* Metric 5: Recovered Count */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Recovered Count</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-emerald-400 tracking-tight">
            {metrics.recovered_cases}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Successfully resolved</p>
        </div>
      </div>

      {/* Metric 6: Escalations */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Escalated / Failed</span>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-purple-400 tracking-tight">
            {metrics.escalated_cases + metrics.failed_cases}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.escalated_cases} escalated, {metrics.failed_cases} failed
          </p>
        </div>
      </div>
    </div>
  );
};

