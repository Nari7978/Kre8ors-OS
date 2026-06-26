'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { 
  Users, UserCheck, Sliders, RefreshCw, X, Check, Search, DollarSign, Clock,
  Trash2, Plus
} from 'lucide-react';
import { Creator } from '@/types';

interface OperatorStats {
  totalRevenue: number;
  totalShiftsCount: number;
  totalDurationMinutes: number;
  isShiftActive: boolean;
  activeShiftId: string | null;
}

interface OperatorAssignment {
  assignmentId: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string | null;
}

interface Operator {
  id: string;
  email: string;
  name: string;
  role: 'AGENCY_OWNER' | 'MANAGER' | 'CHATTER' | 'CREATOR';
  createdAt: string;
  assignments: OperatorAssignment[];
  stats: OperatorStats;
}

export default function TeamPage() {
  const { activeCreator } = useGlobalStore();
  const [team, setTeam] = useState<Operator[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingAssignment, setUpdatingAssignment] = useState<string | null>(null);

  // Invitation Form State
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'AGENCY_OWNER' | 'MANAGER' | 'CHATTER'>('CHATTER');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal / Drawer state for managing assignment
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  // Fetch Team & Creators
  const loadTeamData = async () => {
    setLoading(true);
    try {
      const resTeam = await fetch('/api/team');
      if (resTeam.ok) {
        const teamData = await resTeam.json();
        setTeam(teamData);
      }

      const resCreators = await fetch('/api/creators');
      if (resCreators.ok) {
        const creatorsData = await resCreators.json();
        setCreators(creatorsData);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  const handleToggleAssignment = async (userId: string, creatorId: string) => {
    setUpdatingAssignment(`${userId}-${creatorId}`);
    try {
      const res = await fetch('/api/team/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, creatorId }),
      });

      if (res.ok) {
        // Reload team data to get fresh assignments structure
        const resTeam = await fetch('/api/team');
        if (resTeam.ok) {
          const teamData = await resTeam.json();
          setTeam(teamData);
          
          // If we have an operator open in the sidebar, update their active state
          if (selectedOperator && selectedOperator.id === userId) {
            const updatedOp = teamData.find((o: Operator) => o.id === userId);
            setSelectedOperator(updatedOp || null);
          }
        }
      }
    } catch (err) {
      console.error('Error toggling assignment:', err);
    } finally {
      setUpdatingAssignment(null);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!newEmail.trim() || !newPassword.trim() || !newName.trim() || !newRole) {
      setCreateError('Please fill out all fields.');
      return;
    }
    if (!newEmail.includes('@')) {
      setCreateError('Please enter a valid email address.');
      return;
    }
    console.log('Mock create operator payload:', { newEmail, newPassword, newName, newRole });
    setCreateOpen(false);
  };

  const handleDeleteMember = async (userId: string) => {
    console.log('Mock delete operator:', userId);
  };

  // Filter logic
  const filteredTeam = team.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      roleFilter === 'ALL' || 
      member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Aggregated Team Stats
  const totalOperatorsCount = team.length;
  const activeShiftsCount = team.filter((o) => o.stats.isShiftActive).length;
  const totalAgencyRevenueSeeded = team.reduce((sum, o) => sum + o.stats.totalRevenue, 0);
  const totalHoursWorked = Math.round(
    team.reduce((sum, o) => sum + o.stats.totalDurationMinutes, 0) / 60
  );

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full relative">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-500" />
            Team Management & Shift Logs
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage agency roles, chatter assignments to creators, and track live shift revenue logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateOpen(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10 border-0"
          >
            <Plus className="h-4 w-4" />
            Add Team Member
          </button>
          <button
            onClick={loadTeamData}
            disabled={loading}
            className="text-xs bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3.5 py-1.5 rounded-lg text-zinc-300 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-500' : 'text-zinc-400'}`} />
            Refresh Registry
          </button>
        </div>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total staff */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Users className="h-16 w-16 text-blue-500" />
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Operators</p>
          <h3 className="text-2xl font-bold text-zinc-100 mt-2">{totalOperatorsCount}</h3>
          <span className="text-[9px] text-zinc-500 block mt-1">Agency staff members</span>
        </div>

        {/* Active shifts */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group border-indigo-500/20">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <UserCheck className="h-16 w-16 text-indigo-500" />
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Live Operators</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {activeShiftsCount} Active
          </h3>
          <span className="text-[9px] text-zinc-500 block mt-1">Currently tracking shift sessions</span>
        </div>

        {/* Total revenue */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <DollarSign className="h-16 w-16 text-emerald-500" />
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Shift Revenue</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">${totalAgencyRevenueSeeded.toFixed(2)}</h3>
          <span className="text-[9px] text-zinc-500 block mt-1">Combined operator results</span>
        </div>

        {/* Hours tracked */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Clock className="h-16 w-16 text-purple-500" />
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Time Tracked</p>
          <h3 className="text-2xl font-bold text-zinc-100 mt-2">{totalHoursWorked} hrs</h3>
          <span className="text-[9px] text-zinc-500 block mt-1">Duration log sum</span>
        </div>
      </div>

      {/* Directory filters & search bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/30 border border-zinc-800/80 p-4 rounded-2xl backdrop-blur-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search operators by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 placeholder-zinc-600 font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Sliders className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-400 font-medium">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
          >
            <option value="ALL">All Roles</option>
            <option value="AGENCY_OWNER">Owners</option>
            <option value="MANAGER">Managers</option>
            <option value="CHATTER">Chatters</option>
          </select>
        </div>
      </div>

      {/* Team Directory Grid */}
      {loading ? (
        <div className="p-16 text-center text-zinc-500 text-sm flex items-center justify-center gap-2 bg-zinc-900/10 border border-zinc-850 rounded-2xl">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
          Querying staff registry directory...
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="p-16 text-center text-zinc-500 text-sm bg-zinc-900/10 border border-zinc-850 rounded-2xl">
          No team members match your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTeam.map((member) => {
            const roleColorMap = {
              AGENCY_OWNER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
              MANAGER: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              CHATTER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
              CREATOR: 'bg-zinc-800 text-zinc-400 border-zinc-700',
            };

            const roleLabelMap = {
              AGENCY_OWNER: 'Owner',
              MANAGER: 'Manager',
              CHATTER: 'Chatter',
              CREATOR: 'Creator',
            };

            return (
              <div 
                key={member.id}
                className={`bg-zinc-900/40 border rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between hover:border-zinc-750 transition-all group ${
                  member.stats.isShiftActive ? 'border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.05)]' : 'border-zinc-800/80'
                }`}
              >
                {/* User card header */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-extrabold text-zinc-100 text-sm group-hover:text-white transition-colors">{member.name}</h4>
                      <p className="text-zinc-550 text-[11px] font-semibold tracking-wide truncate max-w-[180px]">{member.email}</p>
                    </div>

                    <span className={`text-[9px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${roleColorMap[member.role]}`}>
                      {roleLabelMap[member.role]}
                    </span>
                  </div>

                  {/* Status Indicator Bar */}
                  <div className="flex items-center justify-between text-[10px] border-t border-zinc-800/60 pt-3">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider">Status:</span>
                    {member.stats.isShiftActive ? (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ON DUTY
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-bold uppercase">Offline</span>
                    )}
                  </div>

                  {/* Shift logs stats */}
                  <div className="bg-zinc-950/30 border border-zinc-800/60 rounded-xl p-3 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="space-y-0.5 border-r border-zinc-800/40 pr-2">
                      <span className="text-zinc-500 block uppercase font-bold tracking-wider">Revenue Logs</span>
                      <strong className="text-emerald-400 font-mono text-xs">${member.stats.totalRevenue.toFixed(2)}</strong>
                    </div>
                    <div className="space-y-0.5 pl-1">
                      <span className="text-zinc-500 block uppercase font-bold tracking-wider">Hours Worked</span>
                      <strong className="text-zinc-300 text-xs">{(member.stats.totalDurationMinutes / 60).toFixed(1)} hrs</strong>
                    </div>
                  </div>

                  {/* Active allocations summary */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] uppercase font-extrabold text-zinc-500 tracking-wider block">
                      Creator Allocations ({member.assignments.length})
                    </span>
                    {member.assignments.length === 0 ? (
                      <span className="text-[10px] text-zinc-500 italic block">No creator accounts assigned</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {member.assignments.map((a) => (
                          <span 
                            key={a.assignmentId}
                            className="bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-[9px] text-zinc-350 font-semibold"
                          >
                            @{a.creatorUsername}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer CTA */}
                {member.role === 'CHATTER' && (
                  <div className="pt-5 border-t border-zinc-800/60 mt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedOperator(member)}
                      className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="h-3 w-3" />
                      Manage Assignments
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Assignment Config drawer/modal overlay */}
      {selectedOperator && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end">
          <div className="h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between shadow-2xl relative">
            {/* Header info */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="font-extrabold text-white text-sm">Creator Assignments</h3>
                    <p className="text-[10px] text-zinc-400 font-semibold">Operator: {selectedOperator.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOperator(null)}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-1.5 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Assignment toggle checklist */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-extrabold text-zinc-500 tracking-wider block">
                  Toggle allocations below:
                </span>
                
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {creators.map((creator) => {
                    const isAssigned = selectedOperator.assignments.some(
                      (a) => a.creatorId === creator.id
                    );
                    const isBusy = updatingAssignment === `${selectedOperator.id}-${creator.id}`;

                    return (
                      <div 
                        key={creator.id}
                        onClick={() => !isBusy && handleToggleAssignment(selectedOperator.id, creator.id)}
                        className={`p-3 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                          isAssigned 
                            ? 'bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50' 
                            : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {creator.avatarUrl ? (
                            <img 
                              src={creator.avatarUrl} 
                              alt={creator.displayName}
                              className="h-7 w-7 rounded-full object-cover border border-zinc-800"
                            />
                          ) : (
                            <span className="h-7 w-7 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-[10px] font-bold border border-zinc-800">
                              {creator.displayName[0]}
                            </span>
                          )}
                          <div>
                            <h5 className="text-[11px] font-bold text-zinc-200">{creator.displayName}</h5>
                            <span className="text-[9px] text-zinc-500 font-semibold block">@{creator.username}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          {isBusy ? (
                            <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                          ) : isAssigned ? (
                            <div className="h-4.5 w-4.5 rounded-full bg-indigo-600 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white font-bold" />
                            </div>
                          ) : (
                            <div className="h-4.5 w-4.5 rounded-full border border-zinc-800 hover:border-zinc-700" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="border-t border-zinc-800 pt-4 mt-6 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-semibold">Allocations auto-save on change</span>
              <button
                type="button"
                onClick={() => setSelectedOperator(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Close Registry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Team Member drawer overlay */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end">
          <form 
            onSubmit={handleCreateMember}
            className="h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between shadow-2xl relative"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-extrabold text-white text-sm">Add Team Member</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-1.5 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {createError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl font-semibold">
                  {createError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-450">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Sarah Connor"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-450">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@agency.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-450">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-450">Agency Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 text-zinc-200 cursor-pointer"
                  >
                    <option value="CHATTER">Chatter (Operator)</option>
                    <option value="MANAGER">Manager (Administrator)</option>
                    <option value="AGENCY_OWNER">Agency Owner (Full Access)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer border border-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer border-0 disabled:opacity-50"
              >
                {creating ? 'Inviting...' : 'Add Operator'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
