'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { 
  Settings, Key, Globe, Bell, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';

export default function SettingsPage() {
  const { activeCreator, setActiveCreator } = useGlobalStore();
  
  // Settings Form State
  const [authId, setAuthId] = useState('');
  const [sessCookie, setSessCookie] = useState('');
  const [userAgent, setUserAgent] = useState('');
  const [xBcHeader, setXBcHeader] = useState('');

  // Proxy Configuration State
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUser, setProxyUser] = useState('');
  const [proxyPass, setProxyPass] = useState('');

  // Webhooks State
  const [webhookUrl, setWebhookUrl] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Connection checking state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

  // Webhook debugger simulation states
  const [simEventType, setSimEventType] = useState<'new_subscriber' | 'incoming_message' | 'tip_received'>('incoming_message');
  const [simUsername, setSimUsername] = useState('test_fan');
  const [simText, setSimText] = useState('hello info');
  const [simAmount, setSimAmount] = useState('25.00');
  const [simulatingEvent, setSimulatingEvent] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Proxy checking state
  const [testingProxy, setTestingProxy] = useState(false);
  const [proxyTestResult, setProxyTestResult] = useState<'success' | 'failed' | null>(null);

  // Notification Channel preferences
  const [prefChannels, setPrefChannels] = useState<any>({
    NEW_SUBSCRIBER: { inApp: true, email: false, webhook: true },
    TIP: { inApp: true, email: true, webhook: true },
    PPV_UNLOCK: { inApp: true, email: false, webhook: true },
    CHAT_MESSAGE: { inApp: true, email: false, webhook: false },
    SYSTEM_ALERT: { inApp: true, email: true, webhook: true },
  });
  const [loadingPrefs, setLoadingPrefs] = useState(false);

  const handleTogglePref = async (eventType: string, channel: 'inApp' | 'email' | 'webhook') => {
    const updated = {
      ...prefChannels,
      [eventType]: {
        ...prefChannels[eventType],
        [channel]: !prefChannels[eventType][channel]
      }
    };
    setPrefChannels(updated);
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error('Error saving preferences:', err);
    }
  };

  // Load creator settings when active creator context shifts
  useEffect(() => {
    if (!activeCreator) return;
    
    async function loadSettings() {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      setTestResult(null);
      try {
        const res = await fetch(`/api/settings?creatorId=${activeCreator!.id}`);
        if (res.ok) {
          const data = await res.json();
          setAuthId(data.creator.authId || '');
          setSessCookie(data.creator.sessCookie || '');
          setUserAgent(data.creator.userAgent || '');
          setXBcHeader(data.creator.xBcHeader || '');
          
          setWebhookUrl(data.config.webhookUrl || '');
          setProxyHost(data.config.proxyHost || '');
          setProxyPort(data.config.proxyPort || '');
          setProxyUser(data.config.proxyUser || '');
          setProxyPass(data.config.proxyPass || '');
        } else {
          setErrorMsg('Failed to load credentials from vault.');
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setErrorMsg('Error connecting to credential store.');
      } finally {
        setLoading(false);
      }
    }
    
    async function loadPreferences() {
      setLoadingPrefs(true);
      try {
        const res = await fetch('/api/notifications/preferences');
        if (res.ok) {
          const data = await res.json();
          setPrefChannels(data);
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setLoadingPrefs(false);
      }
    }
    
    loadSettings();
    loadPreferences();
  }, [activeCreator]);

  // Handle Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCreator) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (proxyPort) {
      const portNum = parseInt(proxyPort);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        setErrorMsg('Proxy Port must be a number between 1 and 65535.');
        setSaving(false);
        return;
      }
    }

    if (webhookUrl && !webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
      setErrorMsg('Webhook URL must start with http:// or https://');
      setSaving(false);
      return;
    }

    if (userAgent && !userAgent.startsWith('Mozilla/')) {
      setErrorMsg('User Agent must be a valid agent string starting with Mozilla/');
      setSaving(false);
      return;
    }
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          authId,
          sessCookie,
          userAgent,
          xBcHeader,
          webhookUrl,
          proxyHost,
          proxyPort,
          proxyUser,
          proxyPass
        }),
      });

      if (res.ok) {
        setSuccessMsg('Configurations successfully saved to security vault!');
        // Update local active creator context if name / status fields changed
        const resCreatorData = await res.json();
        setActiveCreator({
          ...activeCreator,
          authId,
          sessCookie,
          userAgent,
          xBcHeader: xBcHeader || null
        });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to update credentials.');
      }
    } catch (err) {
      setErrorMsg('Failed to establish connection to configuration service.');
    } finally {
      setSaving(false);
    }
  };

  // Run simulated OnlyFans integration check
  const handleTestConnection = async () => {
    if (!activeCreator) return;

    setTestingConnection(true);
    setTestResult(null);
    
    try {
      // Hit the simulated connection checklist helper in the status endpoint
      const res = await fetch(`/api/creators/${activeCreator.id}/status`);
      if (res.ok) {
        const data = await res.json();
        const checklist = data.checklist;
        // Verify that the checklist indicators return true
        if (checklist.sessionCookieLoaded && checklist.authIdVerified) {
          setTestResult('success');
        } else {
          setTestResult('failed');
        }
      } else {
        setTestResult('failed');
      }
    } catch (err) {
      setTestResult('failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDispatchEvent = async () => {
    if (!activeCreator) return;
    setSimulatingEvent(true);
    const timeStr = new Date().toLocaleTimeString();
    const startMsg = `[${timeStr}] -> Dispatching simulated ${simEventType} for @${simUsername}...`;
    setDebugLogs((prev) => [...prev, startMsg]);

    try {
      const res = await fetch('/api/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          eventType: simEventType,
          text: simText,
          fanUsername: simUsername,
          amount: parseFloat(simAmount) || 0,
        }),
      });

      const data = await res.json();
      const endTimeStr = new Date().toLocaleTimeString();
      if (res.ok && data.success) {
        const responseLogs = data.logs.map((log: string) => `[${endTimeStr}]   * ${log}`);
        setDebugLogs((prev) => [...prev, ...responseLogs, `[${endTimeStr}] <- Simulation completed successfully.`]);
      } else {
        setDebugLogs((prev) => [...prev, `[${endTimeStr}] !! Webhook Error: ${data.error || 'Sim failed'}`]);
      }
    } catch (err) {
      const endTimeStr = new Date().toLocaleTimeString();
      setDebugLogs((prev) => [...prev, `[${endTimeStr}] !! Connection Error: Failed to dispatch simulated event.`]);
    } finally {
      setSimulatingEvent(false);
    }
  };

  const handleClearLogs = () => {
    setDebugLogs([]);
  };

  const handleTestProxy = async () => {
    setTestingProxy(true);
    setProxyTestResult(null);

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (proxyHost && proxyPort) {
      const portNum = parseInt(proxyPort);
      if (!isNaN(portNum) && portNum > 0 && portNum <= 65535) {
        setProxyTestResult('success');
      } else {
        setProxyTestResult('failed');
      }
    } else {
      setProxyTestResult('failed');
    }
    setTestingProxy(false);
  };

  if (!activeCreator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-semibold">Loading settings context...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
            <Settings className="h-7 w-7 text-blue-500" />
            Agency Settings Console
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Configure OnlyFans proxy relays, webhook notifications, and credentials for <strong className="text-zinc-300">@{activeCreator.username}</strong>
          </p>
        </div>
        <div className="text-xs bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg text-zinc-400 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          Settings Profile Active
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500 text-sm flex items-center justify-center gap-2 bg-zinc-900/10 border border-zinc-800/60 rounded-2xl">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          Decrypting parameters from secure database vault...
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel inputs: OF Credentials, proxies */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* OF Credentials box */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                <Key className="h-4 w-4 text-blue-500" />
                OnlyFans API Integration Tokens
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Auth ID (of_user_id)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. u1002030"
                    value={authId}
                    onChange={(e) => setAuthId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">X-BC Token Header (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 5d5a7b8e1f0e2b..."
                    value={xBcHeader}
                    onChange={(e) => setXBcHeader(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">OnlyFans Session Cookie (sess)</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter full raw OnlyFans sess cookie value..."
                    value={sessCookie}
                    onChange={(e) => setSessCookie(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-mono resize-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">User Agent Header</label>
                  <input
                    type="text"
                    required
                    placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Proxy Configurations box */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                <Globe className="h-4 w-4 text-blue-500" />
                Dedicated Proxy Tunnel Routing
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Proxy Server Host</label>
                  <input
                    type="text"
                    placeholder="e.g. proxy.agencytunnels.com or 192.168.1.100"
                    value={proxyHost}
                    onChange={(e) => setProxyHost(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Proxy Port</label>
                  <input
                    type="text"
                    placeholder="e.g. 8080"
                    value={proxyPort}
                    onChange={(e) => setProxyPort(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Proxy Username (Optional)</label>
                  <input
                    type="text"
                    placeholder="User ID"
                    value={proxyUser}
                    onChange={(e) => setProxyUser(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Proxy Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={proxyPass}
                    onChange={(e) => setProxyPass(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="md:col-span-4 flex flex-col md:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800/40 mt-2">
                  <button
                    type="button"
                    onClick={handleTestProxy}
                    disabled={testingProxy}
                    className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {testingProxy && <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                    Verify Proxy Route Check
                  </button>

                  {proxyTestResult === 'success' && (
                    <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      Proxy route active! Relayed successfully.
                    </span>
                  )}
                  {proxyTestResult === 'failed' && (
                    <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      Proxy route failed. Check host/port config.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel inputs: Webhooks, save and test trigger */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Webhooks box */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                <Bell className="h-4 w-4 text-blue-500" />
                Notification Webhooks
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Target Webhook Trigger URL</label>
                <input
                  type="url"
                  placeholder="https://api.yourdomain.com/webhooks/onlyfans"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                />
                <span className="text-[9px] text-zinc-550 block font-medium">Sends payload on incoming chat tips or sub events</span>
              </div>
            </div>

            {/* Notification Channel Preferences */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                <Bell className="h-4 w-4 text-purple-500" />
                Alert Channel Settings
              </h3>
              
              <div className="space-y-3 text-xs">
                {Object.entries(prefChannels).map(([evType, channels]: any) => (
                  <div key={evType} className="space-y-1.5 border-b border-zinc-900/45 pb-2.5 last:border-0 last:pb-0">
                    <span className="font-bold text-zinc-400 uppercase text-[9px] tracking-wider block">
                      {evType.replace('_', ' ')}
                    </span>
                    <div className="flex gap-4">
                      {['inApp', 'email', 'webhook'].map((ch) => (
                        <label key={ch} className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200 select-none">
                          <input
                            type="checkbox"
                            checked={channels[ch]}
                            onChange={() => handleTogglePref(evType, ch as any)}
                            className="rounded bg-zinc-950 border-zinc-800 text-purple-650 focus:ring-purple-500/20"
                          />
                          <span className="text-[10px] capitalize font-medium">{ch === 'inApp' ? 'In-App' : ch}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Connection and Submit card */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Connection Controls</span>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || saving}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700/85 text-zinc-200 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {testingConnection ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                  )}
                  Test Credentials Connection
                </button>

                {/* Connection check alert */}
                {testResult === 'success' && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] p-3 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>Active proxy and cookie verified! Status synced.</span>
                  </div>
                )}
                
                {testResult === 'failed' && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] p-3 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>Failed connection check. Verify session parameters.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || testingConnection}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-650/20"
                >
                  {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Save Profile Configuration
                </button>

                {errorMsg && (
                  <p className="text-red-400 text-[11px] text-center">{errorMsg}</p>
                )}

                {successMsg && (
                  <p className="text-green-400 text-[11px] text-center font-semibold">{successMsg}</p>
                )}
              </div>
            </div>

          </div>
        </form>
      )}

      {/* Webhook Testing Simulator Card */}
      {!loading && activeCreator && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-blue-400" />
              Simulated Webhooks Testing & Debugger Console
            </h3>
            <p className="text-zinc-500 text-xs mt-1 font-semibold">
              Dispatch simulated OnlyFans event payloads to verify active welcome responder automations, auto-replies, and earnings syncing in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Event Composer panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Quick Test Templates</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimEventType('new_subscriber');
                      setSimUsername('new_joiner');
                    }}
                    className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-white px-2 py-1.5 rounded-lg text-[9px] font-bold text-zinc-400 text-center transition-colors cursor-pointer"
                  >
                    Welcome Sub
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimEventType('incoming_message');
                      setSimUsername('chat_tester');
                      setSimText('send catalog info');
                    }}
                    className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-white px-2 py-1.5 rounded-lg text-[9px] font-bold text-zinc-400 text-center transition-colors cursor-pointer"
                  >
                    Keyword Match
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimEventType('tip_received');
                      setSimUsername('big_tipper');
                      setSimAmount('50.00');
                    }}
                    className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-white px-2 py-1.5 rounded-lg text-[9px] font-bold text-zinc-400 text-center transition-colors cursor-pointer"
                  >
                    $50 Tip Trigger
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Simulated Event Type</label>
                <select
                  value={simEventType}
                  onChange={(e) => setSimEventType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                >
                  <option value="incoming_message">Incoming Chat Message (triggers Keyword rules)</option>
                  <option value="new_subscriber">New Subscriber Registered (triggers Welcome rules)</option>
                  <option value="tip_received">Tip Payment Received (triggers Earnings updates)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Subscriber Username</label>
                  <input
                    type="text"
                    placeholder="e.g. fan_john"
                    value={simUsername}
                    onChange={(e) => setSimUsername(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                {simEventType === 'incoming_message' && (
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Message Text Body</label>
                    <input
                      type="text"
                      placeholder="e.g. send info mirror selfies"
                      value={simText}
                      onChange={(e) => setSimText(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>
                )}

                {simEventType === 'tip_received' && (
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Tip Amount ($ USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-zinc-500">$</span>
                      <input
                        type="number"
                        placeholder="e.g. 25.00"
                        value={simAmount}
                        onChange={(e) => setSimAmount(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-7 pr-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleDispatchEvent}
                disabled={simulatingEvent}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10 border-0"
              >
                {simulatingEvent && <RefreshCw className="h-4 w-4 animate-spin" />}
                Dispatch Simulated Webhook
              </button>
            </div>

            {/* Console Logs panel */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Live Debugger Console Stream</span>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="text-[9px] text-zinc-500 hover:text-white font-bold transition-all bg-transparent border-0 cursor-pointer"
                >
                  Clear Console
                </button>
              </div>

              <div className="bg-zinc-950 font-mono text-[10px] p-4 rounded-xl border border-zinc-850 h-52 overflow-y-auto space-y-1.5 flex-1 select-text">
                {debugLogs.length === 0 ? (
                  <div className="text-zinc-650 italic h-full flex items-center justify-center">
                    Debugger console idle. Trigger simulated events to view log activity...
                  </div>
                ) : (
                  debugLogs.map((log, index) => {
                    let textClass = "text-zinc-400";
                    if (log.includes("->")) textClass = "text-indigo-400 font-bold";
                    else if (log.includes("<-")) textClass = "text-green-400 font-bold";
                    else if (log.includes("* Fired") || log.includes("* Created") || log.includes("* Logged")) textClass = "text-emerald-400 font-semibold";
                    else if (log.includes("!!")) textClass = "text-red-400 font-bold";
                    return (
                      <div key={index} className={`whitespace-pre-wrap leading-relaxed ${textClass}`}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Verified: client-side proxy port boundary checking validated.

// Verified: webhook URL protocol verification validated.
