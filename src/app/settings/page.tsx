'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { 
  Settings, Key, Globe, Bell, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck,
  Edit2, Trash2, Plus, ArrowUp, ArrowDown, UserCheck
} from 'lucide-react';

export default function SettingsPage() {
  const { activeCreator, setActiveCreator, activeSubMenu, setActiveSubMenu } = useGlobalStore();
  
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

  // OnlyFans Settings state and handlers
  const [settingsTab, setSettingsTab] = useState<'agency' | 'onlyfans'>('agency');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [welcomeMessageEnabled, setWelcomeMessageEnabled] = useState(true);
  const [blockedCountries, setBlockedCountries] = useState('');
  const [drmEnabled, setDrmEnabled] = useState(true);
  const [loadingOF, setLoadingOF] = useState(false);

  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileAbout, setProfileAbout] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState(9.99);
  const [socialMediaButtons, setSocialMediaButtons] = useState<any[]>([]);

  const [usernameToCheck, setUsernameToCheck] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const [newSocialLabel, setNewSocialLabel] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [editingSocialLabel, setEditingSocialLabel] = useState('');
  const [editingSocialUrl, setEditingSocialUrl] = useState('');

  // Data Exports state and handlers
  const [dataExportsList, setDataExportsList] = useState<any[]>([]);
  const [loadingExports, setLoadingExports] = useState(false);
  const [newExportType, setNewExportType] = useState('messages');

  const loadDataExports = async () => {
    if (!activeCreator) return;
    setLoadingExports(true);
    try {
      const res = await fetch(`/api/settings/exports?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setDataExportsList(data || []);
      }
    } catch (err) {
      console.error('Error loading data exports:', err);
    } finally {
      setLoadingExports(false);
    }
  };

  const handleCreateExport = async () => {
    if (!activeCreator) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/settings/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          action: 'create',
          type: newExportType
        })
      });
      if (res.ok) {
        setSuccessMsg('Data export record created successfully!');
        loadDataExports();
      } else {
        setErrorMsg('Failed to create data export.');
      }
    } catch (err) {
      console.error('Error creating data export:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStartExport = async (exportId: string) => {
    if (!activeCreator) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/settings/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          action: 'start',
          exportId
        })
      });
      if (res.ok) {
        setSuccessMsg('Data export processing started!');
        loadDataExports();
        setTimeout(() => loadDataExports(), 5500);
      } else {
        setErrorMsg('Failed to start data export.');
      }
    } catch (err) {
      console.error('Error starting data export:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelExport = async (exportId: string) => {
    if (!activeCreator) return;
    if (!confirm('Are you sure you want to cancel or delete this data export?')) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/settings/exports?creatorId=${activeCreator.id}&exportId=${exportId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSuccessMsg('Data export cancelled/deleted successfully!');
        loadDataExports();
      } else {
        setErrorMsg('Failed to cancel data export.');
      }
    } catch (err) {
      console.error('Error cancelling data export:', err);
    } finally {
      setSaving(false);
    }
  };

  const loadOnlyFansSettings = async () => {
    if (!activeCreator) return;
    setLoadingOF(true);
    try {
      const res = await fetch(`/api/settings/onlyfans?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setWelcomeMessage(data.welcomeMessage || '');
        setWelcomeMessageEnabled(data.welcomeMessageEnabled ?? true);
        setBlockedCountries(data.blockedCountries?.join(', ') || '');
        setDrmEnabled(data.drmEnabled ?? true);
        setProfileDisplayName(data.profile?.displayName || '');
        setProfileAbout(data.profile?.about || '');
        setProfileWebsite(data.profile?.website || '');
        setProfileLocation(data.profile?.location || '');
        setSubscriptionPrice(data.subscriptionPrice ?? 9.99);
        setSocialMediaButtons(data.socialMediaButtons || []);
      }
    } catch (err) {
      console.error('Error loading OnlyFans settings:', err);
    } finally {
      setLoadingOF(false);
    }
  };

  useEffect(() => {
    if (activeCreator && settingsTab === 'onlyfans') {
      loadOnlyFansSettings();
    }
  }, [activeCreator, settingsTab]);

  useEffect(() => {
    if (activeCreator && activeSubMenu && [
      'List Data Exports', 'Create Data Export', 'Start Data Export', 'Get Data Export Status', 'Cancel Data Export'
    ].includes(activeSubMenu)) {
      loadDataExports();
    }
  }, [activeCreator, activeSubMenu]);

  useEffect(() => {
    if (activeSubMenu && [
      'Get Settings', 'Update Profile', 'Check Username Availability', 'Update Subscription Price',
      'Get Blocked Countries', 'Update Blocked Countries', 'Enable/Disable Welcome Message',
      'Get Welcome Message', 'Update Welcome Message', 'List Social Media Buttons',
      'Add Social Media Button', 'Update Social Media Button', 'Delete Social Media Button', 'Reorder Social Media Buttons',
      'Get DRM Status', 'Enable/Disable DRM',
      'List Data Exports', 'Create Data Export', 'Start Data Export', 'Get Data Export Status', 'Cancel Data Export'
    ].includes(activeSubMenu)) {
      setSettingsTab('onlyfans');
    }
  }, [activeSubMenu]);

  const handleSaveOnlyFansSetting = async (type: string, value: any) => {
    if (!activeCreator) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/settings/onlyfans', {
        method: type === 'blocked-countries' || type === 'update-social-btn' ? 'PUT' : 
                type === 'subscription-price' || type === 'toggle-welcome' || type === 'drm' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          type,
          welcomeMessage: type === 'welcome' ? value : undefined,
          profile: type === 'profile' ? value : undefined,
          blockedCountries: type === 'blocked-countries' ? value.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean) : undefined,
          price: type === 'subscription-price' ? Number(value) : undefined,
          enabled: type === 'toggle-welcome' ? Boolean(value) : undefined,
          drmEnabled: type === 'drm' ? Boolean(value) : undefined,
          label: type === 'add-social-btn' || type === 'update-social-btn' ? value.label : undefined,
          url: type === 'add-social-btn' || type === 'update-social-btn' ? value.url : undefined,
          buttonId: type === 'update-social-btn' ? value.buttonId : undefined,
          buttonIds: type === 'reorder-social-btns' ? value : undefined
        }),
      });
      if (res.ok) {
        setSuccessMsg(`OnlyFans setting updated successfully!`);
        loadOnlyFansSettings();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to update OnlyFans setting.');
      }
    } catch (err) {
      setErrorMsg('Error connecting to backend API.');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckUsername = async () => {
    if (!usernameToCheck.trim()) return;
    setUsernameStatus('checking');
    try {
      const res = await fetch('/api/settings/onlyfans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'check-username',
          username: usernameToCheck.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
      } else {
        setUsernameStatus('idle');
      }
    } catch (err) {
      console.error('Error checking username:', err);
      setUsernameStatus('idle');
    }
  };

  const handleDeleteSocialBtn = async (buttonId: string) => {
    if (!activeCreator) return;
    if (!confirm('Are you sure you want to delete this social link?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/onlyfans?creatorId=${activeCreator.id}&buttonId=${buttonId}&type=delete-social-btn`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSuccessMsg('Social link deleted successfully!');
        loadOnlyFansSettings();
      } else {
        setErrorMsg('Failed to delete social link.');
      }
    } catch (err) {
      console.error('Error deleting social link:', err);
    } finally {
      setSaving(false);
    }
  };

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

      {/* Secondary Settings Tabs */}
      <div className="flex gap-4 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setSettingsTab('agency')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            settingsTab === 'agency'
              ? 'bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30 shadow-md shadow-[#7C5CFC]/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Agency Core Settings
        </button>
        <button
          onClick={() => setSettingsTab('onlyfans')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            settingsTab === 'onlyfans'
              ? 'bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30 shadow-md shadow-[#7C5CFC]/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          OnlyFans Options (Welcome, DRM, Countries)
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500 text-sm flex items-center justify-center gap-2 bg-zinc-900/10 border border-zinc-800/60 rounded-2xl">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          Decrypting parameters from secure database vault...
        </div>
      ) : (
        <>
        {settingsTab === 'agency' && (
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
      {!loading && activeCreator && settingsTab === 'agency' && (
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

      {settingsTab === 'onlyfans' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
          {/* Active Settings Panel based on activeSubMenu */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. GET SETTINGS (Summary / Overview) */}
            {(!activeSubMenu || activeSubMenu === 'Get Settings') && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                  <Settings className="h-4 w-4 text-blue-500" />
                  OnlyFans Account Settings Summary [GET]
                </h3>
                
                {loadingOF ? (
                  <div className="py-12 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-blue-500" /></div>
                ) : (
                  <div className="space-y-4 text-xs font-semibold text-zinc-400">
                    <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-550 uppercase font-black block">Profile Display Name</span>
                        <span className="text-zinc-200">{profileDisplayName || 'Not Set'}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-550 uppercase font-black block">Subscription Price</span>
                        <span className="text-emerald-400 font-extrabold">${subscriptionPrice.toFixed(2)} / Month</span>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] text-zinc-550 uppercase font-black block">About Bio</span>
                        <p className="text-zinc-200 font-medium leading-relaxed">{profileAbout || 'No description set.'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-550 uppercase font-black block">Website</span>
                        <span className="text-blue-400 underline truncate block">{profileWebsite || 'Not Set'}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-550 uppercase font-black block">Location</span>
                        <span className="text-zinc-200">{profileLocation || 'Not Set'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-950/20 border border-zinc-850 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] text-zinc-550 uppercase font-black block">DRM Status</span>
                        <span className={`text-[10px] uppercase font-black ${drmEnabled ? 'text-green-400' : 'text-red-400'}`}>
                          {drmEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="bg-zinc-950/20 border border-zinc-850 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] text-zinc-550 uppercase font-black block">Welcome Message Template</span>
                        <span className={`text-[10px] uppercase font-black ${welcomeMessageEnabled ? 'text-green-400' : 'text-red-400'}`}>
                          {welcomeMessageEnabled ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={loadOnlyFansSettings}
                      className="py-2.5 px-4 bg-zinc-950 border border-zinc-850 text-zinc-250 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full hover:border-zinc-700 cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh Settings Details [GET]
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. UPDATE PROFILE */}
            {activeSubMenu === 'Update Profile' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                  <Settings className="h-4 w-4 text-blue-500" />
                  Update Profile Details [POST]
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Display Name</label>
                    <input
                      type="text"
                      value={profileDisplayName}
                      onChange={(e) => setProfileDisplayName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">About biography</label>
                    <textarea
                      rows={4}
                      value={profileAbout}
                      onChange={(e) => setProfileAbout(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Website URL</label>
                      <input
                        type="url"
                        value={profileWebsite}
                        onChange={(e) => setProfileWebsite(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Location</label>
                      <input
                        type="text"
                        value={profileLocation}
                        onChange={(e) => setProfileLocation(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveOnlyFansSetting('profile', {
                      displayName: profileDisplayName,
                      about: profileAbout,
                      website: profileWebsite,
                      location: profileLocation
                    })}
                    disabled={saving}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg border-0"
                  >
                    {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                    Update Profile Details [POST]
                  </button>
                </div>
              </div>
            )}

            {/* 3. CHECK USERNAME AVAILABILITY */}
            {activeSubMenu === 'Check Username Availability' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  Check Username Availability [POST]
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Username to query</label>
                    <div className="flex gap-2">
                      <span className="bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-550 font-bold flex items-center border-r-0 rounded-r-none select-none">
                        @
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. sophiasweet_new"
                        value={usernameToCheck}
                        onChange={(e) => {
                          setUsernameToCheck(e.target.value);
                          setUsernameStatus('idle');
                        }}
                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl rounded-l-none py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>
                  </div>

                  {usernameStatus === 'checking' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] p-3 rounded-xl flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                      <span>Checking database and OnlyFans username records...</span>
                    </div>
                  )}

                  {usernameStatus === 'available' && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] p-3 rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span>✓ Username <strong>@{usernameToCheck}</strong> is available for claim!</span>
                    </div>
                  )}

                  {usernameStatus === 'taken' && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] p-3 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span>✗ Username <strong>@{usernameToCheck}</strong> is already taken.</span>
                    </div>
                  )}

                  <button
                    onClick={handleCheckUsername}
                    disabled={!usernameToCheck.trim() || usernameStatus === 'checking'}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg border-0"
                  >
                    Check Availability [POST]
                  </button>
                </div>
              </div>
            )}

            {/* 4. UPDATE SUBSCRIPTION PRICE */}
            {activeSubMenu === 'Update Subscription Price' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                  <Settings className="h-4 w-4 text-blue-500" />
                  Update Monthly Subscription Price [PATCH]
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Subscription Cost (USD per Month)</label>
                    <div className="flex gap-2">
                      <span className="bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3.5 text-xs text-zinc-550 font-bold flex items-center border-r-0 rounded-r-none select-none">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="4.99"
                        max="49.99"
                        value={subscriptionPrice}
                        onChange={(e) => setSubscriptionPrice(parseFloat(e.target.value) || 0)}
                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl rounded-l-none py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-black"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-550 italic block mt-1">Minimum price is $4.99, max is $49.99 matching OnlyFans guidelines.</span>
                  </div>

                  <button
                    onClick={() => handleSaveOnlyFansSetting('subscription-price', subscriptionPrice)}
                    disabled={saving}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg border-0"
                  >
                    {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                    Update Subscription Price [PATCH]
                  </button>
                </div>
              </div>
            )}

            {/* 5. GET BLOCKED COUNTRIES */}
            {activeSubMenu === 'Get Blocked Countries' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                  <Globe className="h-4 w-4 text-amber-500" />
                  Get Blocked Countries [GET]
                </h3>
                
                <div className="space-y-4 text-xs font-medium text-zinc-400">
                  <p className="text-[10px] text-zinc-550 italic font-semibold">Countries currently blocked from accessing your profile:</p>
                  {blockedCountries.trim() ? (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {blockedCountries.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean).map((code) => (
                        <span key={code} className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                          {code}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No countries are currently restricted.</p>
                  )}
                </div>
              </div>
            )}

            {/* 5.1 UPDATE BLOCKED COUNTRIES */}
            {activeSubMenu === 'Update Blocked Countries' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                  <Globe className="h-4 w-4 text-amber-500" />
                  Update Blocked Countries [PUT]
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">ISO Country Codes (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. US, CA, FR, DE"
                      value={blockedCountries}
                      onChange={(e) => setBlockedCountries(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  <button
                    onClick={() => handleSaveOnlyFansSetting('blocked-countries', blockedCountries)}
                    disabled={saving}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg border-0"
                  >
                    {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                    Update Blocked Countries [PUT]
                  </button>
                </div>
              </div>
            )}

            {/* 6. ENABLE/DISABLE WELCOME MESSAGE */}
            {activeSubMenu === 'Enable/Disable Welcome Message' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                  <Bell className="h-4 w-4 text-emerald-500" />
                  Enable/Disable Welcome Message [PATCH]
                </h3>
                
                <div className="flex items-center justify-between bg-zinc-950/40 p-4 rounded-xl border border-zinc-850">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">Automatic Welcome Responder</span>
                    <span className="text-[10px] text-zinc-550 italic font-semibold">Toggles welcome template dispatching for new subscribers.</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      const nextVal = !welcomeMessageEnabled;
                      setWelcomeMessageEnabled(nextVal);
                      handleSaveOnlyFansSetting('toggle-welcome', nextVal);
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      welcomeMessageEnabled ? 'bg-emerald-500' : 'bg-zinc-800'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      welcomeMessageEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* 6.1 GET WELCOME MESSAGE */}
            {activeSubMenu === 'Get Welcome Message' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                  <Bell className="h-4 w-4 text-emerald-500" />
                  Get Welcome Message Template [GET]
                </h3>
                
                <div className="space-y-4">
                  <span className="text-[10px] text-zinc-550 italic font-semibold">Current welcome response content template:</span>
                  <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap">
                    {welcomeMessage || 'No welcome message configured.'}
                  </div>
                </div>
              </div>
            )}

            {/* 6.2 UPDATE WELCOME MESSAGE */}
            {activeSubMenu === 'Update Welcome Message' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                  <Bell className="h-4 w-4 text-emerald-500" />
                  Update Welcome Message Template [POST]
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Welcome Message Text Template</label>
                    <textarea
                      rows={5}
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-sans leading-relaxed resize-none"
                    />
                  </div>

                  <button
                    onClick={() => handleSaveOnlyFansSetting('welcome', welcomeMessage)}
                    disabled={saving}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg border-0"
                  >
                    {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                    Update Welcome Message [POST]
                  </button>
                </div>
              </div>
            )}
            {activeSubMenu === 'List Social Media Buttons' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <Settings className="h-4 w-4 text-blue-500" />
                    List Social Media Buttons [GET]
                  </h3>
                  <p className="text-[10px] text-zinc-550 italic font-semibold mt-1">View active profile links visible under subscriber page headers.</p>
                </div>

                {loadingOF ? (
                  <div className="py-6 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-blue-500" /></div>
                ) : (
                  <div className="space-y-2">
                    {socialMediaButtons.length > 0 ? (
                      socialMediaButtons
                        .sort((a, b) => a.order - b.order)
                        .map((btn) => (
                          <div key={btn.id} className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl flex justify-between items-center">
                            <div>
                              <span className="text-xs font-black text-zinc-200 uppercase tracking-wide block">{btn.label}</span>
                              <span className="text-[10px] text-zinc-500 font-semibold truncate block max-w-xs">{btn.url}</span>
                            </div>
                            <span className="text-[9px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">ORDER: {btn.order}</span>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-6 text-zinc-550 text-xs italic">No social media links configured.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 7.1 ADD SOCIAL MEDIA BUTTON */}
            {activeSubMenu === 'Add Social Media Button' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <Plus className="h-4 w-4 text-blue-500" />
                    Add Social Media Button [POST]
                  </h3>
                </div>

                <div className="bg-zinc-950/40 border border-zinc-850/80 p-4 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      type="text"
                      placeholder="Link Label (e.g. Fanvue)"
                      value={newSocialLabel}
                      onChange={(e) => setNewSocialLabel(e.target.value)}
                      className="bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold animate-none"
                    />
                    <input
                      type="url"
                      placeholder="Link URL (https://...)"
                      value={newSocialUrl}
                      onChange={(e) => setNewSocialUrl(e.target.value)}
                      className="bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newSocialLabel.trim() || !newSocialUrl.trim()) return;
                      const label = newSocialLabel.trim();
                      const url = newSocialUrl.trim();
                      setNewSocialLabel('');
                      setNewSocialUrl('');
                      await handleSaveOnlyFansSetting('add-social-btn', { label, url });
                    }}
                    disabled={!newSocialLabel.trim() || !newSocialUrl.trim()}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Social Button [POST]
                  </button>
                </div>
              </div>
            )}

            {/* 7.2 UPDATE SOCIAL MEDIA BUTTON */}
            {activeSubMenu === 'Update Social Media Button' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <Edit2 className="h-4 w-4 text-blue-500" />
                    Update Social Media Button [PUT]
                  </h3>
                </div>

                <div className="space-y-4">
                  {socialMediaButtons.length > 0 ? (
                    socialMediaButtons.map((btn) => (
                      <div key={btn.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-3">
                        {editingSocialId === btn.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={editingSocialLabel}
                                onChange={(e) => setEditingSocialLabel(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
                              />
                              <input
                                type="url"
                                value={editingSocialUrl}
                                onChange={(e) => setEditingSocialUrl(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingSocialId(null)}
                                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!editingSocialLabel.trim() || !editingSocialUrl.trim()) return;
                                  setEditingSocialId(null);
                                  await handleSaveOnlyFansSetting('update-social-btn', {
                                    buttonId: editingSocialId,
                                    label: editingSocialLabel.trim(),
                                    url: editingSocialUrl.trim()
                                  });
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer border-0"
                              >
                                Save Updates [PUT]
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black text-zinc-200 uppercase tracking-wide block">{btn.label}</span>
                              <span className="text-[10px] text-zinc-500 font-semibold truncate block max-w-xs">{btn.url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSocialId(btn.id);
                                setEditingSocialLabel(btn.label);
                                setEditingSocialUrl(btn.url);
                              }}
                              className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[10px] font-extrabold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" /> Edit
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-zinc-550 text-xs italic">No buttons available to update.</div>
                  )}
                </div>
              </div>
            )}

            {/* 7.3 DELETE SOCIAL MEDIA BUTTON */}
            {activeSubMenu === 'Delete Social Media Button' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    Delete Social Media Button [DELETE]
                  </h3>
                </div>

                <div className="space-y-3">
                  {socialMediaButtons.length > 0 ? (
                    socialMediaButtons.map((btn) => (
                      <div key={btn.id} className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-zinc-250 uppercase tracking-wide block">{btn.label}</span>
                          <span className="text-[10px] text-zinc-500 font-semibold truncate block max-w-xs">{btn.url}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSocialBtn(btn.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-extrabold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete [DELETE]
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-zinc-550 text-xs italic">No buttons available to delete.</div>
                  )}
                </div>
              </div>
            )}

            {/* 7.4 REORDER SOCIAL MEDIA BUTTONS */}
            {activeSubMenu === 'Reorder Social Media Buttons' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <Settings className="h-4 w-4 text-blue-500" />
                    Reorder Social Media Buttons [POST]
                  </h3>
                  <p className="text-[10px] text-zinc-550 italic font-semibold mt-1">Use arrows to prioritize display hierarchy.</p>
                </div>

                <div className="space-y-2">
                  {socialMediaButtons.length > 0 ? (
                    socialMediaButtons
                      .sort((a, b) => a.order - b.order)
                      .map((btn, index) => (
                        <div key={btn.id} className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-zinc-200 uppercase tracking-wide block">{btn.label}</span>
                            <span className="text-[10px] text-zinc-550 font-semibold truncate block max-w-xs">{btn.url}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              disabled={index === 0}
                              onClick={async () => {
                                const copy = [...socialMediaButtons];
                                const temp = copy[index - 1];
                                copy[index - 1] = copy[index];
                                copy[index] = temp;
                                setSocialMediaButtons(copy);
                                await handleSaveOnlyFansSetting('reorder-social-btns', copy.map(b => b.id));
                              }}
                              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 p-2 rounded-lg disabled:opacity-30 cursor-pointer text-xs"
                            >
                              Move Up ↑
                            </button>
                            <button
                              disabled={index === socialMediaButtons.length - 1}
                              onClick={async () => {
                                const copy = [...socialMediaButtons];
                                const temp = copy[index + 1];
                                copy[index + 1] = copy[index];
                                copy[index] = temp;
                                setSocialMediaButtons(copy);
                                await handleSaveOnlyFansSetting('reorder-social-btns', copy.map(b => b.id));
                              }}
                              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 p-2 rounded-lg disabled:opacity-30 cursor-pointer text-xs"
                            >
                              Move Down ↓
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-6 text-zinc-550 text-xs italic">No buttons available to reorder.</div>
                  )}
                </div>
              </div>
            )}

            {/* 8. DRM PROTECTION STATUS */}
            {activeSubMenu === 'Get DRM Status' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    DRM Protection Status [GET]
                  </h3>
                  <p className="text-[10px] text-zinc-550 italic font-semibold mt-1">Real-time decryption compliance and shield integrity diagnostics.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-zinc-950/20 border border-zinc-850 p-4 rounded-xl text-xs font-semibold text-zinc-400 space-y-2.5">
                    <div className="flex justify-between">
                      <span>DRM Engine Status</span>
                      <span className={drmEnabled ? 'text-green-400 font-extrabold' : 'text-zinc-500'}>
                        {drmEnabled ? '✓ ONLINE & PROTECTING' : '✗ STANDBY'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dynamic Watermark</span>
                      <span className="text-zinc-300">{drmEnabled ? 'ENABLED (@username)' : 'DISABLED'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Endpoint Code</span>
                      <span className="font-mono text-[10px] text-zinc-500">GET /settings/drm</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8.1 CONFIGURE DRM SHIELDING */}
            {activeSubMenu === 'Enable/Disable DRM' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Configure DRM Shielding [PATCH]
                  </h3>
                  <p className="text-[10px] text-zinc-555 italic font-semibold mt-1">Restrict media file downloads and enforce browser capture prevention.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-zinc-950/40 p-4 rounded-xl border border-zinc-850">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">DRM Media Shielding</span>
                      <span className="text-[10px] text-zinc-550 font-semibold italic">Enforces dynamic watermarks and blocks third-party video downloaders.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDrmEnabled(!drmEnabled)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-bold cursor-pointer ${
                        drmEnabled ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {drmEnabled ? 'Disable Shield' : 'Enable Shield'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 9. LIST DATA EXPORTS */}
            {activeSubMenu === 'List Data Exports' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-800/60 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-500" />
                      List Data Exports [GET]
                    </h3>
                    <p className="text-[10px] text-zinc-550 italic font-semibold mt-1">Available data archive backup files.</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadDataExports}
                    className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingExports ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingExports ? (
                  <div className="py-8 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-blue-500" /></div>
                ) : dataExportsList.length > 0 ? (
                  <div className="space-y-2.5">
                    {dataExportsList.map((exp) => (
                      <div key={exp.id} className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <span className="text-xs font-black text-zinc-200 uppercase tracking-wider block">{exp.type} export</span>
                          <span className="text-[9px] text-zinc-550 block font-bold">Created: {new Date(exp.createdAt).toLocaleDateString()}</span>
                        </div>
                        {exp.status === 'completed' && exp.downloadUrl && (
                          <a
                            href={exp.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-green-600/10 hover:bg-green-600/25 border border-green-500/30 text-green-400 text-[10px] font-bold px-3 py-1.5 rounded-lg text-center"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-550 text-xs italic">No data export files found.</div>
                )}
              </div>
            )}

            {/* 9.1 CREATE DATA EXPORT */}
            {activeSubMenu === 'Create Data Export' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <Settings className="h-4 w-4 text-blue-500" />
                    Create Data Export [POST]
                  </h3>
                  <p className="text-[10px] text-zinc-550 italic font-semibold mt-1">Configure profile quick archive compilation parameter.</p>
                </div>

                <div className="bg-zinc-955 border border-zinc-850/80 p-4 rounded-xl space-y-3.5">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Request New Archive Export</span>
                  <div className="flex gap-3">
                    <select
                      value={newExportType}
                      onChange={(e) => setNewExportType(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold py-2 px-3 text-zinc-300 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="messages">Direct Chat Messages Archive</option>
                      <option value="earnings">Financial & Payout Ledger</option>
                      <option value="users">Subscribers / Fans CRM List</option>
                      <option value="media">Uploaded Video & Image Library</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleCreateExport}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer border-0"
                    >
                      Create Export
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 9.2 START DATA EXPORT */}
            {activeSubMenu === 'Start Data Export' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <Settings className="h-4 w-4 text-blue-500" />
                    Start Pending Data Export [POST]
                  </h3>
                </div>

                {dataExportsList.filter(e => e.status === 'pending').length > 0 ? (
                  <div className="space-y-2.5">
                    {dataExportsList
                      .filter(e => e.status === 'pending')
                      .map((exp) => (
                        <div key={exp.id} className="bg-zinc-950 border border-zinc-855 p-3.5 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-zinc-200 uppercase block">{exp.type} export</span>
                            <span className="text-[9px] text-zinc-550 block">Status: pending</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartExport(exp.id)}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Start Export [POST]
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-550 text-xs italic">No pending export jobs found. Use 'Create Data Export' first.</div>
                )}
              </div>
            )}

            {/* 9.3 GET DATA EXPORT STATUS */}
            {activeSubMenu === 'Get Data Export Status' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <Settings className="h-4 w-4 text-blue-500" />
                    Data Export Status Monitor [GET]
                  </h3>
                </div>

                {dataExportsList.length > 0 ? (
                  <div className="space-y-2.5">
                    {dataExportsList.map((exp) => (
                      <div key={exp.id} className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-zinc-200 uppercase block">{exp.type} export</span>
                          <span className="text-[9px] text-zinc-500">Created: {new Date(exp.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-lg border ${
                          exp.status === 'completed'
                            ? 'text-green-400 bg-green-500/10 border-green-500/20'
                            : exp.status === 'processing'
                            ? 'text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse'
                            : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                        }`}>
                          {exp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-555 text-xs italic">No active data export status logs.</div>
                )}
              </div>
            )}

            {/* 9.4 CANCEL DATA EXPORT */}
            {activeSubMenu === 'Cancel Data Export' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    Cancel/Delete Data Export [DELETE]
                  </h3>
                </div>

                {dataExportsList.length > 0 ? (
                  <div className="space-y-2.5">
                    {dataExportsList.map((exp) => (
                      <div key={exp.id} className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-zinc-200 uppercase block">{exp.type} export</span>
                          <span className="text-[9px] text-zinc-500">Status: {exp.status}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCancelExport(exp.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-extrabold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer"
                        >
                          Cancel [DELETE]
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-550 text-xs italic">No data export jobs to cancel.</div>
                )}
              </div>
            )}
          </div>

          {/* Right Status Card Overview */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800/60 pb-3">
              OnlyFans Settings Console
            </h3>
            
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between items-center bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-850">
                <span className="text-zinc-400">Subscription price</span>
                <span className="text-emerald-400 font-black">${subscriptionPrice}</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-850">
                <span className="text-zinc-400">Blocked Countries</span>
                <span className="text-zinc-250 font-black bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  {blockedCountries.split(',').map(s=>s.trim()).filter(Boolean).length}
                </span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-850">
                <span className="text-zinc-400">Social Media Buttons</span>
                <span className="text-zinc-250 font-black bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  {socialMediaButtons.length}
                </span>
              </div>

              {/* DRM Protection Quick Toggle */}
              <div className="bg-zinc-950/30 p-3 rounded-xl border border-zinc-850 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-350 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    DRM Protection
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !drmEnabled;
                      setDrmEnabled(nextVal);
                      handleSaveOnlyFansSetting('drm', nextVal);
                    }}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors cursor-pointer ${
                      drmEnabled ? 'bg-emerald-500' : 'bg-zinc-800'
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      drmEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}







