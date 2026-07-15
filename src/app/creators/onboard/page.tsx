'use client';

import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { ONBOARDING_WIZARD_STEPS } from '@/types/onboarding';
import { 
  Key, Globe, ShieldCheck, CheckCircle2, AlertTriangle, 
  ArrowLeft, ArrowRight, RefreshCw, Sparkles, UserPlus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardCreatorPage() {
  const {
    currentStep,
    formData,
    nextStep,
    prevStep,
    updateFormData,
    resetWizard,
    connectionTested,
    setConnectionTested,
    connectionSuccess,
    setConnectionSuccess,
  } = useOnboardingStore();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Validate credentials step
  const isCredentialsValid = 
    formData.displayName.trim().length >= 2 &&
    formData.username.trim().length >= 2 &&
    formData.authId.trim().length > 0 &&
    formData.sessCookie.trim().length >= 10 &&
    formData.userAgent.trim().startsWith('Mozilla/');

  async function handleTestConnection() {
    setLoading(true);
    setErrorMsg('');
    try {
      // Simulate connection testing wait
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      if (!formData.sessCookie.includes('sess=') && formData.sessCookie.length < 8) {
        setConnectionSuccess(false);
        setErrorMsg('Authentication check failed. Invalid sess cookie header.');
      } else {
        setConnectionSuccess(true);
      }
      setConnectionTested(true);
    } catch (err) {
      setConnectionSuccess(false);
      setErrorMsg('Network error checking wrappers.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteOnboarding() {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/creators/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        nextStep(); // Move to confirmation
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Failed to onboard creator.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to credential manager.');
    } finally {
      setLoading(false);
    }
  }

  const renderCredentialsStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">Creator Display Name</label>
          <input
            type="text"
            placeholder="e.g. Amouranth"
            value={formData.displayName}
            onChange={(e) => updateFormData({ displayName: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">OnlyFans Username</label>
          <div className="relative">
            <span className="absolute left-3 top-3.5 text-xs text-zinc-650 font-bold">@</span>
            <input
              type="text"
              placeholder="e.g. amouranth_of"
              value={formData.username}
              onChange={(e) => updateFormData({ username: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-7 pr-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">OnlyFans Auth ID (authId)</label>
          <input
            type="text"
            placeholder="e.g. 102498751"
            value={formData.authId}
            onChange={(e) => updateFormData({ authId: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">OnlyFans BC Header (Optional)</label>
          <input
            type="text"
            placeholder="e.g. x_bc_header_hash"
            value={formData.xBcHeader}
            onChange={(e) => updateFormData({ xBcHeader: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">OnlyFans Session Cookie (sessCookie)</label>
          <textarea
            placeholder="sess=abc123xyz..."
            value={formData.sessCookie}
            onChange={(e) => updateFormData({ sessCookie: e.target.value })}
            rows={2}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-mono resize-none"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">Browser User Agent Header</label>
          <input
            type="text"
            placeholder="Mozilla/5.0..."
            value={formData.userAgent}
            onChange={(e) => updateFormData({ userAgent: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>
      </div>
    </div>
  );

  const renderProxyStep = () => (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 italic">
        Configure custom proxy tunnels to shield browser footprints. Leave empty if routing via default agency proxy clusters.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1.5 md:col-span-3">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">Proxy Hostname</label>
          <input
            type="text"
            placeholder="e.g. proxy.us-west.com"
            value={formData.proxyHost}
            onChange={(e) => updateFormData({ proxyHost: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">Port</label>
          <input
            type="text"
            placeholder="e.g. 5000"
            value={formData.proxyPort}
            onChange={(e) => updateFormData({ proxyPort: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">Proxy Username</label>
          <input
            type="text"
            placeholder="username"
            value={formData.proxyUser}
            onChange={(e) => updateFormData({ proxyUser: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">Proxy Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={formData.proxyPass}
            onChange={(e) => updateFormData({ proxyPass: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>
      </div>
    </div>
  );

  const renderTestStep = () => (
    <div className="space-y-6 text-center py-6">
      <div className="max-w-md mx-auto space-y-4">
        <p className="text-xs text-zinc-400">
          Verify session headers and routing health with OnlyFans wrappers before activating shifts dashboard.
        </p>

        <button
          type="button"
          onClick={handleTestConnection}
          disabled={loading}
          className="mx-auto flex items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-200 text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <ShieldCheck className="h-4.5 w-4.5 text-blue-400" />
          )}
          Run Connection Diagnostics
        </button>

        {connectionTested && connectionSuccess && (
          <div className="mx-auto bg-green-500/10 border border-green-500/20 text-green-400 text-xs p-4 rounded-2xl flex items-center gap-3 justify-center max-w-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>Handshake Successful! Session Active.</span>
          </div>
        )}

        {connectionTested && !connectionSuccess && (
          <div className="mx-auto bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-2xl flex items-center gap-3 justify-center max-w-sm">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>Connection check failed. Check cookies/proxy.</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="text-center py-8 space-y-5">
      <div className="h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-zinc-100">Creator Successfully Onboarded!</h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          @{formData.username} ({formData.displayName}) is now active. Chatter assignments, automations, and earnings tracker have been instantiated.
        </p>
      </div>
      <button
        onClick={() => {
          resetWizard();
          window.location.href = '/creators';
        }}
        className="bg-blue-650 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-xl text-xs transition-colors"
      >
        Return to Creator Directory
      </button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
            Onboard <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">New Creator</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Add OnlyFans account credentials and proxy setups to start shifts tracking.
          </p>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2 border-b border-zinc-900 pb-5 text-center">
        {ONBOARDING_WIZARD_STEPS.map((s, idx) => {
          const stepObj = ONBOARDING_WIZARD_STEPS.find((item) => item.step === currentStep);
          const currentIdx = stepObj ? ONBOARDING_WIZARD_STEPS.indexOf(stepObj) : 0;
          const isActive = currentStep === s.step;
          const isCompleted = idx < currentIdx;

          return (
            <div key={s.step} className="space-y-1.5">
              <span className={`text-[9px] uppercase tracking-wider font-extrabold block ${
                isActive ? 'text-blue-400' : isCompleted ? 'text-emerald-500' : 'text-zinc-650'
              }`}>
                Step {idx + 1}
              </span>
              <span className={`text-xs font-bold block ${isActive ? 'text-zinc-100 font-extrabold' : 'text-zinc-500'}`}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Container */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm relative">
        <AnimatePresence mode="wait">
          {currentStep === 'CREDENTIALS' && (
            <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderCredentialsStep()}
            </motion.div>
          )}
          {currentStep === 'PROXY' && (
            <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderProxyStep()}
            </motion.div>
          )}
          {currentStep === 'TEST_CONNECTION' && (
            <motion.div key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderTestStep()}
            </motion.div>
          )}
          {currentStep === 'CONFIRMATION' && (
            <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderConfirmationStep()}
            </motion.div>
          )}
        </AnimatePresence>

        {errorMsg && (
          <p className="text-red-400 text-xs font-semibold text-center mt-4">{errorMsg}</p>
        )}

        {/* Wizard Controls */}
        {currentStep !== 'CONFIRMATION' && (
          <div className="flex items-center justify-between border-t border-zinc-800/50 mt-6 pt-5">
            <button
              onClick={prevStep}
              disabled={currentStep === 'CREDENTIALS' || loading}
              className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            {currentStep === 'CREDENTIALS' && (
              <button
                onClick={nextStep}
                disabled={!isCredentialsValid}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-50"
              >
                Configure Proxy
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === 'PROXY' && (
              <button
                onClick={nextStep}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all"
              >
                Validate Connection
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === 'TEST_CONNECTION' && (
              <button
                onClick={handleCompleteOnboarding}
                disabled={!connectionSuccess || loading}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                Complete Onboarding
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
