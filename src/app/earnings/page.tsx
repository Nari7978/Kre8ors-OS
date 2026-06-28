'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { 
  DollarSign, TrendingUp, Wallet, ArrowUpRight, Percent, 
  Sliders, Plus, RefreshCw, AlertCircle, CheckCircle2, PiggyBank, Receipt, Search, X, Users
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

  // Transactions Ledger State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txSource, setTxSource] = useState('all');
  const [txDateRange, setTxDateRange] = useState('30d');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Fetch earnings and payouts
  useEffect(() => {
    if (!activeCreator) return;
    
    setTxSearch('');
    setTxSource('all');
    setTxDateRange('30d');
    
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

  // Load transactions ledger from endpoint
  useEffect(() => {
    if (!activeCreator) return;
    
    const delayDebounce = setTimeout(async () => {
      setLoadingTransactions(true);
      try {
        const query = new URLSearchParams({
          creatorId: activeCreator.id,
          search: txSearch,
          source: txSource,
          range: txDateRange,
          agencySplit: agencySplit.toString(),
          chatterSplit: chatterSplit.toString(),
        });
        const res = await fetch(`/api/earnings/transactions?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoadingTransactions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [activeCreator, txSearch, txSource, txDateRange, agencySplit, chatterSplit]);

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
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ['Transaction ID', 'Subscriber Name', 'Subscriber Username', 'Channel', 'Date', 'Gross Amount ($)', 'Net Share ($)'];
    const rows = transactions.map(tx => [
      tx.id,
      tx.fan?.displayName || 'Anonymous',
      tx.fan?.username || 'unknown',
      tx.source,
      new Date(tx.loggedAt).toISOString(),
      Number(tx.amount).toFixed(2),
      Number(tx.netAmount).toFixed(2)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_ledger_${activeCreator?.username || 'creator'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
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

        {/* Live Agency Net Profit Card */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group border-indigo-500/20">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Percent className="h-16 w-16 text-indigo-400" />
          </div>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Agency Net ({agencySplit}%)</p>
          {loadingEarnings ? (
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500 mt-2" />
          ) : (
            <h3 className="text-2xl font-bold text-indigo-400 mt-2">${(totalNetRevenue * (agencySplit / 100) * ((100 - chatterSplit) / 100)).toFixed(2)}</h3>
          )}
          <span className="text-[9px] text-zinc-500 block mt-1">Live agency profit net of chatter split</span>
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
              
              <div className="space-y-3 bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-xl text-xs">
                {/* Gross */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Gross Simulation:</span>
                  <span className="font-semibold text-zinc-200">${calcGross.toFixed(2)}</span>
                </div>

                {/* OnlyFans cut */}
                <div className="flex items-center justify-between text-zinc-500 pb-2 border-b border-zinc-800/60">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Percent className="h-3 w-3" /> OnlyFans Cut (20%):
                  </span>
                  <span>-${ofCut.toFixed(2)}</span>
                </div>

                {/* Net Pool */}
                <div className="flex items-center justify-between font-bold text-zinc-200">
                  <span>Net Payout Pool:</span>
                  <span>${netEarnings.toFixed(2)}</span>
                </div>

                {/* Dynamic visual splits summary cards */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-zinc-950/60 border border-zinc-850 p-2.5 rounded-xl">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Creator Share</span>
                    <span className="text-xs font-black text-indigo-400 block mt-1">${creatorShareVal.toFixed(2)}</span>
                    <span className="text-[8px] text-zinc-500">{(100 - agencySplit)}% of net pool</span>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-850 p-2.5 rounded-xl">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Agency Gross</span>
                    <span className="text-xs font-black text-zinc-200 block mt-1">${agencyShareVal.toFixed(2)}</span>
                    <span className="text-[8px] text-zinc-500">{agencySplit}% of net pool</span>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-850 p-2.5 rounded-xl">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Chatter Cut</span>
                    <span className="text-xs font-black text-amber-500 block mt-1">${chatterCommVal.toFixed(2)}</span>
                    <span className="text-[8px] text-zinc-500">{chatterSplit}% of agency share</span>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-850 p-2.5 rounded-xl border-emerald-500/20">
                    <span className="text-[9px] text-emerald-450 font-bold uppercase tracking-wider block">Agency Net</span>
                    <span className="text-xs font-black text-emerald-400 block mt-1">${agencyRetentionVal.toFixed(2)}</span>
                    <span className="text-[8px] text-zinc-500">Net retained profit</span>
                  </div>
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

      {/* Detailed Transaction Ledger */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
          <div>
            <h3 className="text-md font-bold text-zinc-150 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-400" />
              Subscribers Transaction Ledger
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Detailed list of individual tips, subscriptions, and PPV unlock events</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 disabled:opacity-50 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 font-bold text-[10px] uppercase tracking-wider cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-indigo-400" />
            Export CSV
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between text-xs bg-zinc-950/20 p-4 rounded-xl border border-zinc-800/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by fan name or @username..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Source:</span>
              <select
                value={txSource}
                onChange={(e) => setTxSource(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 px-3 text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer text-xs"
              >
                <option value="all">All Channels</option>
                <option value="subscription">Subscription</option>
                <option value="tip">Tips</option>
                <option value="ppv_chat">PPV Chat</option>
                <option value="ppv_post">PPV Feed Post</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Range:</span>
              <select
                value={txDateRange}
                onChange={(e) => setTxDateRange(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 px-3 text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer text-xs"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {loadingTransactions ? (
          <div className="space-y-3 py-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3.5 bg-zinc-950/20 border border-zinc-850 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-800" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-28 bg-zinc-800 rounded" />
                    <div className="h-2 w-16 bg-zinc-850 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="h-3 w-14 bg-zinc-800 rounded" />
                  <div className="h-3 w-10 bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs bg-zinc-950/10 border border-zinc-850/60 rounded-xl">
            No subscriber transactions match your search filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-850 rounded-xl bg-zinc-950/20">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 text-zinc-500 font-bold uppercase text-[9px] tracking-wider bg-zinc-950/30">
                  <th className="p-3.5">Subscriber</th>
                  <th className="p-3.5">Source Channel</th>
                  <th className="p-3.5">Transaction Date</th>
                  <th className="p-3.5 text-right">Gross Amount</th>
                  <th className="p-3.5 text-right">Net Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {transactions.map((tx) => {
                  const gross = Number(tx.amount);
                  const net = Number(tx.netAmount);
                  const sourceStyles: Record<string, string> = {
                    tip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    subscription: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    ppv_chat: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    ppv_post: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  };
                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-zinc-900/30 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-850 flex items-center justify-center overflow-hidden border border-zinc-800">
                          {tx.fan?.avatarUrl ? (
                            <img src={tx.fan.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Users className="h-4 w-4 text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-200">{tx.fan?.displayName || 'Anonymous'}</div>
                          <div className="text-[10px] text-zinc-500">@{tx.fan?.username || 'unknown'}</div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${sourceStyles[tx.source] || 'bg-zinc-800 text-zinc-400'}`}>
                          {tx.source}
                        </span>
                      </td>
                      <td className="p-3.5 text-zinc-500">{new Date(tx.loggedAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-right font-semibold text-zinc-355">${gross.toFixed(2)}</td>
                      <td className="p-3.5 text-right font-black text-emerald-400">${net.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm text-zinc-155 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-400" />
                Transaction Receipt Detail
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Fan metadata info */}
            {selectedTx.fan ? (
              <div className="flex items-center gap-3 p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                <div className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-850">
                  {selectedTx.fan.avatarUrl ? (
                    <img src={selectedTx.fan.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-5 w-5 text-zinc-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-zinc-200">{selectedTx.fan.displayName}</h4>
                  <p className="text-[10px] text-zinc-500">@{selectedTx.fan.username} • UID: {selectedTx.fanOfId || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl text-[10px] text-zinc-500 italic">
                Subscriber UID: {selectedTx.fanOfId || 'Unknown Fan'} (Profile detail not synced)
              </div>
            )}

            {/* Ledger specifics */}
            <div className="bg-zinc-950/20 border border-zinc-850 p-4 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Transaction ID:</span>
                <span className="font-mono text-[10px] font-bold text-zinc-300">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Revenue Channel:</span>
                <span className="font-bold uppercase tracking-wider text-[9px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                  {selectedTx.source}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Timestamp:</span>
                <span className="font-semibold text-zinc-300">
                  {new Date(selectedTx.loggedAt).toLocaleString()}
                </span>
              </div>
              
              <div className="border-t border-zinc-800/80 my-2 pt-2 space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Gross Amount:</span>
                  <span className="font-bold text-zinc-200">${Number(selectedTx.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>OnlyFans Cut (20%):</span>
                  <span>-${(Number(selectedTx.amount) * 0.2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-indigo-400 border-t border-zinc-900 pt-2">
                  <span>Net Payout Pool:</span>
                  <span>${Number(selectedTx.netAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedTx(null)}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 px-4 rounded-xl border border-zinc-800 font-semibold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
