'use client';

import React, { useState } from 'react';
import { RecoveryCase, CaseStatus } from '@/lib/agent/types';
import { Search, Filter, ArrowUpRight, AlertTriangle, Clock, CheckCircle2, ShieldAlert, XCircle, ArrowUpDown, ChevronDown } from 'lucide-react';

interface CasesTableProps {
  cases: RecoveryCase[];
  onSelectCase: (c: RecoveryCase) => void;
  onRecoverCase: (caseId: string) => void;
  isProcessingId: string | null;
}

type SortField = 'updated_at' | 'amount' | 'risk_score' | 'status';
type SortOrder = 'asc' | 'desc';

export const CasesTable: React.FC<CasesTableProps> = ({
  cases,
  onSelectCase,
  onRecoverCase,
  isProcessingId,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredCases = cases
    .filter(c => {
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.customer_name.toLowerCase().includes(q) ||
        c.customer_email.toLowerCase().includes(q) ||
        c.issue_type.toLowerCase().includes(q) ||
        (c.bank_name && c.bank_name.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      let mod = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'amount') {
        return (a.amount - b.amount) * mod;
      }
      if (sortField === 'risk_score') {
        return (a.risk_score - b.risk_score) * mod;
      }
      if (sortField === 'status') {
        return a.status.localeCompare(b.status) * mod;
      }
      return (new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) * mod;
    });

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'at_risk':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> At Risk
          </span>
        );
      case 'recovering':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3 animate-spin" /> Recovering
          </span>
        );
      case 'recovered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Recovered
          </span>
        );
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShieldAlert className="w-3 h-3" /> Escalated
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Cases' },
            { id: 'at_risk', label: 'At Risk' },
            { id: 'recovering', label: 'Recovering' },
            { id: 'recovered', label: 'Recovered' },
            { id: 'escalated', label: 'Escalated' },
            { id: 'failed', label: 'Failed' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search customer, bank, issue..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold mr-1">Sort:</span>
            <button
              onClick={() => handleSort('amount')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                sortField === 'amount' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Amount
            </button>
            <button
              onClick={() => handleSort('updated_at')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                sortField === 'updated_at' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Date
            </button>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Customer & Channel</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('amount')}>
                <div className="flex items-center gap-1">
                  Amount <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="px-4 py-3">Issue & Bank</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('risk_score')}>
                <div className="flex items-center gap-1">
                  Risk Reason <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="px-4 py-3">AI Recommended Action</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="px-4 py-3">Recovered</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-500">
                  No recovery cases match the selected filter.
                </td>
              </tr>
            ) : (
              filteredCases.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-800/40 transition cursor-pointer"
                  onClick={() => onSelectCase(c)}
                >
                  {/* Customer */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{c.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{c.customer_email}</div>
                    <div className="text-[10px] text-blue-400 mt-0.5 capitalize">{c.channel} • {c.payment_method}</div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 font-semibold text-white">
                    {formatINR(c.amount)}
                  </td>

                  {/* Issue */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{c.issue_type.replace('_', ' ')}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                      {c.bank_name ? `${c.bank_name} • ` : ''}{c.failure_code}
                    </div>
                  </td>

                  {/* Risk Reason */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.risk_score >= 0.8
                              ? 'bg-red-500'
                              : c.risk_score >= 0.5
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${c.risk_score * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {c.risk_score.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* AI Recommended Action */}
                  <td className="px-4 py-3">
                    <span className="inline-block bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-700">
                      {c.recommended_action || 'AUTO_RETRY'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {getStatusBadge(c.status)}
                  </td>

                  {/* Recovered Amount */}
                  <td className="px-4 py-3 font-semibold text-emerald-400">
                    {c.recovered_amount > 0 ? formatINR(c.recovered_amount) : '₹0.00'}
                  </td>

                  {/* Last Updated */}
                  <td className="px-4 py-3 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                    {formatTimeAgo(c.updated_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {c.status === 'at_risk' || c.status === 'recovering' ? (
                        <button
                          onClick={() => onRecoverCase(c.id)}
                          disabled={isProcessingId === c.id}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded border border-blue-500/20 transition disabled:opacity-50"
                        >
                          {isProcessingId === c.id ? 'Recovering...' : 'Run AI Recovery'}
                        </button>
                      ) : null}

                      <button
                        onClick={() => onSelectCase(c)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition"
                      >
                        View Details <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
