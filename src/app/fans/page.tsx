'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { Fan } from '@/types';
import { Users, UserCheck, UserMinus, DollarSign, Search, RefreshCw, Filter, SlidersHorizontal, Tag, Eye, X, Plus, Send, Edit2, Trash2, CheckCircle2, Bell, AlertTriangle, Settings } from 'lucide-react';

export const getTagStyles = (tag: string) => {
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    { bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', label: 'Indigo' },
    { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', label: 'Emerald' },
    { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', label: 'Amber' },
    { bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', label: 'Rose' },
    { bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400', label: 'Cyan' },
    { bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400', label: 'Purple' },
    { bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400', label: 'Orange' },
  ];
  return colors[hash % colors.length];
};

export default function FansCRMPage() {
  const { activeCreator, activeSubMenu, setActiveSubMenu } = useGlobalStore();
  const [fans, setFans] = useState<Fan[]>([]);
  const [loading, setLoading] = useState(false);

  // OnlyFans Notifications, Blocked Users, Release Forms States
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [notificationCounts, setNotificationCounts] = useState<any>({
    all: 0, subscribed: 0, purchases: 0, tip: 0, tags: 0, commented: 0, mentioned: 0, favorited: 0
  });
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifSearch, setNotifSearch] = useState('');
  const [activeNotifTab, setActiveNotifTab] = useState('all');

  const [blockedSearch, setBlockedSearch] = useState('');
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [blockedUsersList, setBlockedUsersList] = useState<any[]>([]);
  const [blockUsername, setBlockUsername] = useState('');
  const [blockDisplayName, setBlockDisplayName] = useState('');
  const [blockType, setBlockType] = useState<'block' | 'restrict'>('block');
  const [blockReason, setBlockReason] = useState('');

  const loadBlockedUsers = async () => {
    if (!activeCreator) return;
    setLoadingBlocked(true);
    try {
      const res = await fetch(`/api/fans/blocked?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setBlockedUsersList(data || []);
      }
    } catch (err) {
      console.error('Error loading blocked users:', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleBlockUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCreator || !blockUsername.trim()) return;
    try {
      const res = await fetch('/api/fans/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          username: blockUsername,
          displayName: blockDisplayName || blockUsername,
          type: blockType,
          reason: blockReason
        })
      });
      if (res.ok) {
        setBlockUsername('');
        setBlockDisplayName('');
        setBlockReason('');
        loadBlockedUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to block/restrict user');
      }
    } catch (err) {
      console.error('Error blocking user:', err);
    }
  };

  const handleUnblockUser = async (blockedId: string) => {
    if (!activeCreator) return;
    if (!confirm('Are you sure you want to remove this user from the block list?')) return;
    try {
      const res = await fetch(`/api/fans/blocked?creatorId=${activeCreator.id}&blockedId=${blockedId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadBlockedUsers();
      }
    } catch (err) {
      console.error('Error unblocking user:', err);
    }
  };

  const loadNotificationCounts = async () => {
    if (!activeCreator) return;
    try {
      const res = await fetch(`/api/fans/notifications?action=counts&creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotificationCounts(data.data || {});
      }
    } catch (err) {
      console.error('Error loading notification counts:', err);
    }
  };

  const loadNotifications = async () => {
    if (!activeCreator) return;
    setLoadingNotifs(true);
    try {
      const res = await fetch(`/api/fans/notifications?creatorId=${activeCreator.id}&type=${activeNotifTab}`);
      if (res.ok) {
        const data = await res.json();
        setNotificationsList(data || []);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleSearchNotifications = async (q: string) => {
    if (!activeCreator) return;
    if (!q.trim()) {
      loadNotifications();
      return;
    }
    setLoadingNotifs(true);
    try {
      const res = await fetch(`/api/fans/notifications?creatorId=${activeCreator.id}&action=search&query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setNotificationsList(data || []);
      }
    } catch (err) {
      console.error('Error searching notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!activeCreator) return;
    try {
      const res = await fetch('/api/fans/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          action: 'mark-all'
        })
      });
      if (res.ok) {
        loadNotifications();
        loadNotificationCounts();
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    if (!activeCreator) return;
    try {
      const res = await fetch('/api/fans/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          action: 'mark-read',
          notificationId: id
        })
      });
      if (res.ok) {
        loadNotifications();
        loadNotificationCounts();
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    if (!activeCreator) return;
    try {
      const res = await fetch(`/api/fans/notifications?creatorId=${activeCreator.id}&action=delete&notificationId=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadNotifications();
        loadNotificationCounts();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearNotifications = async () => {
    if (!activeCreator) return;
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    try {
      const res = await fetch(`/api/fans/notifications?creatorId=${activeCreator.id}&action=clear`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadNotifications();
        loadNotificationCounts();
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  useEffect(() => {
    if (activeCreator && [
      'Get Notification Counts', 'Get Notification Tabs Order', 'List Notifications',
      'Mark All Notifications As Read', 'Search Users In Notifications'
    ].includes(activeSubMenu || '')) {
      loadNotifications();
      loadNotificationCounts();
    }
    if (activeCreator && activeSubMenu === 'Blocked / Restricted Users') {
      loadBlockedUsers();
    }
  }, [activeCreator, activeSubMenu, activeNotifTab]);

  // Sub-features tab options
  const [fansTab, setFansTab] = useState<'subscribers' | 'following' | 'collections'>('subscribers');
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [collectionsList, setCollectionsList] = useState<any[]>([]);
  const [loadingSubFeatures, setLoadingSubFeatures] = useState(false);

  const loadSubFeatures = async () => {
    if (!activeCreator) return;
    setLoadingSubFeatures(true);
    try {
      const route = fansTab === 'following' ? 'following' : 'lists';
      const res = await fetch(`/api/fans/${route}?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        if (fansTab === 'following') {
          setFollowingList(data);
        } else {
          setCollectionsList(data);
        }
      }
    } catch (err) {
      console.error('Error loading sub-features:', err);
    } finally {
      setLoadingSubFeatures(false);
    }
  };

  useEffect(() => {
    if (activeCreator && (fansTab === 'following' || fansTab === 'collections')) {
      loadSubFeatures();
    }
  }, [activeCreator, fansTab]);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [minSpent, setMinSpent] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Sorting & Layout States
  const [sortBy, setSortBy] = useState<'totalSpent' | 'subscribedAt' | 'expiresAt' | 'displayName'>('totalSpent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    totalFans: 0,
    activeSubscribers: 0,
    expiredSubscribers: 0,
    totalLTV: 0,
  });

  // Advanced Filters States
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [maxSpent, setMaxSpent] = useState('');
  const [joinedAfter, setJoinedAfter] = useState('');
  const [joinedBefore, setJoinedBefore] = useState('');
  const [expiresAfter, setExpiresAfter] = useState('');
  const [expiresBefore, setExpiresBefore] = useState('');

  // Active fan detail drawer modal state
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null);
  const [notesText, setNotesText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);

  // Autocomplete tags state
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // Quick tag editing states
  const [activeCardTagInput, setActiveCardTagInput] = useState<string | null>(null);
  const [quickTagText, setQuickTagText] = useState('');

  // Bulk selection state
  const [selectedFanIds, setSelectedFanIds] = useState<string[]>([]);

  // Bulk tagging states
  const [bulkTagAction, setBulkTagAction] = useState<'add' | 'remove' | null>(null);
  const [bulkTagText, setBulkTagText] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Bulk messaging states
  const [bulkMessageModalOpen, setBulkMessageModalOpen] = useState(false);
  const [bulkMessageText, setBulkMessageText] = useState('');
  const [sendingBulkMessage, setSendingBulkMessage] = useState(false);

  // Tag Manager State
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [renamingTag, setRenamingTag] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  // User List Collections CRUD & Member States
  const [createListModalOpen, setCreateListModalOpen] = useState(false);
  const [createListName, setCreateListName] = useState('');
  
  const [renameListModalOpen, setRenameListModalOpen] = useState(false);
  const [renameListId, setRenameListId] = useState('');
  const [renameListName, setRenameListName] = useState('');
  
  const [selectedList, setSelectedList] = useState<any | null>(null);
  const [listUsers, setListUsers] = useState<Fan[]>([]);
  const [loadingListUsers, setLoadingListUsers] = useState(false);
  
  const [userToAddToList, setUserToAddToList] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [clearingList, setClearingList] = useState(false);
  const [deletingList, setDeletingList] = useState<string | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [renamingList, setRenamingList] = useState(false);


  // Toggle selection for a single fan
  const handleToggleSelectFan = (fanId: string) => {
    setSelectedFanIds((prev) =>
      prev.includes(fanId) ? prev.filter((id) => id !== fanId) : [...prev, fanId]
    );
  };

  // Toggle select all fans in the current page view
  const handleToggleSelectAll = () => {
    if (selectedFanIds.length === fans.length && fans.length > 0) {
      setSelectedFanIds([]);
    } else {
      setSelectedFanIds(fans.map((f) => f.id));
    }
  };

  // Reset selection on filter change
  useEffect(() => {
    setSelectedFanIds([]);
  }, [activeCreator, search, statusFilter, minSpent, maxSpent, tagFilter, joinedAfter, joinedBefore, expiresAfter, expiresBefore, sortBy, sortOrder]);

  // Load all unique active creator tags for autocomplete options
  const loadAvailableTags = async () => {
    if (!activeCreator) return;
    try {
      const res = await fetch(`/api/fans?creatorId=${activeCreator.id}&tagsOnly=true`);
      if (res.ok) {
        const list = await res.json();
        setAvailableTags(list || []);
      }
    } catch (err) {
      console.error('Error loading available tags:', err);
    }
  };

  useEffect(() => {
    loadAvailableTags();
  }, [activeCreator]);

  useEffect(() => {
    if (selectedFan) {
      setNotesText(selectedFan.notes || '');
      setNewTag('');
    }
  }, [selectedFan]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, minSpent, maxSpent, tagFilter, joinedAfter, joinedBefore, expiresAfter, expiresBefore, sortBy, sortOrder]);

  useEffect(() => {
    if (!activeCreator) return;

    const timer = setTimeout(() => {
      loadFans();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    activeCreator, search, statusFilter, minSpent, maxSpent, tagFilter, 
    joinedAfter, joinedBefore, expiresAfter, expiresBefore, sortBy, sortOrder, page, limit
  ]);

  async function loadFans() {
    if (!activeCreator) return;
    setLoading(true);
    try {
      let url = `/api/fans?creatorId=${activeCreator.id}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (statusFilter !== 'all') {
        url += `&isSubscriber=${statusFilter === 'active'}`;
      }
      if (minSpent.trim()) {
        url += `&minSpent=${minSpent.trim()}`;
      }
      if (maxSpent.trim()) {
        url += `&maxSpent=${maxSpent.trim()}`;
      }
      if (joinedAfter.trim()) {
        url += `&joinedAfter=${joinedAfter.trim()}`;
      }
      if (joinedBefore.trim()) {
        url += `&joinedBefore=${joinedBefore.trim()}`;
      }
      if (expiresAfter.trim()) {
        url += `&expiresAfter=${expiresAfter.trim()}`;
      }
      if (expiresBefore.trim()) {
        url += `&expiresBefore=${expiresBefore.trim()}`;
      }
      if (tagFilter.trim()) {
        url += `&tags=${encodeURIComponent(tagFilter.trim())}`;
      }
      // Add sorting query params
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      // Add pagination query params
      url += `&page=${page}&limit=${limit}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && 'fans' in data) {
          setFans(data.fans || []);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          if (data.summary) {
            setSummary(data.summary);
          }
        } else {
          setFans(Array.isArray(data) ? data : []);
        }
      }
    } catch (err) {
      console.error('Error loading fans:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddTag = () => {
    if (!selectedFan || !newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (selectedFan.customTags.includes(tag)) return;
    const updatedTags = [...selectedFan.customTags, tag];
    setSelectedFan({ ...selectedFan, customTags: updatedTags });
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedFan) return;
    const updatedTags = selectedFan.customTags.filter((t) => t !== tagToRemove);
    setSelectedFan({ ...selectedFan, customTags: updatedTags });
  };

  const handleQuickAddTag = async (fan: Fan) => {
    if (!quickTagText.trim()) return;
    const tag = quickTagText.trim().toLowerCase();
    if (fan.customTags.includes(tag)) {
      setActiveCardTagInput(null);
      setQuickTagText('');
      return;
    }
    const updatedTags = [...fan.customTags, tag];
    setActiveCardTagInput(null);
    setQuickTagText('');

    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanId: fan.id,
          customTags: updatedTags,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
    } catch (err) {
      console.error('Error adding quick tag:', err);
    }
  };

  const handleQuickRemoveTag = async (fan: Fan, tagToRemove: string) => {
    const updatedTags = fan.customTags.filter((t) => t !== tagToRemove);
    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanId: fan.id,
          customTags: updatedTags,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
    } catch (err) {
      console.error('Error removing quick tag:', err);
    }
  };

  const handleBulkTagSubmit = async () => {
    if (!bulkTagAction || !bulkTagText.trim() || selectedFanIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanIds: selectedFanIds,
          bulkAction: bulkTagAction,
          tag: bulkTagText.trim(),
        }),
      });
      if (res.ok) {
        // Reload fans to get fresh details
        await loadFans();
        // Clear bulk state
        setSelectedFanIds([]);
        setBulkTagAction(null);
        setBulkTagText('');
      } else {
        console.error('Failed to update bulk tags');
      }
    } catch (err) {
      console.error('Error updating bulk tags:', err);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleSendBulkMessage = async () => {
    if (!bulkMessageText.trim() || selectedFanIds.length === 0 || !activeCreator) return;
    setSendingBulkMessage(true);
    try {
      const res = await fetch('/api/fans/bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          fanIds: selectedFanIds,
          text: bulkMessageText.trim(),
        }),
      });
      if (res.ok) {
        setBulkMessageModalOpen(false);
        setBulkMessageText('');
        setSelectedFanIds([]);
        alert(`Successfully queued messages for ${selectedFanIds.length} subscribers!`);
      } else {
        console.error('Failed to send bulk messages');
      }
    } catch (err) {
      console.error('Error sending bulk messages:', err);
    } finally {
      setSendingBulkMessage(false);
    }
  };

  const handleRenameTagConfirm = async (oldTag: string) => {
    if (!renameText.trim() || !activeCreator) return;
    const newTagVal = renameText.trim().toLowerCase();
    if (newTagVal === oldTag) {
      setRenamingTag(null);
      return;
    }
    
    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          globalAction: 'rename',
          oldTag,
          newTag: newTagVal,
        }),
      });

      if (res.ok) {
        await loadFans();
        await loadAvailableTags();
        setRenamingTag(null);
        setRenameText('');
      } else {
        console.error('Failed to rename tag globally');
      }
    } catch (err) {
      console.error('Error renaming tag globally:', err);
    }
  };

  const handleDeleteTagConfirm = async (tagToDelete: string) => {
    if (!activeCreator) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete the tag #${tagToDelete} globally? This will remove it from all subscribers.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          globalAction: 'delete',
          tag: tagToDelete,
        }),
      });

      if (res.ok) {
        if (tagFilter === tagToDelete) {
          setTagFilter('');
        }
        await loadFans();
        await loadAvailableTags();
      } else {
        console.error('Failed to delete tag globally');
      }
    } catch (err) {
      console.error('Error deleting tag globally:', err);
    }
  };

  // CRUD Action Handlers for User Lists
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createListName.trim() || !activeCreator) return;
    setCreatingList(true);
    try {
      const res = await fetch('/api/fans/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          name: createListName.trim()
        })
      });
      if (res.ok) {
        setCreateListName('');
        setCreateListModalOpen(false);
        loadSubFeatures();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create collection');
      }
    } catch (err) {
      console.error('Error creating user list:', err);
    } finally {
      setCreatingList(false);
    }
  };

  const handleRenameList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameListName.trim() || !renameListId || !activeCreator) return;
    setRenamingList(true);
    try {
      const res = await fetch('/api/fans/lists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          listId: renameListId,
          name: renameListName.trim()
        })
      });
      if (res.ok) {
        setRenameListName('');
        setRenameListId('');
        setRenameListModalOpen(false);
        loadSubFeatures();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to rename collection');
      }
    } catch (err) {
      console.error('Error renaming user list:', err);
    } finally {
      setRenamingList(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!activeCreator) return;
    if (!confirm('Are you sure you want to delete this collection list?')) return;
    setDeletingList(listId);
    try {
      const res = await fetch(`/api/fans/lists?creatorId=${activeCreator.id}&listId=${listId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadSubFeatures();
        if (selectedList?.id === listId) {
          setSelectedList(null);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete collection');
      }
    } catch (err) {
      console.error('Error deleting user list:', err);
    } finally {
      setDeletingList(null);
    }
  };

  const loadListUsers = async (listId: string) => {
    if (!activeCreator) return;
    setLoadingListUsers(true);
    try {
      const res = await fetch(`/api/fans/lists?creatorId=${activeCreator.id}&listId=${listId}&users=true`);
      if (res.ok) {
        const data = await res.json();
        setListUsers(data || []);
      }
    } catch (err) {
      console.error('Error loading list users:', err);
    } finally {
      setLoadingListUsers(false);
    }
  };

  const handleAddUserToList = async () => {
    if (!userToAddToList || !selectedList || !activeCreator) return;
    setAddingUser(true);
    try {
      const res = await fetch('/api/fans/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          listId: selectedList.id,
          action: 'add-users',
          userIds: [userToAddToList]
        })
      });
      if (res.ok) {
        setUserToAddToList('');
        await loadListUsers(selectedList.id);
        loadSubFeatures();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add user to list');
      }
    } catch (err) {
      console.error('Error adding user to list:', err);
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUserFromList = async (userId: string) => {
    if (!selectedList || !activeCreator) return;
    setRemovingUser(userId);
    try {
      const res = await fetch(`/api/fans/lists?creatorId=${activeCreator.id}&listId=${selectedList.id}&action=remove-user&userId=${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadListUsers(selectedList.id);
        loadSubFeatures();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to remove user from list');
      }
    } catch (err) {
      console.error('Error removing user from list:', err);
    } finally {
      setRemovingUser(null);
    }
  };

  const handleClearList = async () => {
    if (!selectedList || !activeCreator) return;
    if (!confirm('Are you sure you want to remove all users from this collection?')) return;
    setClearingList(true);
    try {
      const res = await fetch(`/api/fans/lists?creatorId=${activeCreator.id}&listId=${selectedList.id}&action=clear`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadListUsers(selectedList.id);
        loadSubFeatures();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to clear list');
      }
    } catch (err) {
      console.error('Error clearing user list:', err);
    } finally {
      setClearingList(false);
    }
  };

  useEffect(() => {
    if (selectedList) {
      loadListUsers(selectedList.id);
    } else {
      setListUsers([]);
    }
  }, [selectedList]);

  const handleSaveDetails = async () => {
    if (!selectedFan) return;
    setSaving(true);
    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanId: selectedFan.id,
          notes: notesText,
          customTags: selectedFan.customTags,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        // Update fan in list state
        setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        setSelectedFan(updated);
        setSavingSuccess(true);
        setTimeout(() => setSavingSuccess(false), 2000);
      } else {
        console.error('Failed to save fan details');
      }
    } catch (err) {
      console.error('Error saving fan details:', err);
    } finally {
      setSaving(false);
    }
  };

  // Read metrics from summary state populated by API
  const { totalFans, activeSubscribers, expiredSubscribers, totalLTV } = summary;

  const isBlockedLedger = activeSubMenu === 'Blocked / Restricted Users';
  const isReleaseForms = activeSubMenu === 'Release Forms';
  const isEngagementStats = activeSubMenu === 'Engagement / Messages';
  const isPublicProfiles = activeSubMenu === 'Public Profiles';
  const isUsersView = activeSubMenu === 'Users' || !activeSubMenu || activeSubMenu === '';

  if (!activeCreator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold">Loading Agency Context...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* 1a. GET NOTIFICATION COUNTS */}
      {activeSubMenu === 'Get Notification Counts' && (
        <div className="space-y-6 text-left">
          <div className="border-b border-zinc-800/60 pb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <Bell className="h-7 w-7 text-blue-500" />
              Notification Counts
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Live unread count breakdown across notification categories for <strong className="text-zinc-300">@{activeCreator.username}</strong>
            </p>
            <span className="text-[10px] font-mono text-zinc-600 mt-1 block">GET /api/fans/notifications?action=counts</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'all', label: 'All', color: 'blue' },
              { id: 'subscribed', label: 'New Subscribers', color: 'emerald' },
              { id: 'purchases', label: 'PPV Purchases', color: 'amber' },
              { id: 'tip', label: 'Tips', color: 'purple' },
              { id: 'tags', label: 'Co-Post Tags', color: 'cyan' },
              { id: 'commented', label: 'Comments', color: 'rose' },
              { id: 'mentioned', label: 'Mentions', color: 'indigo' },
              { id: 'favorited', label: 'Favorited', color: 'orange' },
            ].map((cat) => {
              const count = notificationCounts[cat.id] || 0;
              return (
                <div key={cat.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">{cat.label}</span>
                  <span className="text-3xl font-black text-zinc-100 block">{count}</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border inline-block ${
                    count > 0
                      ? `text-${cat.color}-400 bg-${cat.color}-500/10 border-${cat.color}-500/20`
                      : 'text-zinc-600 bg-zinc-800/40 border-zinc-700/20'
                  }`}>
                    {count > 0 ? 'Unread' : 'Clear'}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => { loadNotificationCounts(); }}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Counts [GET]
          </button>
        </div>
      )}

      {/* 1b. GET NOTIFICATION TABS ORDER */}
      {activeSubMenu === 'Get Notification Tabs Order' && (
        <div className="space-y-6 text-left">
          <div className="border-b border-zinc-800/60 pb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <Bell className="h-7 w-7 text-purple-500" />
              Notification Tabs Order
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              The ordered display sequence of notification filter categories from the OnlyFans API.
            </p>
            <span className="text-[10px] font-mono text-zinc-600 mt-1 block">GET /api/fans/notifications?action=tabs</span>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800/60 pb-3">
              Tab Sequence (Ordered)
            </h3>
            <div className="space-y-2">
              {[
                { id: 'all', label: 'All Notifications', icon: '📋' },
                { id: 'subscribed', label: 'New Subscribers', icon: '👤' },
                { id: 'purchases', label: 'PPV Purchases', icon: '💰' },
                { id: 'tip', label: 'Tips Received', icon: '💵' },
                { id: 'tags', label: 'Co-Post Tags', icon: '🏷️' },
                { id: 'commented', label: 'Comments', icon: '💬' },
                { id: 'mentioned', label: 'Mentions', icon: '📣' },
                { id: 'favorited', label: 'Favorited', icon: '⭐' },
              ].map((tab, idx) => (
                <div key={tab.id} className="flex items-center gap-3 bg-zinc-950 border border-zinc-850 rounded-xl p-3">
                  <span className="text-xs font-black text-zinc-550 w-6 text-center">#{idx + 1}</span>
                  <span className="text-sm">{tab.icon}</span>
                  <span className="text-xs font-bold text-zinc-300 flex-1">{tab.label}</span>
                  <span className="text-[9px] font-mono text-zinc-600">{tab.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 1c. LIST NOTIFICATIONS */}
      {activeSubMenu === 'List Notifications' && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
                <Bell className="h-7 w-7 text-blue-500" />
                List Notifications
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                Browse and filter live notification events for <strong className="text-zinc-300">@{activeCreator.username}</strong>
              </p>
              <span className="text-[10px] font-mono text-zinc-600 mt-1 block">GET /api/fans/notifications</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Filter Tabs Panel */}
            <div className="lg:col-span-1 space-y-2 bg-zinc-900/25 border border-zinc-850 p-4 rounded-2xl">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 px-1">Filter by Type</span>
              {[
                { id: 'all', label: 'All notifications' },
                { id: 'subscribed', label: 'New Subscribers' },
                { id: 'purchases', label: 'PPV Purchases' },
                { id: 'tip', label: 'Tips received' },
                { id: 'tags', label: 'Co-post Tags' },
                { id: 'commented', label: 'Comments' },
                { id: 'mentioned', label: 'Mentions' },
                { id: 'favorited', label: 'Favorited' }
              ].map((tab) => {
                const count = notificationCounts[tab.id] || 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveNotifTab(tab.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      activeNotifTab === tab.id
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                        : 'text-zinc-400 hover:bg-zinc-900/60'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span className="bg-blue-500/25 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-black border border-blue-500/30">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Notifications List */}
            <div className="lg:col-span-3 space-y-4">
              {loadingNotifs ? (
                <div className="py-20 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-blue-500" /></div>
              ) : notificationsList.length > 0 ? (
                <div className="space-y-3.5">
                  {notificationsList.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                        notif.isRead 
                          ? 'bg-zinc-950/20 border-zinc-900/60' 
                          : 'bg-blue-500/5 border-blue-500/15 shadow-sm shadow-blue-500/5'
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-xs text-blue-400 flex-shrink-0 uppercase select-none">
                        {notif.user.displayName.substring(0, 2)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-zinc-200">{notif.user.displayName}</span>
                          <span className="text-[10px] text-zinc-500 font-bold">@{notif.user.username}</span>
                          {!notif.isRead && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-350 leading-relaxed font-semibold">{notif.message}</p>
                        <span className="text-[9px] text-zinc-550 block font-bold mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkNotifRead(notif.id)}
                            className="p-1.5 text-zinc-550 hover:text-green-400 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
                            title="Mark Read"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotif(notif.id)}
                          className="p-1.5 text-zinc-550 hover:text-red-400 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
                          title="Delete Notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900/10 border border-zinc-900/30 p-12 text-center rounded-2xl text-zinc-550 italic text-sm">
                  No notifications match this filter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1d. MARK ALL NOTIFICATIONS AS READ */}
      {activeSubMenu === 'Mark All Notifications As Read' && (
        <div className="space-y-6 text-left">
          <div className="border-b border-zinc-800/60 pb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <Bell className="h-7 w-7 text-emerald-500" />
              Mark All Notifications As Read
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Bulk action to clear all unread notification badges for <strong className="text-zinc-300">@{activeCreator.username}</strong>
            </p>
            <span className="text-[10px] font-mono text-zinc-600 mt-1 block">POST /api/fans/notifications (action: mark-all)</span>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-850 rounded-xl p-5">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-xs font-black text-zinc-200 uppercase tracking-wider block">Current Unread Count</span>
                <span className="text-2xl font-black text-zinc-100">{notificationCounts['all'] || 0}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleMarkAllRead}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark All As Read [POST]
              </button>
              <button
                onClick={handleClearNotifications}
                className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All [DELETE]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1e. SEARCH USERS IN NOTIFICATIONS */}
      {activeSubMenu === 'Search Users In Notifications' && (
        <div className="space-y-6 text-left">
          <div className="border-b border-zinc-800/60 pb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <Bell className="h-7 w-7 text-amber-500" />
              Search Users In Notifications
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Search by username or message content across notification events.
            </p>
            <span className="text-[10px] font-mono text-zinc-600 mt-1 block">GET /api/fans/notifications?action=search</span>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-zinc-500 text-xs font-bold">🔍</span>
              <input
                type="text"
                placeholder="Search users or message content..."
                value={notifSearch}
                onChange={(e) => {
                  setNotifSearch(e.target.value);
                  handleSearchNotifications(e.target.value);
                }}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-350 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            {loadingNotifs ? (
              <div className="py-20 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-blue-500" /></div>
            ) : notificationsList.length > 0 ? (
              <div className="space-y-3.5">
                {notificationsList.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                      notif.isRead 
                        ? 'bg-zinc-950/20 border-zinc-900/60' 
                        : 'bg-blue-500/5 border-blue-500/15 shadow-sm shadow-blue-500/5'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-xs text-blue-400 flex-shrink-0 uppercase select-none">
                      {notif.user.displayName.substring(0, 2)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-200">{notif.user.displayName}</span>
                        <span className="text-[10px] text-zinc-500 font-bold">@{notif.user.username}</span>
                        {!notif.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-350 leading-relaxed font-semibold">{notif.message}</p>
                      <span className="text-[9px] text-zinc-550 block font-bold mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900/10 border border-zinc-900/30 p-12 text-center rounded-2xl text-zinc-550 italic text-sm">
                {notifSearch ? 'No users or notifications match your search query.' : 'Type a username or keyword above to search notifications.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Blocked ledger */}
      {isBlockedLedger && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
                Blocked & Restricted Users Ledger
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                View blocked subscriber tags, manage accounts, and push restrictions to OnlyFans.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Block New User Form */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                Restrict User Profile [POST]
              </h3>
              
              <form onSubmit={handleBlockUserSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">OnlyFans Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. spammer_123"
                    value={blockUsername}
                    onChange={(e) => setBlockUsername(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Display Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Charlie Spammer"
                    value={blockDisplayName}
                    onChange={(e) => setBlockDisplayName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Action Type</label>
                  <select
                    value={blockType}
                    onChange={(e) => setBlockType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                  >
                    <option value="block">Full Block (Disable Subscriptions)</option>
                    <option value="restrict">Restrict (Mute Chat Only)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Reason for Record</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Charging back updates or toxic messaging..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg border-0 cursor-pointer"
                >
                  Block User [POST]
                </button>
              </form>
            </div>

            {/* Blocked Users List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-550 text-xs">🔍</span>
                <input
                  type="text"
                  placeholder="Filter blocked ledger..."
                  value={blockedSearch}
                  onChange={(e) => setBlockedSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              {loadingBlocked ? (
                <div className="py-20 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-blue-500" /></div>
              ) : blockedUsersList.length > 0 ? (
                <div className="space-y-3">
                  {blockedUsersList
                    .filter(b => b.username.includes(blockedSearch.toLowerCase()) || b.displayName.toLowerCase().includes(blockedSearch.toLowerCase()))
                    .map((user) => (
                      <div key={user.id} className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-2xl flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center font-bold text-xs text-amber-500 flex-shrink-0 uppercase">
                            {user.displayName.substring(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-zinc-200">{user.displayName}</span>
                              <span className="text-[10px] text-zinc-500">@{user.username}</span>
                              <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border ${
                                user.type === 'block' 
                                  ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              }`}>
                                {user.type === 'block' ? 'Blocked' : 'Restricted'}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-1 font-semibold leading-relaxed">
                              <strong>Reason:</strong> {user.reason}
                            </p>
                            <span className="text-[9px] text-zinc-550 font-bold block mt-1">Blocked on: {new Date(user.blockedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnblockUser(user.id)}
                          className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Unblock [DELETE]
                        </button>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="bg-zinc-900/10 border border-zinc-900/30 p-12 text-center rounded-2xl text-zinc-550 italic text-sm text-center">
                  No users blocked or restricted.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Release Forms */}
      {isReleaseForms && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
                <Settings className="h-7 w-7 text-indigo-500" />
                Release Forms Ledger
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                Verify guest model signatures, upload contracts, and ensure compliance for collaborative content uploads.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800/60 pb-3">
              OnlyFans Approved Guest Release Forms [GET]
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-semibold text-zinc-400 text-left">
                <thead>
                  <tr className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                    <th className="pb-3">Model Name</th>
                    <th className="pb-3">OnlyFans Username</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Verification Date</th>
                    <th className="pb-3 text-right">Contract File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {[
                    { name: 'Kacie Rose', username: '@kacie_rose', status: 'verified', date: '2026-05-15', file: 'release_kacie_r.pdf' },
                    { name: 'Marcus Steel', username: '@marcus_s', status: 'verified', date: '2026-06-20', file: 'release_marcus_s.pdf' },
                    { name: 'Luna Frost', username: '@luna_frost', status: 'pending', date: 'Under Review', file: 'release_luna_f_temp.pdf' }
                  ].map((form, i) => (
                    <tr key={i} className="hover:bg-zinc-900/10">
                      <td className="py-3.5 text-zinc-200 font-extrabold">{form.name}</td>
                      <td className="py-3.5 text-zinc-400">{form.username}</td>
                      <td className="py-3.5">
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border ${
                          form.status === 'verified'
                            ? 'text-green-400 bg-green-500/10 border-green-500/20'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        }`}>
                          {form.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-zinc-500">{form.date}</td>
                      <td className="py-3.5 text-right text-blue-400 hover:underline cursor-pointer">{form.file}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Engagement Stats */}
      {isEngagementStats && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
                <Settings className="h-7 w-7 text-emerald-500" />
                Engagement & Messages Analytics
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                Real-time subscriber interaction stats, response latencies, and conversion funnels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Average Chat Response Time</p>
              <h3 className="text-2xl font-black text-zinc-150 mt-1">1.8 Minutes</h3>
              <p className="text-[10px] text-green-400 font-extrabold mt-1.5">✓ 98.4% response rate under SLA thresholds</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Message Conversion Rate</p>
              <h3 className="text-2xl font-black text-zinc-150 mt-1">12.4%</h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-1.5">Ratio of purchased PPV per chat broadcast</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Fan Retentive Score</p>
              <h3 className="text-2xl font-black text-zinc-150 mt-1">94.8%</h3>
              <p className="text-[10px] text-green-400 font-extrabold mt-1.5">Re-subscription rates over rolling 30-days</p>
            </div>
          </div>
        </div>
      )}

      {/* Default CRM tab structure */}
      {isUsersView && (
        <>
        {/* Fans CRM Page Sub-tabs */}
        <div className="flex gap-4 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setFansTab('subscribers')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              fansTab === 'subscribers'
                ? 'bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30 shadow-md shadow-[#7C5CFC]/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Subscribers (Fans)
          </button>
          <button
            onClick={() => setFansTab('following')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              fansTab === 'following'
                ? 'bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30 shadow-md shadow-[#7C5CFC]/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Following (OnlyFans API)
          </button>
          <button
            onClick={() => setFansTab('collections')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              fansTab === 'collections'
                ? 'bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30 shadow-md shadow-[#7C5CFC]/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            User Lists & Collections (OnlyFans API)
          </button>
        </div>

      {fansTab === 'subscribers' && (
        <>
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Users className="h-7 w-7 text-blue-500" />
            Fans CRM Directory
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Segment, filter, and manage subscriber tags and profiles for <strong className="text-zinc-300">@{activeCreator.username}</strong>
          </p>
        </div>
        <button
          onClick={loadFans}
          disabled={loading}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Directory
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fans */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Fans</p>
            <h3 className="text-xl font-black text-zinc-100 mt-0.5">{totalFans}</h3>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center flex-shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Subscribers</p>
            <h3 className="text-xl font-black text-green-400 mt-0.5">{activeSubscribers}</h3>
          </div>
        </div>

        {/* Expired Subscribers */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <UserMinus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Expired Subscribers</p>
            <h3 className="text-xl font-black text-red-400 mt-0.5">{expiredSubscribers}</h3>
          </div>
        </div>

        {/* Total LTV */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total LTV Spend</p>
            <h3 className="text-xl font-black text-emerald-400 mt-0.5">${totalLTV.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Filters Board Dashboard */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
            Directory Segmentation Filters
          </h3>
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-bold flex items-center gap-1.5 ${
              advancedOpen 
                ? 'bg-indigo-600/10 border-indigo-500/35 text-indigo-400 hover:bg-indigo-600/20' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            {advancedOpen ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status filter selector */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="all">Subscription: All</option>
              <option value="active">Active Subscribers</option>
              <option value="expired">Expired Subscribers</option>
            </select>
          </div>

          {/* Spent filter selector */}
          <div>
            <select
              value={minSpent}
              onChange={(e) => setMinSpent(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">LTV Spend: All</option>
              <option value="50">Spent &gt;= $50.00</option>
              <option value="100">Spent &gt;= $100.00</option>
              <option value="500">Spent &gt;= $500.00</option>
              <option value="1000">Spent &gt;= $1000.00 (Whales)</option>
            </select>
          </div>

          {/* Tag search filter */}
          <div className="relative">
            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by custom tag (e.g. vip)..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Advanced Filters Expandable Box */}
        {advancedOpen && (
          <div className="pt-4 border-t border-zinc-800/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Max Spent Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Max Spent ($)</label>
              <input
                type="number"
                placeholder="Upper LTV limit..."
                value={maxSpent}
                onChange={(e) => setMaxSpent(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Joined After Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Joined After</label>
              <input
                type="date"
                value={joinedAfter}
                onChange={(e) => setJoinedAfter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Joined Before Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Joined Before</label>
              <input
                type="date"
                value={joinedBefore}
                onChange={(e) => setJoinedBefore(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Expires After Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Expires After</label>
              <input
                type="date"
                value={expiresAfter}
                onChange={(e) => setExpiresAfter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Expires Before Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Expires Before</label>
              <input
                type="date"
                value={expiresBefore}
                onChange={(e) => setExpiresBefore(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Sorting & Layout control bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/60 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 px-3 text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="totalSpent">LTV Spend</option>
              <option value="subscribedAt">Join Date</option>
              <option value="expiresAt">Expiry Date</option>
              <option value="displayName">Name</option>
            </select>
            
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 font-semibold"
              title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <span className="text-[10px] uppercase font-bold text-zinc-400">Order: {sortOrder.toUpperCase()}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Layout:</span>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-0.5 flex">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                  viewMode === 'table' ? 'bg-zinc-850 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                  viewMode === 'grid' ? 'bg-zinc-850 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Grid
              </button>
            </div>

            <button
              onClick={() => setTagManagerOpen(true)}
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 font-bold ml-2 text-[10px] uppercase tracking-wider"
            >
              <Tag className="h-3.5 w-3.5 text-indigo-400" />
              Manage Tags
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table/Grid View */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="py-24 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="h-10 w-10 rounded-full border-4 border-zinc-800 border-t-indigo-500 animate-spin" />
              <div className="absolute h-6 w-6 rounded-full border-4 border-dashed border-indigo-500/30 animate-pulse" />
            </div>
            <span className="font-semibold text-zinc-400 tracking-wide animate-pulse">Filtering CRM Registry...</span>
          </div>
        ) : fans.length === 0 ? (
          <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center space-y-4">
            <p className="text-sm font-semibold">No subscribers match the current filters</p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setMinSpent('');
                setMaxSpent('');
                setTagFilter('');
                setJoinedAfter('');
                setJoinedBefore('');
                setExpiresAfter('');
                setExpiresBefore('');
              }}
              className="text-xs text-indigo-400 font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/20 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedFanIds.length === fans.length && fans.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                    />
                  </th>
                  <th className="p-4">Fan Account Details</th>
                  <th className="p-4">Subscription Status</th>
                  <th className="p-4">Registration Dates</th>
                  <th className="p-4">Total LTV Spend</th>
                  <th className="p-4">CRM Tags</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {fans.map((fan) => (
                  <tr 
                    key={fan.id} 
                    className={`hover:bg-zinc-900/20 transition-colors ${
                      selectedFanIds.includes(fan.id) ? 'bg-indigo-600/5' : ''
                    }`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedFanIds.includes(fan.id)}
                        onChange={() => handleToggleSelectFan(fan.id)}
                        className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                      />
                    </td>
                    {/* Account Details */}
                    <td className="p-4 flex items-center gap-3 min-w-[200px]">
                      <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {fan.avatarUrl ? (
                          <img src={fan.avatarUrl} alt={fan.displayName} className="object-cover h-full w-full" />
                        ) : (
                          <Users className="h-4.5 w-4.5 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-200 block truncate">{fan.displayName}</span>
                        <span className="text-zinc-500 font-semibold block text-[10px] mt-0.5">@{fan.username}</span>
                      </div>
                    </td>

                    {/* Sub Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        fan.isSubscriber 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${fan.isSubscriber ? 'bg-green-400' : 'bg-red-400'}`} />
                        {fan.isSubscriber ? 'Active' : 'Expired'}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="p-4 text-zinc-400 font-medium">
                      <div>Subbed: {new Date(fan.subscribedAt).toLocaleDateString()}</div>
                      {fan.expiresAt && (
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Expires: {new Date(fan.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Spend */}
                    <td className="p-4">
                      <span className="font-extrabold text-zinc-100 bg-zinc-950 border border-zinc-850 px-2.5 py-1 rounded-lg flex items-center gap-1 w-max text-xs">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        {Number(fan.totalSpent).toFixed(2)}
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 items-center max-w-[220px]">
                        {Array.isArray(fan.customTags) && fan.customTags.map((tag) => (
                          <span key={tag} className={`group/tag inline-flex items-center gap-1 border text-[10px] pl-2 pr-1.5 py-0.5 rounded-md font-bold ${getTagStyles(tag).bg}`}>
                            #{tag}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickRemoveTag(fan, tag);
                              }}
                              className="opacity-0 group-hover/tag:opacity-100 text-zinc-500 hover:text-white rounded-full transition-opacity"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                        {activeCardTagInput === fan.id ? (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="tag..."
                              autoFocus
                              value={quickTagText}
                              onChange={(e) => {
                                setQuickTagText(e.target.value);
                                setActiveSuggestionIndex(0);
                              }}
                              onBlur={() => {
                                // Small delay to allow clicking suggestions
                                setTimeout(() => {
                                  setActiveCardTagInput(null);
                                  setQuickTagText('');
                                }, 200);
                              }}
                              onKeyDown={(e) => {
                                const suggestionsList = availableTags.filter(
                                  (t) => !fan.customTags.includes(t) && t.toLowerCase().includes(quickTagText.toLowerCase())
                                );
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestionsList.length - 1));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
                                } else if (e.key === 'Enter' || e.key === 'Tab') {
                                  e.preventDefault();
                                  if (quickTagText.trim() && suggestionsList.length > 0 && activeSuggestionIndex < suggestionsList.length) {
                                    const selected = suggestionsList[activeSuggestionIndex];
                                    const updatedTags = [...fan.customTags, selected];
                                    (async () => {
                                      try {
                                        const res = await fetch('/api/fans', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            fanId: fan.id,
                                            customTags: updatedTags,
                                          }),
                                        });
                                        if (res.ok) {
                                          const updated = await res.json();
                                          setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
                                        }
                                      } catch (err) {
                                        console.error('Error adding quick tag:', err);
                                      }
                                    })();
                                    setActiveCardTagInput(null);
                                    setQuickTagText('');
                                  } else {
                                    handleQuickAddTag(fan);
                                  }
                                } else if (e.key === 'Escape') {
                                  setActiveCardTagInput(null);
                                  setQuickTagText('');
                                }
                              }}
                              className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[9px] w-16 focus:outline-none focus:border-indigo-500 text-zinc-200"
                            />
                            
                            {/* Suggestions List */}
                            {quickTagText.trim() && (
                              (() => {
                                const suggestionsList = availableTags.filter(
                                  (t) => !fan.customTags.includes(t) && t.toLowerCase().includes(quickTagText.toLowerCase())
                                );
                                if (suggestionsList.length === 0) return null;
                                return (
                                  <div className="absolute left-0 mt-1 bg-zinc-950 border border-zinc-800 rounded shadow-xl max-h-32 overflow-y-auto z-20 w-32 divide-y divide-zinc-900">
                                    {suggestionsList.map((suggestion, index) => (
                                      <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                          const updatedTags = [...fan.customTags, suggestion];
                                          (async () => {
                                            try {
                                              const res = await fetch('/api/fans', {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  fanId: fan.id,
                                                  customTags: updatedTags,
                                                }),
                                              });
                                              if (res.ok) {
                                                const updated = await res.json();
                                                setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
                                              }
                                            } catch (err) {
                                              console.error('Error adding quick tag:', err);
                                            }
                                          })();
                                          setActiveCardTagInput(null);
                                          setQuickTagText('');
                                        }}
                                        className={`w-full text-left px-2 py-1 text-[9px] transition-colors flex items-center justify-between ${
                                          index === activeSuggestionIndex
                                            ? 'bg-indigo-600 text-white font-bold'
                                            : 'text-zinc-350 hover:text-white hover:bg-zinc-900'
                                        }`}
                                      >
                                        <span>#{suggestion}</span>
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCardTagInput(fan.id);
                              setQuickTagText('');
                            }}
                            className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 transition-colors"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            Add
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedFan(fan)}
                        className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 p-2 rounded-xl transition-all inline-flex items-center justify-center gap-1.5 font-semibold text-[10px] tracking-wide"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Manage Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {fans.map((fan) => {
              const joinedDate = new Date(fan.subscribedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div 
                  key={fan.id} 
                  className={`group relative border rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 hover:shadow-indigo-500/10 ${
                    selectedFanIds.includes(fan.id)
                      ? 'bg-indigo-600/5 border-indigo-500/60 shadow-md shadow-indigo-500/5'
                      : 'bg-zinc-900/30 border-zinc-800/85 hover:border-indigo-500/40'
                  }`}
                >
                  {/* Subtle top-right gradient glow */}
                  <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-tr-2xl pointer-events-none group-hover:from-indigo-500/10 transition-colors duration-300" />

                  <div className="space-y-4 relative z-10">
                    {/* Top avatar and status row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedFanIds.includes(fan.id)}
                          onChange={() => handleToggleSelectFan(fan.id)}
                          className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5 flex-shrink-0 mt-1"
                        />
                        <div className="h-12 w-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-indigo-500/30 transition-colors">
                          {fan.avatarUrl ? (
                            <img src={fan.avatarUrl} alt={fan.displayName} className="object-cover h-full w-full" />
                          ) : (
                            <Users className="h-5 w-5 text-zinc-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-sm text-zinc-100 block truncate group-hover:text-white transition-colors">{fan.displayName}</span>
                          <span className="text-zinc-500 font-semibold block text-[10px] mt-0.5">@{fan.username}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                        fan.isSubscriber 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${fan.isSubscriber ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        {fan.isSubscriber ? 'Active' : 'Expired'}
                      </span>
                    </div>

                    {/* Spend & Join dates badges */}
                    <div className="grid grid-cols-2 gap-2 bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">LTV Spend</span>
                        <span className="font-black text-zinc-200 mt-1 flex items-center text-xs">
                          <DollarSign className="h-3 w-3 text-emerald-500 mr-0.5" />
                          {Number(fan.totalSpent).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Subscribed</span>
                        <span className="font-semibold text-zinc-300 mt-1 text-[11px] block">{joinedDate}</span>
                      </div>
                    </div>

                    {/* CRM Tags badges */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Tags</span>
                      <div className="flex flex-wrap gap-1 min-h-[22px] items-center">
                        {Array.isArray(fan.customTags) && fan.customTags.map((tag) => (
                          <span key={tag} className={`group/tag inline-flex items-center gap-1 border text-[9px] pl-2 pr-1.5 py-0.5 rounded-md font-bold ${getTagStyles(tag).bg}`}>
                            #{tag}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickRemoveTag(fan, tag);
                              }}
                              className="opacity-0 group-hover/tag:opacity-100 text-zinc-500 hover:text-white rounded-full transition-opacity"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </span>
                        ))}
                        {activeCardTagInput === fan.id ? (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="tag..."
                              autoFocus
                              value={quickTagText}
                              onChange={(e) => {
                                setQuickTagText(e.target.value);
                                setActiveSuggestionIndex(0);
                              }}
                              onBlur={() => {
                                // Small delay to allow clicking suggestions
                                setTimeout(() => {
                                  setActiveCardTagInput(null);
                                  setQuickTagText('');
                                }, 200);
                              }}
                              onKeyDown={(e) => {
                                const suggestionsList = availableTags.filter(
                                  (t) => !fan.customTags.includes(t) && t.toLowerCase().includes(quickTagText.toLowerCase())
                                );
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestionsList.length - 1));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
                                } else if (e.key === 'Enter' || e.key === 'Tab') {
                                  e.preventDefault();
                                  if (quickTagText.trim() && suggestionsList.length > 0 && activeSuggestionIndex < suggestionsList.length) {
                                    const selected = suggestionsList[activeSuggestionIndex];
                                    const updatedTags = [...fan.customTags, selected];
                                    (async () => {
                                      try {
                                        const res = await fetch('/api/fans', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            fanId: fan.id,
                                            customTags: updatedTags,
                                          }),
                                        });
                                        if (res.ok) {
                                          const updated = await res.json();
                                          setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
                                        }
                                      } catch (err) {
                                        console.error('Error adding quick tag:', err);
                                      }
                                    })();
                                    setActiveCardTagInput(null);
                                    setQuickTagText('');
                                  } else {
                                    handleQuickAddTag(fan);
                                  }
                                } else if (e.key === 'Escape') {
                                  setActiveCardTagInput(null);
                                  setQuickTagText('');
                                }
                              }}
                              className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[9px] w-16 focus:outline-none focus:border-indigo-500 text-zinc-200"
                            />
                            
                            {/* Suggestions List */}
                            {quickTagText.trim() && (
                              (() => {
                                const suggestionsList = availableTags.filter(
                                  (t) => !fan.customTags.includes(t) && t.toLowerCase().includes(quickTagText.toLowerCase())
                                );
                                if (suggestionsList.length === 0) return null;
                                return (
                                  <div className="absolute left-0 mt-1 bg-zinc-950 border border-zinc-800 rounded shadow-xl max-h-32 overflow-y-auto z-20 w-32 divide-y divide-zinc-900">
                                    {suggestionsList.map((suggestion, index) => (
                                      <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                          const updatedTags = [...fan.customTags, suggestion];
                                          (async () => {
                                            try {
                                              const res = await fetch('/api/fans', {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  fanId: fan.id,
                                                  customTags: updatedTags,
                                                }),
                                              });
                                              if (res.ok) {
                                                const updated = await res.json();
                                                setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
                                              }
                                            } catch (err) {
                                              console.error('Error adding quick tag:', err);
                                            }
                                          })();
                                          setActiveCardTagInput(null);
                                          setQuickTagText('');
                                        }}
                                        className={`w-full text-left px-2 py-1 text-[9px] transition-colors flex items-center justify-between ${
                                          index === activeSuggestionIndex
                                            ? 'bg-indigo-600 text-white font-bold'
                                            : 'text-zinc-350 hover:text-white hover:bg-zinc-900'
                                        }`}
                                      >
                                        <span>#{suggestion}</span>
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCardTagInput(fan.id);
                              setQuickTagText('');
                            }}
                            className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 text-[9px] px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 transition-colors"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer row */}
                  <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {fan.expiresAt ? `Expires: ${new Date(fan.expiresAt).toLocaleDateString()}` : 'No expiry'}
                    </span>
                    <button
                      onClick={() => setSelectedFan(fan)}
                      className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 font-bold text-[10px] tracking-wide"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Manage Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls Footer */}
        {fans.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-800/60 bg-zinc-950/20 text-xs">
            <div className="text-zinc-500 font-semibold">
              Showing <span className="text-zinc-300 font-bold">{totalCount === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
              <span className="text-zinc-300 font-bold">{Math.min(page * limit, totalCount)}</span> of{' '}
              <span className="text-zinc-300 font-bold">{totalCount}</span> entries
            </div>

            <div className="flex items-center gap-4">
              {/* Entries count size selector */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl py-1 px-2.5 text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer text-xs font-semibold"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>

              {/* Navigation button toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-950 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl transition-all font-bold disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-zinc-400 font-semibold px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-950 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl transition-all font-bold disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Detail Slide-out Drawer Modal */}
      {selectedFan && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-indigo-400" />
                  Subscriber Profile Detail
                </h2>
                <button
                  onClick={() => setSelectedFan(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Fan Details Avatar Card */}
              <div className="flex flex-col items-center text-center p-4 bg-zinc-950/30 border border-zinc-800/60 rounded-2xl">
                <div className="h-16 w-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden mb-3">
                  {selectedFan.avatarUrl ? (
                    <img src={selectedFan.avatarUrl} alt={selectedFan.displayName} className="object-cover h-full w-full" />
                  ) : (
                    <Users className="h-8 w-8 text-zinc-500" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-zinc-200">{selectedFan.displayName}</h3>
                <p className="text-xs text-zinc-500">@{selectedFan.username}</p>
                <div className="flex items-center gap-1.5 mt-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-black text-zinc-300">LTV Spent: ${Number(selectedFan.totalSpent).toFixed(2)}</span>
                </div>
              </div>

              {/* Sub Details Info */}
              <div className="bg-zinc-950/20 border border-zinc-850 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>OnlyFans UID:</span>
                  <span className="font-semibold text-zinc-300">{selectedFan.ofId}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Subscription State:</span>
                  <span className={`font-bold ${selectedFan.isSubscriber ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedFan.isSubscriber ? 'Active' : 'Expired'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Subscribed Date:</span>
                  <span className="font-semibold text-zinc-300">
                    {new Date(selectedFan.subscribedAt).toLocaleDateString()}
                  </span>
                </div>
                {selectedFan.expiresAt && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Expiration Date:</span>
                    <span className="font-semibold text-zinc-300">
                      {new Date(selectedFan.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* CRM Tags section layout placeholder */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Custom CRM Badging Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFan.customTags.map((tag) => (
                    <span key={tag} className={`text-xs border pl-2.5 pr-1.5 py-1 rounded-full flex items-center gap-1 font-semibold ${getTagStyles(tag).bg}`}>
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-zinc-500 hover:text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="New tag..."
                      value={newTag}
                      onChange={(e) => {
                        setNewTag(e.target.value);
                        setActiveSuggestionIndex(0);
                      }}
                      onFocus={() => setIsTagInputFocused(true)}
                      onBlur={() => {
                        // Small delay to allow clicking options
                        setTimeout(() => setIsTagInputFocused(false), 200);
                      }}
                      onKeyDown={(e) => {
                        const suggestionsList = availableTags.filter(
                          (t) => !selectedFan.customTags.includes(t) && t.toLowerCase().includes(newTag.toLowerCase())
                        );
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestionsList.length - 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
                        } else if (e.key === 'Enter' || e.key === 'Tab') {
                          e.preventDefault();
                          if (newTag.trim() && suggestionsList.length > 0 && activeSuggestionIndex < suggestionsList.length) {
                            const selected = suggestionsList[activeSuggestionIndex];
                            const updatedTags = [...selectedFan.customTags, selected];
                            setSelectedFan({ ...selectedFan, customTags: updatedTags });
                            setNewTag('');
                          } else {
                            handleAddTag();
                          }
                        } else if (e.key === 'Escape') {
                          setIsTagInputFocused(false);
                        }
                      }}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-zinc-200"
                    />
                    <button
                      onClick={handleAddTag}
                      className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 p-2 rounded-xl border border-zinc-800 text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>

                  {/* Autocomplete Suggestions Box */}
                  {isTagInputFocused && newTag.trim() && (
                    (() => {
                      const suggestionsList = availableTags.filter(
                        (t) => !selectedFan.customTags.includes(t) && t.toLowerCase().includes(newTag.toLowerCase())
                      );
                      if (suggestionsList.length === 0) return null;
                      return (
                        <div className="absolute left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl max-h-40 overflow-y-auto z-20 divide-y divide-zinc-900">
                          {suggestionsList.map((suggestion, index) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                const updatedTags = [...selectedFan.customTags, suggestion];
                                setSelectedFan({ ...selectedFan, customTags: updatedTags });
                                setNewTag('');
                              }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                                index === activeSuggestionIndex
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'text-zinc-350 hover:text-white hover:bg-zinc-900'
                              }`}
                            >
                              <span>#{suggestion}</span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                index === activeSuggestionIndex ? 'text-indigo-200' : 'text-zinc-600'
                              }`}>
                                existing
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* CRM Notes Textarea layout placeholder */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Operator Profile Notes</span>
                <textarea
                  placeholder="Enter details like fan characteristics, PPV conversion conversions records..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 h-28 resize-none font-sans"
                />
              </div>
            </div>

            {/* Save notes button */}
            <div className="pt-4 border-t border-zinc-800 mt-6 flex justify-end gap-3 items-center">
              {savingSuccess && (
                <span className="text-xs text-green-400 font-bold flex items-center gap-1 mr-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 animate-bounce" />
                  Saved!
                </span>
              )}
              <button
                onClick={() => setSelectedFan(null)}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 px-4 rounded-xl border border-zinc-800 font-semibold"
              >
                Close Profile
              </button>
              <button
                onClick={handleSaveDetails}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Notes & Tags'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Dock */}
      {selectedFanIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 px-6 py-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-8 z-40 text-xs text-white backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 max-w-xl w-11/12">
          {bulkTagAction ? (
            <div className="flex items-center gap-3 w-full justify-between">
              <span className="font-extrabold text-zinc-350">
                {bulkTagAction === 'add' ? 'Add tag to' : 'Remove tag from'} {selectedFanIds.length} subscribers:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="tag name..."
                  value={bulkTagText}
                  onChange={(e) => setBulkTagText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBulkTagSubmit();
                  }}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 w-32 font-bold"
                />
                <button
                  onClick={handleBulkTagSubmit}
                  disabled={bulkProcessing || !bulkTagText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl disabled:opacity-55"
                >
                  {bulkProcessing ? 'Applying...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setBulkTagAction(null);
                    setBulkTagText('');
                  }}
                  className="text-zinc-500 hover:text-zinc-300 font-semibold px-2 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-extrabold text-zinc-200">{selectedFanIds.length} subscribers selected</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBulkTagAction('add')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl transition-all"
                >
                  Add Tag
                </button>
                <button
                  onClick={() => setBulkTagAction('remove')}
                  className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 px-3.5 py-2 rounded-xl transition-all font-bold"
                >
                  Remove Tag
                </button>
                <button
                  onClick={() => setBulkMessageModalOpen(true)}
                  className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 px-3.5 py-2 rounded-xl transition-all font-bold"
                >
                  Send Message
                </button>
                
                <div className="w-[1px] h-6 bg-zinc-800 mx-1" />

                <button
                  onClick={() => setSelectedFanIds([])}
                  className="text-zinc-500 hover:text-zinc-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bulk Message Modal */}
      {bulkMessageModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm text-zinc-150 flex items-center gap-2">
                <Send className="h-4 w-4 text-indigo-400" />
                Bulk Message Outreach ({selectedFanIds.length} selected)
              </h3>
              <button
                onClick={() => setBulkMessageModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Message Template</span>
              <textarea
                placeholder="Type your message here. Use {name} to personalize each recipient's name (e.g. Hey {name}!)..."
                value={bulkMessageText}
                onChange={(e) => setBulkMessageText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 h-32 resize-none font-sans"
              />
              <p className="text-[10px] text-zinc-500 italic font-medium">
                * Dynamic tags supported: <strong className="text-zinc-300">{`{name}`}</strong> will be replaced by the subscriber's display first name.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setBulkMessageModalOpen(false)}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 px-4 rounded-xl border border-zinc-800 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBulkMessage}
                disabled={sendingBulkMessage || !bulkMessageText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingBulkMessage ? 'Sending...' : 'Dispatch Message'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Global Tag Manager Modal */}
      {tagManagerOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm text-zinc-150 flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-400" />
                CRM Tags Library
              </h3>
              <button
                onClick={() => {
                  setTagManagerOpen(false);
                  setRenamingTag(null);
                }}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List of active tags */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {availableTags.length === 0 ? (
                <p className="text-zinc-500 text-xs italic text-center py-8">No custom tags created yet.</p>
              ) : (
                <div className="space-y-2">
                  {availableTags.map((tag) => {
                    const count = fans.filter(f => Array.isArray(f.customTags) && f.customTags.includes(tag)).length;
                    return (
                      <div key={tag} className="flex items-center justify-between bg-zinc-950/40 border border-zinc-800/60 p-2.5 rounded-xl text-xs">
                        {renamingTag === tag ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={renameText}
                              onChange={(e) => setRenameText(e.target.value)}
                              className="flex-1 bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-bold"
                            />
                            <button
                              onClick={() => handleRenameTagConfirm(tag)}
                              className="text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setRenamingTag(null)}
                              className="text-zinc-550 hover:text-zinc-350 font-semibold px-2 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5">
                              <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold ${getTagStyles(tag).bg}`}>
                                #{tag}
                              </span>
                              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
                                {count} active in list
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setRenamingTag(tag);
                                  setRenameText(tag);
                                }}
                                className="text-zinc-500 hover:text-white p-1"
                                title="Rename tag globally"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTagConfirm(tag)}
                                className="text-zinc-500 hover:text-red-400 p-1"
                                title="Delete tag globally"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  setTagManagerOpen(false);
                  setRenamingTag(null);
                }}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 px-4 rounded-xl border border-zinc-800 font-semibold"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Following view */}
      {isUsersView && fansTab === 'following' && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6 text-left">
          <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
            Following List [GET]
          </h2>
          {loadingSubFeatures ? (
            <div className="py-12 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-[#7C5CFC]" /></div>
          ) : followingList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followingList.map((creator, idx) => (
                <div key={idx} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-center gap-3">
                  <img src={creator.avatarUrl} className="h-10 w-10 rounded-full object-cover" alt="avatar" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-zinc-200 truncate">{creator.displayName}</h4>
                    <p className="text-[10px] text-zinc-500 truncate">@{creator.username}</p>
                    <p className="text-[9px] text-[#7C5CFC] font-semibold mt-1">Followed: {new Date(creator.followedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-black uppercase">Active</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-xs">Not following any accounts currently.</div>
          )}
        </div>
      )}

      {/* Collections view */}
      {isUsersView && fansTab === 'collections' && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6 text-left relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/60 pb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#7C5CFC]" />
                User Lists & Collections (OnlyFans API)
              </h2>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                Organize your subscribers into custom groups and campaigns for bulk outreach.
              </p>
            </div>
            <button
              onClick={() => setCreateListModalOpen(true)}
              className="self-start sm:self-center bg-[#7C5CFC] hover:bg-[#6844fc] text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Collection
            </button>
          </div>

          {loadingSubFeatures ? (
            <div className="py-12 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-[#7C5CFC]" /></div>
          ) : collectionsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collectionsList.map((list) => (
                <div key={list.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl flex flex-col justify-between h-36 transition-all hover:border-zinc-700/60 shadow-lg group">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-zinc-250 uppercase tracking-wide truncate">{list.name}</h4>
                      <p className="text-[9px] text-zinc-550 mt-1 font-medium">Created: {new Date(list.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setRenameListId(list.id);
                          setRenameListName(list.name);
                          setRenameListModalOpen(true);
                        }}
                        className="text-zinc-550 hover:text-white p-1 rounded hover:bg-zinc-900 transition-all"
                        title="Rename List"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        disabled={deletingList === list.id}
                        className="text-zinc-550 hover:text-red-400 p-1 rounded hover:bg-zinc-900 transition-all disabled:opacity-50"
                        title="Delete List"
                      >
                        {deletingList === list.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-zinc-900 pt-3 mt-2">
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      {list.userCount} Users
                    </span>
                    <button
                      onClick={() => setSelectedList(list)}
                      className="text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-750 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Users className="h-3 w-3 text-[#7C5CFC]" />
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-xs">No collections lists found.</div>
          )}
        </div>
      )}

      {/* CREATE COLLECTION LIST MODAL */}
      {createListModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateList} className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm text-zinc-150 flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#7C5CFC]" />
                Create New Collection
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCreateListName('');
                  setCreateListModalOpen(false);
                }}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Collection Name</label>
              <input
                type="text"
                placeholder="e.g. VIP Whales Group"
                value={createListName}
                onChange={(e) => setCreateListName(e.target.value)}
                maxLength={64}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 font-semibold"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setCreateListName('');
                  setCreateListModalOpen(false);
                }}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 px-4 rounded-xl border border-zinc-800 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingList || !createListName.trim()}
                className="bg-[#7C5CFC] hover:bg-[#6844fc] text-white text-xs py-2 px-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {creatingList ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RENAME COLLECTION LIST MODAL */}
      {renameListModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRenameList} className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm text-zinc-150 flex items-center gap-2">
                <Edit2 className="h-3.5 w-3.5 text-[#7C5CFC]" />
                Rename Collection
              </h3>
              <button
                type="button"
                onClick={() => {
                  setRenameListName('');
                  setRenameListId('');
                  setRenameListModalOpen(false);
                }}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Collection Name</label>
              <input
                type="text"
                placeholder="New name..."
                value={renameListName}
                onChange={(e) => setRenameListName(e.target.value)}
                maxLength={64}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-3.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 font-semibold"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setRenameListName('');
                  setRenameListId('');
                  setRenameListModalOpen(false);
                }}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 px-4 rounded-xl border border-zinc-800 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renamingList || !renameListName.trim()}
                className="bg-[#7C5CFC] hover:bg-[#6844fc] text-white text-xs py-2 px-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {renamingList ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MANAGE COLLECTION LIST DRAWER */}
      {selectedList && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-zinc-100 flex items-center gap-2 truncate uppercase tracking-wider">
                    <Users className="h-4 w-4 text-[#7C5CFC]" />
                    {selectedList.name}
                  </h2>
                  <p className="text-[9px] text-zinc-550 font-bold uppercase mt-1">Manage List Members</p>
                </div>
                <button
                  onClick={() => setSelectedList(null)}
                  className="text-zinc-550 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Add Member Subsection */}
              <div className="bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl space-y-3">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Add Subscriber to Collection</span>
                <div className="flex gap-2">
                  <select
                    value={userToAddToList}
                    onChange={(e) => setUserToAddToList(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl text-xs font-semibold py-2.5 px-3 text-zinc-300 outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Subscriber --</option>
                    {/* Only show subscribers not currently in the list */}
                    {fans
                      .filter(f => !listUsers.some(lu => lu.id === f.id))
                      .map(f => (
                        <option key={f.id} value={f.id}>
                          {f.displayName} (@{f.username})
                        </option>
                      ))
                    }
                  </select>
                  <button
                    onClick={handleAddUserToList}
                    disabled={addingUser || !userToAddToList}
                    className="bg-[#7C5CFC] hover:bg-[#6844fc] text-white text-xs font-bold px-4 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 animate-pulse-once"
                  >
                    {addingUser ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5" />
                    )}
                    Add
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    Members ({listUsers.length})
                  </span>
                  {listUsers.length > 0 && (
                    <button
                      onClick={handleClearList}
                      disabled={clearingList}
                      className="text-[9px] font-black text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {clearingList ? (
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <UserMinus className="h-2.5 w-2.5" />
                      )}
                      Clear List
                    </button>
                  )}
                </div>

                {loadingListUsers ? (
                  <div className="py-8 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-[#7C5CFC]" /></div>
                ) : listUsers.length > 0 ? (
                  <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                    {listUsers.map((user) => (
                      <div key={user.id} className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl flex items-center justify-between gap-3 group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.displayName} className="object-cover h-full w-full" />
                            ) : (
                              <Users className="h-4 w-4 text-zinc-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-extrabold text-zinc-200 truncate">{user.displayName}</h4>
                            <p className="text-[9px] text-zinc-550 truncate">@{user.username}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveUserFromList(user.id)}
                          disabled={removingUser === user.id}
                          className="text-zinc-650 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition-all disabled:opacity-50"
                          title="Remove user from list"
                        >
                          {removingUser === user.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-zinc-550 text-[10px] font-medium italic">
                    This collection has no members. Select a subscriber above to add them.
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="border-t border-zinc-800 pt-4 mt-6">
              <button
                onClick={() => setSelectedList(null)}
                className="w-full bg-zinc-850 hover:bg-zinc-800 text-zinc-350 hover:text-white text-xs py-2.5 px-4 rounded-xl border border-zinc-800 font-bold transition-all text-center"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Public Profiles view */}
      {isPublicProfiles && (
        <div className="space-y-6 text-left animate-in fade-in duration-200">
          <div className="border-b border-zinc-800/60 pb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <Users className="h-7 w-7 text-indigo-500" />
              Public Creator Profiles
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              View and manage public OnlyFans profile settings and public information for <strong className="text-zinc-300">@{activeCreator.username}</strong>
            </p>
            <span className="text-[10px] font-mono text-zinc-600 mt-1 block">GET /api/creators/profiles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6 relative overflow-hidden group">
              {/* Banner Placeholder */}
              <div className="h-32 w-full bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-b border-zinc-800/80 -mt-6 -mx-6 mb-4 flex items-center justify-center">
                <span className="text-zinc-600 text-xs font-black uppercase tracking-widest">Public Banner URL</span>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-zinc-950 border-2 border-indigo-500/30 overflow-hidden flex items-center justify-center font-black text-indigo-400 uppercase text-lg shrink-0">
                  {activeCreator.username.substring(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold text-zinc-200 flex items-center gap-2">
                    {activeCreator.username.replace('_', ' ')}
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live Profile" />
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold">@{activeCreator.username}</p>
                </div>
              </div>

              <div className="border-t border-zinc-800/60 pt-4 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Bio / About Description</span>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed mt-1">
                    Hey guys! Welcome to my official page. I post exclusive daily updates, interact with all my fans in DM, and stream weekly. Subscribe to get full access to my catalog! ✨
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-zinc-800/40 pt-4">
                  <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl text-center">
                    <span className="text-[9px] text-zinc-600 block font-bold uppercase tracking-wider">Posts</span>
                    <span className="text-sm font-black text-zinc-200 mt-1 block">342</span>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl text-center">
                    <span className="text-[9px] text-zinc-600 block font-bold uppercase tracking-wider">Photos</span>
                    <span className="text-sm font-black text-zinc-200 mt-1 block">1,289</span>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl text-center">
                    <span className="text-[9px] text-zinc-600 block font-bold uppercase tracking-wider">Likes</span>
                    <span className="text-sm font-black text-zinc-200 mt-1 block">48.2k</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-850 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-600">OnlyFans.com/{activeCreator.username}</span>
                <a
                  href={`https://onlyfans.com/${activeCreator.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Visit Profile External
                </a>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800/60 pb-3 flex items-center gap-2">
                Configure Public Visibility
              </h3>
              
              <div className="space-y-4 text-xs font-medium text-zinc-400">
                <div className="flex justify-between items-center bg-zinc-950/30 border border-zinc-850 p-3 rounded-xl">
                  <div>
                    <span className="text-zinc-200 block">Show subscriber count publicly</span>
                    <span className="text-[10px] text-zinc-500">Hide/display total subs on your public OnlyFans page.</span>
                  </div>
                  <button className="h-6 w-11 rounded-full bg-indigo-600 p-0.5 transition-colors relative cursor-pointer">
                    <span className="h-5 w-5 rounded-full bg-white block translate-x-5" />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-zinc-950/30 border border-zinc-850 p-3 rounded-xl">
                  <div>
                    <span className="text-zinc-200 block">Allow guest comments</span>
                    <span className="text-[10px] text-zinc-500">Allow non-subscribers to comment on public posts.</span>
                  </div>
                  <button className="h-6 w-11 rounded-full bg-zinc-950 border border-zinc-800 p-0.5 transition-colors relative cursor-pointer">
                    <span className="h-5 w-5 rounded-full bg-zinc-700 block" />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-zinc-950/30 border border-zinc-850 p-3 rounded-xl">
                  <div>
                    <span className="text-zinc-200 block">Enable search engine indexing</span>
                    <span className="text-[10px] text-zinc-500">List your OnlyFans page in Google/Bing search results.</span>
                  </div>
                  <button className="h-6 w-11 rounded-full bg-indigo-600 p-0.5 transition-colors relative cursor-pointer">
                    <span className="h-5 w-5 rounded-full bg-white block translate-x-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
