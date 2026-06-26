'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { 
  BarChart3, TrendingUp, Users, DollarSign, 
  Percent, RefreshCw, Calendar, ShieldAlert, Trophy, Clock
} from 'lucide-react';

interface ConversionData {
  totalSent: number;
  totalUnlocked: number;
  conversionRate: number;
  priceTiers: { tier: string; sent: number; unlocked: number; rate: number }[];
}

interface CohortData {
  cohort: string;
  size: number;
  retention: number[];
}

interface OperatorData {
  id: string;
  name: string;
  email: string;
  role: string;
  totalShifts: number;
  totalHours: number;
  totalRevenue: number;
  averageRevenuePerShift: number;
  averageRevenuePerHour: number;
}

export default function AnalyticsPage() {
  const { activeCreator } = useGlobalStore();
  const [loading, setLoading] = useState(false);
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [operatorData, setOperatorData] = useState<OperatorData[]>([]);

  useEffect(() => {
    if (!activeCreator) return;
    loadAnalytics();
  }, [activeCreator]);

  async function loadAnalytics() {
    if (!activeCreator) return;
    setLoading(true);
    try {
      // Fetch conversions
      const convRes = await fetch(`/api/analytics/conversions?creatorId=${activeCreator.id}`);
      const convData = convRes.ok ? await convRes.json() : null;
      setConversionData(convData);

      // Fetch retention
      const retRes = await fetch(`/api/analytics/retention?creatorId=${activeCreator.id}`);
      const retData = retRes.ok ? await retRes.json() : [];
      setCohortData(retData);

      // Fetch operators
      const opRes = await fetch('/api/analytics/operators');
      const opData = opRes.ok ? await opRes.json() : [];
      setOperatorData(opData);
    } catch (err) {
      console.error('Error loading analytics data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate overall metrics
  const avgRetentionRate = cohortData.length > 0
    ? Math.round(cohortData.reduce((acc, c) => acc + (c.retention[4] || 0), 0) / cohortData.length)
    : 0;

  const totalOperatorRevenue = operatorData.reduce((acc, op) => acc + op.totalRevenue, 0);

  return (
    <div className="p-8 space-y-8 bg-zinc-950 text-white min-h-screen font-sans">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Agency Analytics Dashboard
          </h1>
          <p className="text-zinc-500 text-xs font-semibold mt-1">
            Real-time cohort retention metrics, message conversions, and chatter shift performance logs.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading || !activeCreator}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:border-zinc-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {!activeCreator ? (
        <div className="border border-dashed border-zinc-800 rounded-3xl p-12 text-center text-zinc-500">
          <ShieldAlert className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
          <h3 className="font-bold text-zinc-400 mb-1">No Active Creator Selected</h3>
          <p className="text-xs max-w-sm mx-auto">Please select a creator from the global top menu to load metrics.</p>
        </div>
      ) : (
        <>
          {/* Key Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PPV Conversion Card */}
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">PPV Conversion Rate</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Percent className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <span className="text-3xl font-black text-zinc-100">
                  {conversionData ? `${conversionData.conversionRate.toFixed(1)}%` : '0.0%'}
                </span>
                <p className="text-zinc-500 text-[10px] font-bold">
                  {conversionData ? `${conversionData.totalUnlocked} unlocked out of ${conversionData.totalSent} sent` : 'No messages sent'}
                </p>
              </div>
            </div>

            {/* Retention Card */}
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Active Cohort Retention</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <span className="text-3xl font-black text-zinc-100">{avgRetentionRate}%</span>
                <p className="text-zinc-500 text-[10px] font-bold">Average Month 4+ retention rate</p>
              </div>
            </div>

            {/* Shift Logs Card */}
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Operator Managed Sales</span>
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <DollarSign className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <span className="text-3xl font-black text-zinc-100">
                  ${totalOperatorRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-zinc-500 text-[10px] font-bold">Combined logged shift revenues</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
