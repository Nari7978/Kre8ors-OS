'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { MediaItem } from '@/types';
import { 
  Folder, Plus, Search, Image, Video, 
  Upload, AlertCircle, RefreshCw, X, Play
} from 'lucide-react';

export default function MediaVaultPage() {
  const { activeCreator } = useGlobalStore();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering & Search states
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Modal Upload Simulation state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [folderNameInput, setFolderNameInput] = useState('');
  const [customSizeMB, setCustomSizeMB] = useState('1.5');
  const [validationError, setValidationError] = useState('');

  // Default stock media items to make simulation easy/fun
  const stockMediaOptions = [
    {
      name: 'glamour_dress_purple.jpg',
      url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=400',
      type: 'image' as const,
      folder: 'Outfits',
    },
    {
      name: 'backstage_mirror_selfie.jpg',
      url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400',
      type: 'image' as const,
      folder: 'Casual',
    },
    {
      name: 'morning_coffee_vlog.mp4',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      type: 'video' as const,
      folder: 'Vlogs',
    },
    {
      name: 'poolside_sunsets.jpg',
      url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=400',
      type: 'image' as const,
      folder: 'Casual',
    },
  ];

  useEffect(() => {
    let active = true;

    const fetchMedia = async () => {
      if (!activeCreator) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/media?creatorId=${activeCreator.id}`);
        if (res.ok && active) {
          const data = await res.json();
          setMediaItems(data);
        }
      } catch (err) {
        console.error('Error loading media:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    Promise.resolve().then(() => {
      fetchMedia();
    });

    return () => {
      active = false;
    };
  }, [activeCreator]);

  // Auto-populate form when user selects a stock item
  const handleSelectStock = (option: typeof stockMediaOptions[0]) => {
    setFileName(option.name);
    setFileUrl(option.url);
    setFileType(option.type);
    setFolderNameInput(option.folder);
    setCustomSizeMB(option.type === 'video' ? '15.4' : '1.8');
  };

  const handleSimulateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCreator) return;

    if (!fileName.trim() || !fileUrl.trim() || !folderNameInput.trim()) {
      setValidationError('All fields are required.');
      return;
    }

    setValidationError('');
    setUploadLoading(true);
    try {
      const sizeBytes = Math.round(parseFloat(customSizeMB) * 1024 * 1024) || 1024 * 1024;
      
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          name: fileName.trim(),
          url: fileUrl.trim(),
          fileType,
          fileSize: sizeBytes,
          folderName: folderNameInput.trim(),
        }),
      });

      if (res.ok) {
        const newAsset = await res.json();
        setMediaItems((prev) => [newAsset, ...prev]);
        setUploadOpen(false);
        // Reset form
        setFileName('');
        setFileUrl('');
        setFolderNameInput('');
        setCustomSizeMB('1.5');
      } else {
        const errData = await res.json();
        setValidationError(errData.error || 'Failed to upload media item.');
      }
    } catch (err) {
      setValidationError('Failed to connect to upload server.');
    } finally {
      setUploadLoading(false);
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

  // Get distinct folders from creator's media items
  const folderSet = new Set<string>();
  mediaItems.forEach(item => {
    if (item.folderName) {
      folderSet.add(item.folderName);
    }
  });
  const folders = ['All', ...Array.from(folderSet)];

  // Filter items based on sidebar select, search query, and type select
  const filteredItems = mediaItems.filter(item => {
    const matchesFolder = selectedFolder === 'All' || item.folderName === selectedFolder;
    const matchesType = selectedType === 'All' || item.fileType === selectedType.toLowerCase();
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.folderName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesType && matchesSearch;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-zinc-950 overflow-hidden text-white w-full h-full">
      {/* Sidebar Folders list */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900/20 flex flex-col p-5 space-y-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Folder className="h-4 w-4 text-blue-500" />
            Media Folders
          </h2>
        </div>

        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 pb-2 md:pb-0 scrollbar-none">
          {folders.map((folder) => {
            const count = folder === 'All' 
              ? mediaItems.length 
              : mediaItems.filter(item => item.folderName === folder).length;
            
            return (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap md:w-full ${
                  selectedFolder === folder
                    ? 'bg-zinc-800 text-white shadow-md border-l-2 border-blue-500'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                }`}
              >
                <span>{folder}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedFolder === folder ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            setUploadOpen(true);
            setValidationError('');
          }}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          Simulate Upload
        </button>
      </div>

      {/* Main Vault Panel */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
        {/* Controls Header */}
        <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
              Media Vault
            </h1>
            <p className="text-zinc-500 text-xs mt-0.5">
              Vault archive files for <strong className="text-zinc-300">@{activeCreator.username}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 placeholder-zinc-500"
              />
            </div>

            {/* Type selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Image">Images Only</option>
              <option value="Video">Videos Only</option>
            </select>
          </div>
        </div>

        {/* Media Grid View */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {loading ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              Syncing vault inventory...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm gap-2 py-12">
              <span className="p-4 bg-zinc-900/60 rounded-full border border-zinc-800 text-2xl">📁</span>
              <p className="font-semibold text-zinc-400">No media assets found</p>
              <p className="text-zinc-600 text-xs">Upload some files to get started with content publishing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {filteredItems.map((item) => {
                const isVideo = item.fileType === 'video';
                return (
                  <div
                    key={item.id}
                    className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-2.5 backdrop-blur-sm relative group overflow-hidden flex flex-col gap-2 hover:border-zinc-700/80 transition-all duration-200"
                  >
                    {/* Media File Display */}
                    <div className="aspect-square w-full rounded-xl bg-zinc-950 overflow-hidden relative border border-zinc-800/50 flex-shrink-0">
                      {isVideo ? (
                        <>
                          <img 
                            src={item.thumbnail || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=150'} 
                            alt={item.name} 
                            className="object-cover h-full w-full opacity-60 group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="h-8 w-8 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-md">
                              <Play className="h-4 w-4 fill-current ml-0.5" />
                            </span>
                          </div>
                        </>
                      ) : (
                        <img 
                          src={item.url} 
                          alt={item.name} 
                          className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      
                      {/* Hover Info details overlay */}
                      <div className="absolute top-2 right-2 bg-zinc-950/70 border border-zinc-800/60 px-2 py-0.5 rounded text-[9px] uppercase font-extrabold tracking-wide text-zinc-400">
                        {item.fileType}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-zinc-200 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Folder className="h-3 w-3 text-zinc-500" />
                          <span className="text-[10px] text-zinc-400 font-semibold truncate bg-zinc-800/50 px-1.5 py-0.2 rounded border border-zinc-700/30">
                            {item.folderName}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-[9px] text-zinc-500 font-semibold mt-2.5 pt-1.5 border-t border-zinc-800/50">
                        <span>{formatBytes(item.fileSize)}</span>
                        <span>
                          {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Simulator Upload Modal Drawer */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-bold text-zinc-100">Simulate Upload to Vault</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setUploadOpen(false)}
                className="text-zinc-500 hover:text-white rounded-lg p-1 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick-fill options */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                Quick Preset Templates
              </span>
              <div className="grid grid-cols-2 gap-2">
                {stockMediaOptions.map((opt, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSelectStock(opt)}
                    className="p-2 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:bg-zinc-950 bg-zinc-900/40 text-left text-xs text-zinc-300 font-medium truncate flex items-center gap-1.5 transition-all"
                  >
                    {opt.type === 'video' ? <Video className="h-3.5 w-3.5 text-blue-400" /> : <Image className="h-3.5 w-3.5 text-emerald-400" />}
                    <span>{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSimulateUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* File Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">File Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. outfit_mirror_01.jpg"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Folder name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">Folder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Outfits, Casual, Promo"
                    value={folderNameInput}
                    onChange={(e) => setFolderNameInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* File URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 font-sans">Remote Asset URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or mp4 link"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* File Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">File Type</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as 'image' | 'video')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                {/* File Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">File Size (MB)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={customSizeMB}
                    onChange={(e) => setCustomSizeMB(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              {/* Error messages */}
              {validationError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  {uploadLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Import File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
