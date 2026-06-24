'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { Story, MediaItem } from '@/types';
import { 
  Calendar, Clock, Plus, Trash2, Image as ImageIcon, Video as VideoIcon, 
  Play, RefreshCw, AlertCircle, CheckCircle2, Folder, X, Eye
} from 'lucide-react';

export default function StoriesPage() {
  const { activeCreator } = useGlobalStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SCHEDULED' | 'PUBLISHED'>('ALL');

  // Form State
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Media Picker state
  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultItems, setVaultItems] = useState<MediaItem[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);

  // Preset stock option helper for quick scheduling
  const stockStories = [
    { name: 'Casual Sunshine Story', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400' },
    { name: 'Night Gym Story', url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=400' },
    { name: 'Teaser Video Story', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  ];

  // Fetch stories
  const fetchStories = async () => {
    if (!activeCreator) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/stories?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [activeCreator]);

  // Fetch Vault items for media selector
  const fetchVault = async () => {
    if (!activeCreator) return;
    setLoadingVault(true);
    try {
      const res = await fetch(`/api/media?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setVaultItems(data);
      }
    } catch (err) {
      console.error('Error fetching media vault:', err);
    } finally {
      setLoadingVault(false);
    }
  };

  useEffect(() => {
    if (vaultOpen) {
      fetchVault();
    }
  }, [vaultOpen, activeCreator]);

  // Handle schedule story
  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCreator) return;
    if (!mediaUrl.trim() || !scheduledFor) {
      setErrorMsg('Please select a media file and pick a scheduling date.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setScheduling(true);

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          mediaUrl,
          scheduledFor,
        }),
      });

      if (res.ok) {
        const newStory = await res.json();
        setStories((prev) => [newStory, ...prev]);
        setMediaUrl('');
        setScheduledFor('');
        setSuccessMsg('Story scheduled successfully!');
        // Auto clear success message
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to schedule story.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to scheduling server.');
    } finally {
      setScheduling(false);
    }
  };

  // Handle cancel story
  const handleCancelStory = async (storyId: string) => {
    try {
      const res = await fetch(`/api/stories?storyId=${storyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
      }
    } catch (err) {
      console.error('Error deleting story:', err);
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

  // Filters
  const filteredStories = stories.filter((story) => {
    if (activeTab === 'ALL') return true;
    return story.status === activeTab;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-indigo-500" />
            Stories Scheduling Queue
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Publish visual 24-hour stories automatically for <strong className="text-zinc-300">@{activeCreator.username}</strong>
          </p>
        </div>
        <div className="text-xs bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg text-zinc-400 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          OnlyFans Story Engine Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Story Composer */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="h-4 w-4 text-indigo-500" />
            Schedule New Story
          </h3>

          <form onSubmit={handleSchedule} className="space-y-4">
            {/* Media URL selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 block">Story Media Asset</label>
              
              {mediaUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 aspect-video flex items-center justify-center group">
                  {mediaUrl.endsWith('.mp4') ? (
                    <video className="h-full w-full object-cover opacity-80" muted src={mediaUrl} />
                  ) : (
                    <img className="h-full w-full object-cover" src={mediaUrl} alt="selected story" />
                  )}
                  <button
                    type="button"
                    onClick={() => setMediaUrl('')}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 shadow transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-zinc-950/70 border border-zinc-800/60 px-2 py-0.5 rounded text-[10px] text-zinc-300">
                    {mediaUrl.endsWith('.mp4') ? 'Video Asset' : 'Image Asset'}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setVaultOpen(true)}
                    className="h-24 w-full border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 bg-zinc-950/40 transition-colors"
                  >
                    <Folder className="h-6 w-6 text-indigo-400 mb-1" />
                    <span className="text-xs font-semibold">Pick from Media Vault</span>
                  </button>
                  <input
                    type="url"
                    placeholder="Or paste remote image/video URL..."
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Quick stock select presets */}
            {!mediaUrl && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {stockStories.map((st, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setMediaUrl(st.url)}
                      className="text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded-full text-zinc-300 font-medium transition-all"
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Date picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 block flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                Schedule Publish Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              />
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={scheduling}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer"
            >
              {scheduling ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Add to Story Queue
            </button>
          </form>
        </div>

        {/* Right Column: Scheduled Stories List Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-800/80 w-max">
            {([
              { label: 'All Stories', value: 'ALL' },
              { label: 'Scheduled', value: 'SCHEDULED' },
              { label: 'Published', value: 'PUBLISHED' },
            ] as const).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === tab.value
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Stories Queue Grid */}
          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
              Syncing story timelines...
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="border border-dashed border-zinc-800 p-12 rounded-2xl text-center text-zinc-500 flex flex-col items-center justify-center gap-2 bg-zinc-950/20">
              <span className="p-3.5 bg-zinc-900 rounded-full border border-zinc-800/80 text-xl">🎬</span>
              <p className="font-semibold text-xs text-zinc-400">Story queue is empty</p>
              <p className="text-[11px] text-zinc-600 max-w-xs">No visual stories are currently queued for release. Fill in the composer to queue a status post.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredStories.map((story) => {
                const isVideo = story.mediaUrl.endsWith('.mp4');
                const isPub = story.status === 'PUBLISHED';
                return (
                  <div
                    key={story.id}
                    className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm relative group overflow-hidden flex gap-4 hover:border-zinc-700/80 transition-all duration-200"
                  >
                    {/* Media preview thumbnail */}
                    <div className="h-28 w-20 rounded-xl bg-zinc-950 overflow-hidden relative border border-zinc-800 flex-shrink-0 flex items-center justify-center">
                      {isVideo ? (
                        <>
                          <video src={story.mediaUrl} className="object-cover h-full w-full opacity-60" muted />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="h-6 w-6 rounded-full bg-indigo-600/90 text-white flex items-center justify-center">
                              <Play className="h-3 w-3 fill-current ml-0.5" />
                            </span>
                          </div>
                        </>
                      ) : (
                        <img src={story.mediaUrl} alt="story preview" className="object-cover h-full w-full" />
                      )}
                      
                      <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md px-1 py-0.5 rounded text-[8px] font-bold text-zinc-400">
                        {isVideo ? 'VIDEO' : 'IMAGE'}
                      </div>
                    </div>

                    {/* Details and Actions */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded border ${
                            isPub
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {story.status}
                          </span>
                          
                          {!isPub && (
                            <button
                              type="button"
                              onClick={() => handleCancelStory(story.id)}
                              className="text-zinc-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-zinc-800"
                              title="Delete/Cancel Story"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5 pt-1">
                          <Clock className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Publish Scheduled for:</span>
                        </div>
                        <p className="text-xs text-indigo-400 font-bold font-mono">
                          {new Date(story.scheduledFor).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-zinc-500 font-semibold border-t border-zinc-800/60 pt-2">
                        <span>Created: {new Date(story.createdAt).toLocaleDateString()}</span>
                        <a
                          href={story.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-bold"
                        >
                          <Eye className="h-3 w-3" /> View Asset
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Media Vault Picker Modal Drawer */}
      {vaultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-sm font-bold flex items-center gap-1.5 text-zinc-300">
                <Folder className="h-4 w-4 text-indigo-400" />
                Select Story Image/Video from Vault
              </span>
              <button 
                type="button" 
                onClick={() => setVaultOpen(false)} 
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Grid */}
            {loadingVault ? (
              <div className="py-12 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                Querying vault inventory...
              </div>
            ) : vaultItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No vault media items found. Upload assets in the Media Vault tab first.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {vaultItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setMediaUrl(item.url);
                      setVaultOpen(false);
                    }}
                    className="relative rounded-lg overflow-hidden border border-zinc-800 hover:border-indigo-500 bg-zinc-950 p-1 text-left flex flex-col gap-1 transition-all group"
                  >
                    <div className="relative aspect-video w-full rounded overflow-hidden bg-zinc-900">
                      <img 
                        src={item.thumbnail || item.url} 
                        alt={item.name} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      />
                      {item.fileType === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <Play className="h-4 w-4 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-400 truncate w-full px-0.5">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
