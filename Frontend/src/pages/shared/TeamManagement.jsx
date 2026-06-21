import React, { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, ShieldAlert, Edit2, Power, KeyRound, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import useAuthStore from '../../store/useAuthStore';

const LiveBreakTimer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const update = () => {
      const start = new Date(startTime).getTime();
      setElapsed(Math.floor((new Date().getTime() - start) / 1000));
    };
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, [startTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return <span>{`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`}</span>;
};
const TeamManagement = () => {
  const user = useAuthStore(state => state.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [resetModal, setResetModal] = useState({ isOpen: false, targetId: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, targetId: null, username: '' });
  const [suspendModal, setSuspendModal] = useState({ isOpen: false, targetId: null, username: '', is_active: true });
  const [lockModal, setLockModal] = useState({ isOpen: false, targetId: null, username: '', is_locked: false });
  const [suspensionNote, setSuspensionNote] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  
  const subordinateRole = user?.role === 'ADMIN' ? 'SUB_ADMIN' : 'SUB_POLICE';
  const roleName = user?.role === 'ADMIN' ? 'Sub Admin' : 'Sub Police Officer';
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: subordinateRole,
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    fetchUsers();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users/');
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load team members.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await api.put(`/admin/users/${editingUserId}/`, formData);
        toast.success(`Account updated successfully!`);
      } else {
        await api.post('/admin/users/', { ...formData, role: subordinateRole });
        toast.success(`Account created successfully!`);
      }
      setShowForm(false);
      setEditingUserId(null);
      setFormData({ username: '', email: '', password: '', role: subordinateRole, first_name: '', last_name: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process request.');
    }
  };

  const handleToggleStatus = async (e) => {
    e.preventDefault();
    try {
      const response = await api.patch(`/admin/users/${suspendModal.targetId}/`, { 
        action: 'toggle_active',
        password: authPassword,
        suspension_note: suspensionNote
      });
      toast.success(response.data.message);
      setSuspendModal({ isOpen: false, targetId: null, username: '', is_active: true });
      setAuthPassword('');
      setSuspensionNote('');
      setActiveDropdown(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update account status. Incorrect password?');
    }
  };

  const handleToggleLock = async (e) => {
    e.preventDefault();
    try {
      const response = await api.patch(`/admin/users/${lockModal.targetId}/`, { 
        action: 'toggle_lock',
        password: authPassword,
        suspension_note: suspensionNote
      });
      toast.success(response.data.message);
      setLockModal({ isOpen: false, targetId: null, username: '', is_locked: false });
      setAuthPassword('');
      setSuspensionNote('');
      setActiveDropdown(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update account lock status. Incorrect password?');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/admin/users/${resetModal.targetId}/reset-password/`, {
        new_password: tempPassword
      });
      toast.success(response.data.message);
      setResetModal({ isOpen: false, targetId: null });
      setTempPassword('');
      setActiveDropdown(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password.');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      const response = await api.delete(`/admin/users/${deleteModal.targetId}/`, {
        data: { password: authPassword }
      });
      toast.success(response.data.message);
      setDeleteModal({ isOpen: false, targetId: null, username: '' });
      setAuthPassword('');
      setActiveDropdown(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account. Incorrect password?');
    }
  };

  const openEditForm = (userToEdit) => {
    setFormData({
      username: userToEdit.username,
      email: userToEdit.email,
      role: userToEdit.role,
      first_name: userToEdit.first_name,
      last_name: userToEdit.last_name
    });
    setEditingUserId(userToEdit.id);
    setShowForm(true);
    setActiveDropdown(null);
  };

  if (loading) {
    return <div className="text-white">Loading team data...</div>;
  }

  const createdCount = users.length;
  const isLimitReached = createdCount >= 5;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-500" />
            Team Management
          </h1>
          <p className="text-slate-400 mt-1">
            Team creation is completely optional. You may create up to 5 delegated {roleName} accounts to assist you, or choose to work independently.
          </p>
        </div>
        
        {!showForm && (
          <button
            onClick={() => {
              setEditingUserId(null);
              setFormData({ username: '', email: '', password: '', role: subordinateRole, first_name: '', last_name: '' });
              setShowForm(true);
            }}
            disabled={isLimitReached}
            className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 ${isLimitReached ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {isLimitReached ? 'Limit Reached' : 'Create Account'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-[#0f172a] border border-white/5 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Subordinate Allocation (Optional)</h3>
            <div className="text-2xl font-black text-white mt-1">{createdCount} / 5 <span className="text-sm font-normal text-slate-500">Accounts Created</span></div>
          </div>
          {isLimitReached && <div className="text-orange-400 text-sm font-bold bg-orange-400/10 px-3 py-1 rounded-full">Maximum Capacity</div>}
        </div>
        <div className="w-full bg-black/40 h-3 rounded-full mt-4 overflow-hidden border border-white/5">
          <div className={`h-full rounded-full ${isLimitReached ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${(createdCount / 5) * 100}%` }}></div>
        </div>
      </div>

      {/* Form Overlay */}
      {showForm && (
        <div className="bg-[#0f172a] border border-blue-500/20 p-6 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.1)] mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            {editingUserId ? <Edit2 className="w-5 h-5 mr-2 text-blue-500" /> : <UserPlus className="w-5 h-5 mr-2 text-blue-500" />}
            {editingUserId ? 'Edit Account Details' : `Create New ${roleName}`}
          </h2>
          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Username</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">First Name</label>
                <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Name</label>
                <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all" />
              </div>
            </div>

            {!editingUserId && (
              <div className="space-y-1 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Initial Password</label>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} minLength="8" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all pr-12" placeholder="Minimum 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-white/5 mt-6">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                {editingUserId ? 'Save Changes' : 'Create Account'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-[#0f172a] rounded-2xl border border-white/5 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400">
              <th className="p-4 font-bold rounded-tl-2xl">Name / Username</th>
              <th className="p-4 font-bold">Email</th>
              <th className="p-4 font-bold">Account Status</th>
              <th className="p-4 font-bold">Activity</th>
              <th className="p-4 font-bold">Breaks</th>
              <th className="p-4 font-bold text-right rounded-tr-2xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-bold">No subordinate accounts created.</p>
                  <p className="text-sm mt-1">You are currently working independently. You may create accounts using the button above if needed.</p>
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.first_name} {u.last_name}</div>
                    <div className="text-sm text-slate-400">@{u.username}</div>
                  </td>
                  <td className="p-4 text-slate-300">{u.email}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      {u.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span> SUSPENDED
                        </span>
                      )}
                      {u.is_locked && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <Lock className="w-3 h-3 mr-1" /> LOCKED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      {u.activity_status === 'ONLINE' && <span className="flex items-center text-emerald-400 text-xs font-bold tracking-widest"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> ONLINE</span>}
                      {u.activity_status === 'OFFLINE' && <span className="flex items-center text-slate-500 text-xs font-bold tracking-widest"><span className="w-2 h-2 rounded-full bg-slate-500 mr-2"></span> OFFLINE</span>}
                      {u.activity_status === 'ON_BREAK' && <span className="flex items-center text-yellow-500 text-xs font-bold tracking-widest"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span> ON BREAK {u.active_break_start && <span className="ml-1.5 text-[10px] bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-400 font-mono tracking-normal">(<LiveBreakTimer startTime={u.active_break_start} />)</span>}</span>}
                      {u.login_time && <span className="text-[10px] text-slate-500">In: {new Date(u.login_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                      {u.logout_time && <span className="text-[10px] text-slate-500">Out: {new Date(u.logout_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-300 font-mono">
                      {u.total_break_duration > 0 ? `${Math.round(u.total_break_duration)}m` : '0m'}
                    </div>
                  </td>
                  <td className="p-4 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === u.id ? null : u.id);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors inline-flex"
                    >
                      <div className="w-1 h-1 bg-current rounded-full mx-0.5"></div>
                      <div className="w-1 h-1 bg-current rounded-full mx-0.5"></div>
                      <div className="w-1 h-1 bg-current rounded-full mx-0.5"></div>
                    </button>

                    {activeDropdown === u.id && (
                      <div 
                        ref={dropdownRef}
                        className="absolute right-6 top-12 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-2 z-[100] animate-in fade-in slide-in-from-top-2 origin-top-right duration-200"
                      >
                        <button onClick={() => openEditForm(u)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-blue-400 flex items-center transition-colors">
                          <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                        </button>
                        <button onClick={() => { setSuspendModal({ isOpen: true, targetId: u.id, username: u.username, is_active: u.is_active }); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${u.is_active ? 'text-slate-300 hover:bg-white/5 hover:text-yellow-400' : 'text-slate-300 hover:bg-white/5 hover:text-emerald-400'}`}>
                          <Power className="w-4 h-4 mr-2" /> {u.is_active ? 'Suspend Account' : 'Activate Account'}
                        </button>
                        <button onClick={() => { setLockModal({ isOpen: true, targetId: u.id, username: u.username, is_locked: u.is_locked }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-orange-400 flex items-center transition-colors">
                          {u.is_locked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />} 
                          {u.is_locked ? 'Unlock Account' : 'Lock Account'}
                        </button>
                        <button onClick={() => { setResetModal({ isOpen: true, targetId: u.id }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-orange-400 flex items-center transition-colors">
                          <KeyRound className="w-4 h-4 mr-2" /> Reset Password
                        </button>
                        <button onClick={() => { setDeleteModal({ isOpen: true, targetId: u.id, username: u.username }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-red-500 flex items-center transition-colors border-t border-white/5 mt-1 pt-2">
                          <ShieldAlert className="w-4 h-4 mr-2" /> Delete Account
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reset Password Modal */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setResetModal({ isOpen: false, targetId: null })}></div>
          <div className="bg-[#0f172a] border border-orange-500/30 rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <KeyRound className="w-5 h-5 mr-2 text-orange-500" /> Reset Subordinate Password
            </h3>
            <p className="text-sm text-slate-400 mb-6">Enter a new temporary password for this user. They will be forced to change it upon login.</p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Temporary Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required minLength="8" value={tempPassword} onChange={e => setTempPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono pr-12" placeholder="TempPass123!" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setResetModal({ isOpen: false, targetId: null })} className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)]">Set Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteModal({ isOpen: false, targetId: null, username: '' })}></div>
          <div className="bg-[#0f172a] border border-red-500/30 rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-red-500" /> Terminate Account
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              You are about to permanently delete the account for <span className="font-bold text-white">@{deleteModal.username}</span>. This action cannot be undone. Enter your own password to authorize this termination.
            </p>
            
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-1 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-all font-mono pr-12" placeholder="Your current password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setDeleteModal({ isOpen: false, targetId: null, username: '' })} className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]">Authorize Deletion</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Suspend Account Modal */}
      {suspendModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSuspendModal({ isOpen: false, targetId: null, username: '', is_active: true })}></div>
          <div className="bg-[#0f172a] border border-blue-500/30 rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <Power className={`w-5 h-5 mr-2 ${suspendModal.is_active ? 'text-yellow-500' : 'text-emerald-500'}`} /> 
              {suspendModal.is_active ? 'Suspend Account' : 'Activate Account'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              You are about to {suspendModal.is_active ? 'suspend' : 'activate'} the account for <span className="font-bold text-white">@{suspendModal.username}</span>. Enter your own password to authorize this action.
            </p>
            
            <form onSubmit={handleToggleStatus} className="space-y-4">
              {suspendModal.is_active && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Reason (Optional)</label>
                  <textarea 
                    value={suspensionNote} 
                    onChange={e => setSuspensionNote(e.target.value)} 
                    rows="2"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm" 
                    placeholder="This reason will be visible to the user..."
                  />
                </div>
              )}
              <div className="space-y-1 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono pr-12" placeholder="Your current password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setSuspendModal({ isOpen: false, targetId: null, username: '', is_active: true })} className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className={`text-white px-6 py-2 rounded-lg font-bold transition-all ${suspendModal.is_active ? 'bg-yellow-600 hover:bg-yellow-500 shadow-[0_0_15px_rgba(202,138,4,0.3)]' : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(5,150,105,0.3)]'}`}>
                  Authorize Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock Account Modal */}
      {lockModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setLockModal({ isOpen: false, targetId: null, username: '', is_locked: false })}></div>
          <div className="bg-[#0f172a] border border-orange-500/30 rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              {lockModal.is_locked ? <Unlock className="w-5 h-5 mr-2 text-orange-500" /> : <Lock className="w-5 h-5 mr-2 text-orange-500" />} 
              {lockModal.is_locked ? 'Unlock Account' : 'Lock Account'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              You are about to {lockModal.is_locked ? 'unlock' : 'lock'} the account for <span className="font-bold text-white">@{lockModal.username}</span>. Enter your own password to authorize this action.
            </p>
            
            <form onSubmit={handleToggleLock} className="space-y-4">
              {!lockModal.is_locked && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Reason (Optional)</label>
                  <textarea 
                    value={suspensionNote} 
                    onChange={e => setSuspensionNote(e.target.value)} 
                    rows="2"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all text-sm" 
                    placeholder="This reason will be visible to the user..."
                  />
                </div>
              )}
              <div className="space-y-1 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all font-mono pr-12" placeholder="Your current password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setLockModal({ isOpen: false, targetId: null, username: '', is_locked: false })} className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className={`text-white px-6 py-2 rounded-lg font-bold transition-all bg-orange-600 hover:bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]`}>
                  Authorize Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
