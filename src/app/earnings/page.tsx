'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { 
  DollarSign, TrendingUp, Wallet, ArrowUpRight, Percent, 
  Sliders, Plus, RefreshCw, AlertCircle, CheckCircle2, PiggyBank, Receipt
} from 'lucide-react';

export default function EarningsPage() {
  const { activeCreator } = useGlobalStore();
  
  // Earnings State
  const [earningsSummary, setEarningsSummary] = useState<any>(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);

  // Payouts State
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  // Request Payout Form State
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('Bank Transfer (US ACH)');
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');

  // Interactive Commission Calculator State
  const [calcGross, setCalcGross] = useState<number>(5000);
  const [agencySplit, setAgencySplit] = useState<number>(50); // % of net split
  const [chatterSplit, setChatterSplit] = useState<number>(10); // % of agency split

  // Fetch earnings and payouts
  useEffect(() => {
    if (!activeCreator) return;
    
    async function loadData() {
      setLoadingEarnings(true);
      setLoadingPayouts(true);
      try {
        // Load regular earnings summary
        const resEarn = await fetch(`/api/earnings?creatorId=${activeCreator!.id}`);
        if (resEarn.ok) {
          const dataEarn = await resEarn.json();
          setEarningsSummary(dataEarn.summary);
        }

        // Load payouts log
        const resPay = await fetch(`/api/earnings/payouts?creatorId=${activeCreator!.id}`);
        if (resPay.ok) {
          const dataPay = await resPay.json();
          setPayouts(dataPay);
        }
      } catch (err) {
        console.error('Error loading earnings statistics:', err);
      } finally {
        setLoadingEarnings(false);
        setLoadingPayouts(false);
      }
    }
    
    loadData();
  }, [activeCreator]);

  // Request payout
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCreator) return;
    
    const amt = parseFloat(payoutAmount);
    if (!payoutAmount || isNaN(amt) || amt <= 0) {
      setPayoutError('Please provide a valid payout amount.');
      return;
    }

    setPayoutError('');
    setPayoutSuccess('');
    setSubmittingPayout(true);

    try {
      const res = await fetch('/api/earnings/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          amount: amt,
          payoutMethod,
        }),
      });

      if (res.ok) {
        const newPayout = await res.json();
        setPayouts((prev) => [newPayout, ...prev]);
        setPayoutAmount('');
        setPayoutSuccess('Simulated payout requested successfully!');
        // Refresh payout lists
        setTimeout(() => setPayoutSuccess(''), 4000);
      } else {
        const data = await res.json();
        setPayoutError(data.error || 'Failed to submit request.');
      }
    } catch (err) {
      setPayoutError('Failed to connect to payout server.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (!activeCreator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-semibold">Loading Creator Context...</p>
      </div>
    );
  }

  // Calculation formulas for splits
  const ofCut = calcGross * 0.20;
  const netEarnings = calcGross * 0.80; // OnlyFans payouts 80% to creators
  const agencyShareVal = netEarnings * (agencySplit / 100);
  const creatorShareVal = netEarnings * ((100 - agencySplit) / 100);
  const chatterCommVal = agencyShareVal * (chatterSplit / 100);
  const agencyRetentionVal = agencyShareVal - chatterCommVal;

  const totalGrossRevenue = earningsSummary ? earningsSummary.totalRevenue : 0;
  const totalNetRevenue = earningsSummary ? earningsSummary.totalNet : 0;
  const pendingPayoutTotal = payouts
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);
  const processedPayoutTotal = payouts
    .filter(p => p.status === 'PROCESSED')
    .reduce((sum, p) => sum + p.amount, 0);

  // Available to payout is totalNet minus total withdrawn
  const availablePayout = Math.max(0, totalNetRevenue - pendingPayoutTotal - processedPayoutTotal);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-emerald-500" />
            Agency Earnings & Payout Ledger
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Financial analytics, splits distribution, and cash flows for <strong className="text-zinc-300">@{activeCreator.username}</strong>
          </p>
        </div>
        <div className="text-xs bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg text-zinc-400 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Financial Ledger Synced
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Gross */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <TrendingUp className="h-16 w-16 text-emerald-500" />
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gross Earnings (30d)</p>
          {loadingEarnings ? (
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500 mt-2" />
          ) : (
            <h3 className="text-2xl font-bold text-zinc-100 mt-2">${totalGrossRevenue.toFixed(2)}</h3>
          )}
          <span className="text-[9px] text-zinc-500 block mt-1">Includes tips, PPV, and subs</span>
        </div>

        {/* Net */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Wallet className="h-16 w-16 text-emerald-500" />
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Net (After 20% OF Cut)</p>
          {loadingEarnings ? (
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500 mt-2" />
          ) : (
            <h3 className="text-2xl font-bold text-zinc-100 mt-2">${totalNetRevenue.toFixed(2)}</h3>
          )}
          <span className="text-[9px] text-zinc-500 block mt-1">Standard 80% onlyfans share</span>
        </div>

        {/* Available payout */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group border-emerald-500/20">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <PiggyBank className="h-16 w-16 text-emerald-400" />
          </div>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Available Payout Balance</p>
          {loadingEarnings || loadingPayouts ? (
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500 mt-2" />
          ) : (
            <h3 className="text-2xl font-bold text-emerald-400 mt-2">${availablePayout.toFixed(2)}</h3>
          )}
          <span className="text-[9px] text-zinc-500 block mt-1">Ready for agency withdrawal</span>
        </div>

        {/* Pending Payout */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Receipt className="h-16 w-16 text-amber-500" />
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Pending Payouts</p>
          {loadingPayouts ? (
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500 mt-2" />
          ) : (
            <h3 className="text-2xl font-bold text-amber-400 mt-2">${pendingPayoutTotal.toFixed(2)}</h3>
          )}
          <span className="text-[9px] text-zinc-500 block mt-1">Awaiting processing</span>
        </div>
      </div>

      {/* Main Sections grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Middle: Payout Logs & Withdrawal form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Simulate Withdrawal Form */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              Simulate Payout Request
            </h3>

            <form onSubmit={handleRequestPayout} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Payout Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-zinc-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500.00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-6 pr-3 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Bank Transfer (US ACH)">Bank Transfer (US ACH)</option>
                  <option value="Paxum">Paxum</option>
                  <option value="Cosmopayment">Cosmopayment</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingPayout}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {submittingPayout ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Request Cashout
              </button>
            </form>

            {payoutError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{payoutError}</span>
              </div>
            )}

            {payoutSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{payoutSuccess}</span>
              </div>
            )}
          </div>

          {/* Historical Payout Ledger */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-500" />
              Payout Ledger History
            </h3>

            {loadingPayouts ? (
              <div className="py-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
                Syncing transaction ledger...
              </div>
            ) : payouts.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-4 text-center">
                No payout transactions recorded for this creator.
              </p>
            ) : (
              <div className="overflow-x-auto border border-zinc-800/60 rounded-xl bg-zinc-950/20">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/60 text-zinc-500 font-bold uppercase text-[9px] tracking-wider bg-zinc-950/30">
                      <th className="p-3">Reference ID</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Requested</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {payouts.map((pay) => (
                      <tr key={pay.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="p-3 font-mono font-semibold text-zinc-400">{pay.referenceId}</td>
                        <td className="p-3 text-zinc-300 font-medium">{pay.payoutMethod}</td>
                        <td className="p-3">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                            pay.status === 'PROCESSED' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-500">{new Date(pay.requestedAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right font-bold text-zinc-100">${pay.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Interactive Split Commission Calculator */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3.5">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-500" />
              Commission Calculator
            </h3>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Splits Sandbox
            </span>
          </div>

          <div className="space-y-5">
            {/* Input Gross */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>Gross Target Revenue:</span>
                <span className="text-emerald-400 text-sm font-mono">${calcGross.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={calcGross}
                onChange={(e) => setCalcGross(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Range Slider for Agency Split */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>Agency Split Percentage (of Net):</span>
                <span className="text-emerald-400 font-semibold">{agencySplit}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={agencySplit}
                onChange={(e) => setAgencySplit(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[9px] text-zinc-500 font-semibold">
                <span>Creator: {100 - agencySplit}%</span>
                <span>Agency: {agencySplit}%</span>
              </div>
            </div>

            {/* Range Slider for Chatter split */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>Chatter Commission (of Agency Share):</span>
                <span className="text-emerald-400 font-semibold">{chatterSplit}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={chatterSplit}
                onChange={(e) => setChatterSplit(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-zinc-500 block">Calculated as direct chatter shift incentive</span>
            </div>

            {/* Split Results ledger */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Financial Distribution Splits</span>
              
              <div className="space-y-2 bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-xl text-xs space-y-2.5">
                {/* Gross */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Gross Simulation:</span>
                  <span className="font-semibold text-zinc-200">${calcGross.toFixed(2)}</span>
                </div>

                {/* OnlyFans cut */}
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Percent className="h-3 w-3" /> OnlyFans Cut (20%):
                  </span>
                  <span>-${ofCut.toFixed(2)}</span>
                </div>

                {/* Net Pool */}
                <div className="flex items-center justify-between font-bold border-b border-zinc-800/80 pb-2 text-zinc-200">
                  <span>Net Payout Pool:</span>
                  <span>${netEarnings.toFixed(2)}</span>
                </div>

                {/* Creator share */}
                <div className="flex items-center justify-between font-medium">
                  <span className="text-zinc-400">Creator Share ({100 - agencySplit}%):</span>
                  <span className="text-indigo-400 font-semibold">${creatorShareVal.toFixed(2)}</span>
                </div>

                {/* Agency share */}
                <div className="flex items-center justify-between font-medium">
                  <span className="text-zinc-400">Agency Share ({agencySplit}%):</span>
                  <span className="text-zinc-200 font-semibold">${agencyShareVal.toFixed(2)}</span>
                </div>

                {/* Chatter share */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>↳ Chatter Commission ({chatterSplit}%):</span>
                  <span>-${chatterCommVal.toFixed(2)}</span>
                </div>

                {/* Agency Net */}
                <div className="flex items-center justify-between font-bold border-t border-zinc-800/60 pt-2.5 text-emerald-400">
                  <span>Agency Net Profit:</span>
                  <span>${agencyRetentionVal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
