'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { Post, MediaItem } from '@/types';
import { 
  Calendar, Clock, Plus, Folder, Trash2, Globe, Lock, 
  AlertCircle, RefreshCw, X, CheckCircle2
} from 'lucide-react';

export default function ContentQueuePage() {
  const { activeCreator } = useGlobalStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'published' | 'draft'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Form Composer states
  const [postText, setPostText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [postPrice, setPostPrice] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [composerStatus, setComposerStatus] = useState<'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>('PUBLISHED');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Media selector modal
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!activeCreator) return;
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/posts?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, [activeCreator]);

  const loadMedia = useCallback(async () => {
    if (!activeCreator) return;
    setLoadingMedia(true);
    try {
      const res = await fetch(`/api/media?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data);
      }
    } catch (err) {
      console.error('Error loading media vault items:', err);
    } finally {
      setLoadingMedia(false);
    }
  }, [activeCreator]);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (active) {
        loadPosts();
        loadMedia();
      }
    });

    return () => {
      active = false;
    };
  }, [loadPosts, loadMedia]);

  // Handle post scheduling submit
  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCreator) return;

    if (!postText.trim() && selectedMedia.length === 0) {
      setFormError('Post text or attached media is required.');
      return;
    }

    setFormError('');
    setFormLoading(true);

    try {
      let scheduledFor: string | null = null;
      let targetStatus = composerStatus;

      if (scheduleDate && scheduleTime) {
        scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
        targetStatus = 'SCHEDULED';
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          text: postText.trim(),
          mediaUrls: selectedMedia,
          scheduledFor,
          price: parseFloat(postPrice) || 0.00,
          status: targetStatus,
        }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts((prev) => [newPost, ...prev]);
        
        // Reset form
        setPostText('');
        setSelectedMedia([]);
        setPostPrice('');
        setScheduleDate('');
        setScheduleTime('');
        setComposerStatus('PUBLISHED');
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Failed to schedule post.');
      }
    } catch (err) {
      setFormError('Failed to connect to backend server.');
    } finally {
      setFormLoading(false);
    }
  };

  // Simulate immediate publishing for a scheduled post
  const handlePublishNow = async (postId: string) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          action: 'publish_now',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      }
    } catch (err) {
      console.error('Error simulating immediate publish:', err);
    }
  };

  // Delete/Cancel a scheduled post
  const handleCancelPost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts?postId=${postId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (err) {
      console.error('Error cancelling scheduled post:', err);
    }
  };

  // Media picker toggles
  const handleToggleMediaSelect = (url: string) => {
    if (selectedMedia.includes(url)) {
      setSelectedMedia((prev) => prev.filter((u) => u !== url));
    } else {
      setSelectedMedia((prev) => [...prev, url]);
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

  // Group scheduled posts by local date string (YYYY-MM-DD)
  const postsByDate = React.useMemo(() => {
    const groups: Record<string, Post[]> = {};
    posts.forEach((post) => {
      if (post.scheduledFor) {
        const dateKey = formatDateKey(new Date(post.scheduledFor));
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(post);
      }
    });
    return groups;
  }, [posts]);

  // Filter posts list
  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'all') return true;
    return p.status.toLowerCase() === activeTab;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
            Publishing Scheduler
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Plan, queue, and schedule content publishing for <strong className="text-zinc-300">@{activeCreator.username}</strong>
          </p>
        </div>
        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-blue-650 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-blue-650 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Post Composer */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-500" />
              Compose New Post
            </h3>

            <form onSubmit={handleComposeSubmit} className="space-y-4">
              {/* Post Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Post Caption / Text</label>
                <textarea
                  placeholder="What's on your mind today? Write post caption here..."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 resize-none min-h-[120px] font-sans"
                />
              </div>

              {/* Media Attachments selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400">Media Attachments</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaModalOpen(true);
                      loadMedia();
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase flex items-center gap-1.5"
                  >
                    <Folder className="h-3.5 w-3.5" />
                    Attach from Vault
                  </button>
                </div>

                {selectedMedia.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                    {selectedMedia.map((url, i) => (
                      <div key={i} className="relative h-14 w-14 border border-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={url} className="object-cover h-full w-full" alt="attachment" />
                        <button
                          type="button"
                          onClick={() => setSelectedMedia((prev) => prev.filter((u) => u !== url))}
                          className="absolute top-0.5 right-0.5 bg-red-600/90 text-white rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl text-zinc-600 text-xs flex flex-col items-center justify-center gap-1.5 bg-zinc-950/20">
                    <span>No media attached yet</span>
                  </div>
                )}
              </div>

              {/* Schedule Parameters */}
              <div className="border-t border-zinc-800/60 pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* Time */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-500" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 leading-normal italic">
                  * Select both Date and Time to schedule for a future date. Leave blank to publish immediately.
                </div>
              </div>

              {/* PPV Option */}
              <div className="border-t border-zinc-800/60 pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                    PPV Post Price
                  </label>
                </div>
                <div className="relative flex-1 max-w-[140px]">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={postPrice}
                    onChange={(e) => setPostPrice(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 pl-6 text-xs focus:outline-none focus:border-blue-500 text-amber-400 font-bold"
                  />
                </div>
                <div className="text-[10px] text-zinc-500 font-medium">
                  If set, subscribers will have to purchase this feed post to view the attached media assets.
                </div>
              </div>

              {/* Status Select (DRAFT vs PUBLISHED) when not scheduling */}
              {(!scheduleDate || !scheduleTime) && (
                <div className="border-t border-zinc-800/60 pt-4 space-y-2">
                  <label className="text-xs font-bold text-zinc-400">Post Action / State</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setComposerStatus('PUBLISHED')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        composerStatus === 'PUBLISHED'
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      Publish Immediately
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerStatus('DRAFT')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        composerStatus === 'DRAFT'
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Error */}
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                {formLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                {scheduleDate && scheduleTime ? 'Schedule Post Queue' : composerStatus === 'DRAFT' ? 'Save Draft Post' : 'Publish Post Now'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Scheduled List / Queue */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tab selectors */}
          <div className="flex border-b border-zinc-800/60 gap-1.5">
            {[
              { id: 'all', label: 'All Posts' },
              { id: 'scheduled', label: 'Scheduled Queue' },
              { id: 'published', label: 'Published Logs' },
              { id: 'draft', label: 'Drafts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | 'scheduled' | 'published' | 'draft')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 tracking-wide transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Posts list */}
          {loadingPosts ? (
            <div className="py-12 text-center text-zinc-500 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              Syncing scheduled publisher queue...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
              <span className="text-xl">📅</span>
              <p className="font-semibold text-zinc-400">No posts in this category</p>
              <p className="text-zinc-600">Compose and save a new post to schedule it here.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
              {filteredPosts.map((post) => {
                const isScheduled = post.status === 'SCHEDULED';
                const isPublished = post.status === 'PUBLISHED';
                const isDraft = post.status === 'DRAFT';
                const isPPV = post.price > 0;

                return (
                  <div
                    key={post.id}
                    className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/60 transition-all duration-150 flex flex-col md:flex-row gap-4 justify-between"
                  >
                    <div className="flex-1 space-y-3 min-w-0">
                      {/* Status row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isPublished
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : isScheduled
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                        }`}>
                          {post.status}
                        </span>

                        {isPPV && (
                          <span className="text-[9px] uppercase font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            PPV: ${post.price.toFixed(2)}
                          </span>
                        )}

                        {post.scheduledFor && (
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-zinc-500" />
                            Schedule: {new Date(post.scheduledFor).toLocaleString()}
                          </span>
                        )}
                        
                        {post.ofPostId && (
                          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                            ID: {post.ofPostId}
                          </span>
                        )}
                      </div>

                      {/* Content Caption */}
                      {post.text && (
                        <p className="text-xs text-zinc-200 leading-relaxed font-sans font-medium whitespace-pre-line">
                          {post.text}
                        </p>
                      )}

                      {/* Attachments preview row */}
                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {post.mediaUrls.map((url, idx) => (
                            <div key={idx} className="h-16 w-16 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 relative">
                              <img src={url} className="object-cover h-full w-full" alt="preview" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Panel */}
                    <div className="flex md:flex-col items-end md:justify-center gap-2 flex-wrap border-t md:border-t-0 border-zinc-800/40 pt-3 md:pt-0">
                      {isScheduled && (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePublishNow(post.id)}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 shadow-md shadow-blue-500/10 cursor-pointer"
                          >
                            <Globe className="h-3 w-3" /> Publish Now
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleCancelPost(post.id)}
                            className="bg-zinc-800 hover:bg-red-950/40 hover:text-red-400 border border-zinc-700 hover:border-red-500/20 text-zinc-300 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" /> Cancel
                          </button>
                        </>
                      )}
                      
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => handleCancelPost(post.id)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" /> Delete Draft
                        </button>
                      )}

                      {isPublished && (
                        <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1 bg-green-500/5 px-2 py-1 rounded-lg border border-green-500/10">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          Live on OnlyFans
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vault Media Selector Modal */}
      {mediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-bold text-zinc-100">Attach Media from Vault</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setMediaModalOpen(false)}
                className="text-zinc-500 hover:text-white rounded-lg p-1 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Media list */}
            {loadingMedia ? (
              <div className="py-12 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                Loading vault...
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No vault media items found. Go to the Media Vault tab to upload assets first.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {mediaItems.map((item) => {
                  const isSelected = selectedMedia.includes(item.url);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleToggleMediaSelect(item.url)}
                      className={`relative rounded-xl overflow-hidden border p-1 text-left flex flex-col gap-1 transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                      }`}
                    >
                      <img src={item.thumbnail || item.url} alt={item.name} className="h-20 w-full object-cover rounded-lg" />
                      <span className="text-[10px] text-zinc-400 truncate w-full px-1">{item.name}</span>
                      <span className="text-[9px] bg-zinc-800 px-1 py-0.2 rounded w-max text-zinc-300 uppercase self-end font-semibold">{item.folderName}</span>
                      
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white rounded-full p-0.5 shadow-md">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-semibold">
                Selected {selectedMedia.length} assets
              </span>
              <button
                type="button"
                onClick={() => setMediaModalOpen(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer"
              >
                Confirm Attachments
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateString: string;
}

function getDaysForMonth(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();

  // Prev month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
      dateString: formatDateKey(d),
    });
  }

  // Current month days
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: isSameDay(d, new Date()),
      dateString: formatDateKey(d),
    });
  }

  // Next month padding
  const totalCells = days.length > 35 ? 42 : 35;
  const remainingCells = totalCells - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
      dateString: formatDateKey(d),
    });
  }

  return days;
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function formatDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
