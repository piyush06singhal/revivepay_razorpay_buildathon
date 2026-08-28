'use client';

import React from 'react';
import { ShieldCheck, Play, RefreshCw, Zap, Bot } from 'lucide-react';

interface HeaderProps {
  onBatchRecover: () => void;
  onResetSeed: () => void;
  isProcessingBatch: boolean;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onBatchRecover,
  onResetSeed,
  isProcessingBatch,
  isResetting,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">RevivePay</h1>
              <span className="bg-blue-950 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded border border-blue-800/60 flex items-center gap-1">
                <Bot className="w-3 h-3" /> AI Agent Ops
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Razorpay AI Buildathon 2026 • Autonomous Revenue Recovery Prototype
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onResetSeed}
            disabled={isResetting || isProcessingBatch}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            Reset Synthetic Data
          </button>

          <button
            onClick={onBatchRecover}
            disabled={isProcessingBatch || isResetting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-md shadow-blue-600/30 transition disabled:opacity-50"
          >
            {isProcessingBatch ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Executing Recovery Batch...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run AI Agent Recovery Batch
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

