'use client';

import React, { useState, useEffect } from 'react';
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

  // Modal placeholder states (mocked for commit 7)
  const [uploadOpen, setUploadOpen] = useState(false);

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
          onClick={() => setUploadOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          Simulate Upload
        </button>
      </div>

      {/* Main Vault Panel Layout Outline (commit 7) */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 p-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Media Vault
          </h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            Vault archive files for <strong className="text-zinc-300">@{activeCreator.username}</strong>
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs border border-dashed border-zinc-850 rounded-2xl mt-6">
          Files and folder grids will load in next commit...
        </div>
      </div>
    </div>
  );
}
