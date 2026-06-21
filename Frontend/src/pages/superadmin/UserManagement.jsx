import React, { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, ShieldAlert, Shield, ShieldCheck, Mail, Key, MoreVertical, Edit2, Trash2, Power, Lock, Unlock, KeyRound, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../lib/api';
import { toast } from 'sonner';

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

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Secure action state
  const [secureModal, setSecureModal] = useState({ isOpen: false, action: null, targetId: null, data: {} });
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [suspensionNote, setSuspensionNote] = useState('');
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);
  const [showTempPassword, setShowTempPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'POLICE',
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchResetRequests();

    const interval = setInterval(() => {
      fetchUsers();
      fetchResetRequests();
    }, 5000);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users/');
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load official accounts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResetRequests = async () => {
    try {
      const { data } = await api.get('/admin/password-requests/');
      setResetRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const executeSecureAction = async (e) => {
    e.preventDefault();
    const { action, targetId } = secureModal;
    
    try {
      if (action === 'delete') {
        await api.delete(`/admin/users/${targetId}/`, { data: { password: superAdminPassword } });
        toast.success("Account permanently deleted.");
      } else if (action === 'toggle_active' || action === 'toggle_lock') {
        const response = await api.patch(`/admin/users/${targetId}/`, { 
          action, 
          password: superAdminPassword,
          suspension_note: suspensionNote
        });
        toast.success(response.data.message);
      } else if (action === 'reset_password') {
        const response = await api.post(`/admin/users/${targetId}/reset-password/`, {
          new_password: tempPassword,
          password: superAdminPassword
        });
        toast.success(response.data.message);
      } else if (action === 'approve_reset') {
        const response = await api.post(`/admin/password-requests/${targetId}/approve/`, {
          new_password: tempPassword,
          superadmin_password: superAdminPassword
        });
        toast.success(response.data.message);
        fetchResetRequests();
      }
      
      closeSecureModal();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authorization failed or error occurred.');
    }
  };

  const openSecureModal = (action, targetId, title, description) => {
    setSecureModal({ isOpen: true, action, targetId, data: { title, description } });
    setActiveDropdown(null);
  };

  const closeSecureModal = () => {
    setSecureModal({ isOpen: false, action: null, targetId: null, data: {} });
    setSuperAdminPassword('');
    setTempPassword('');
    setSuspensionNote('');
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await api.put(`/admin/users/${editingUserId}/`, formData);
        toast.success(`Account updated successfully!`);
      } else {
        await api.post('/admin/users/', formData);
        toast.success(`${formData.role} account created successfully!`);
      }
      setShowForm(false);
      setEditingUserId(null);
      setFormData({ username: '', email: '', password: '', role: 'POLICE', first_name: '', last_name: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process request.');
    }
  };


  const openEditForm = (user) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Leave blank, we don't update password here
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name
    });
    setActiveDropdown(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUserId(null);
    setFormData({ username: '', email: '', password: '', role: 'POLICE', first_name: '', last_name: '' });
  };

  const getRoleIcon = (role) => {
    if (role === 'SUPERADMIN') return <ShieldCheck className="w-4 h-4 text-purple-500" />;
    if (role === 'ADMIN') return <ShieldAlert className="w-4 h-4 text-red-500" />;
    if (role === 'SUB_ADMIN' || role === 'SUB_POLICE') return <Shield className="w-4 h-4 text-cyan-400" />;
    return <Shield className="w-4 h-4 text-blue-500" />;
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'SUPERADMIN') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (role === 'ADMIN') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (role === 'SUB_ADMIN' || role === 'SUB_POLICE') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="space-y-6 pb-12 relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">User Management</h1>
          <p className="text-slate-400 font-light mt-1">Provision and monitor official law enforcement and administrative accounts.</p>
        </div>
        <button 
          onClick={showForm ? handleCancel : () => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex items-center"
        >
          {showForm ? 'Cancel' : <><UserPlus className="w-5 h-5 mr-2" /> Create Official Account</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-blue-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
          
          <h2 className="text-xl font-bold text-white mb-4 relative z-10 flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-blue-400" /> {editingUserId ? 'Edit Account' : 'Account Provisioning'}
          </h2>
          
          <form onSubmit={handleCreateOrUpdate} className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Username / Agent ID</label>
              <input type="text" required disabled={!!editingUserId} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className={`w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all ${editingUserId ? 'opacity-50 cursor-not-allowed' : ''}`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">First Name</label>
              <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Name</label>
              <input type="text" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all" />
            </div>
            {!editingUserId && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Initial Password</label>
                <input type="text" required minLength="8" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all" />
                <p className="text-[10px] text-slate-500 mt-1">Provide this securely to the officer. They can change it upon logging in.</p>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Clearance Level (Role)</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all appearance-none cursor-pointer">
                <option value="POLICE">Police Officer (Investigator)</option>
                <option value="ADMIN">Administrator (Command Level)</option>
                <option value="SUB_POLICE">Sub Police Officer</option>
                <option value="SUB_ADMIN">Sub Administrator</option>
              </select>
            </div>
            
            <div className="md:col-span-2 mt-4 pt-4 border-t border-white/5 flex justify-end">
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]">
                {editingUserId ? 'Save Changes' : 'Provision Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-black/40 backdrop-blur-sm border border-white/5 rounded-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-bold tracking-wider rounded-tl-2xl">Agent Details</th>
              <th className="px-6 py-4 font-bold tracking-wider">Clearance Level</th>
              <th className="px-6 py-4 font-bold tracking-wider">Account Status</th>
              <th className="px-6 py-4 font-bold tracking-wider">Activity</th>
              <th className="px-6 py-4 font-bold tracking-wider">Breaks (Today)</th>
              <th className="px-6 py-4 font-bold tracking-wider text-right">Join Date</th>
              <th className="px-6 py-4 font-bold tracking-wider text-right rounded-tr-2xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500 animate-pulse">Loading officials database...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No official accounts found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 mr-3 shadow-inner">
                        {u.first_name?.[0] || u.username[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white">{u.first_name} {u.last_name}</div>
                        <div className="text-xs text-slate-500">{u.email} • @{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border flex items-center w-fit ${getRoleBadgeColor(u.role)}`}>
                      {getRoleIcon(u.role)}
                      <span className="ml-2">{u.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      {u.is_active ? (
                        <span className="flex items-center text-emerald-400 text-xs font-bold tracking-widest uppercase"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> Active</span>
                      ) : (
                        <span className="flex items-center text-red-500 text-xs font-bold tracking-widest uppercase"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Suspended</span>
                      )}
                      {u.is_locked && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                          Locked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      {u.activity_status === 'ONLINE' && <span className="flex items-center text-emerald-400 text-xs font-bold tracking-widest"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> ONLINE</span>}
                      {u.activity_status === 'OFFLINE' && <span className="flex items-center text-slate-500 text-xs font-bold tracking-widest"><span className="w-2 h-2 rounded-full bg-slate-500 mr-2"></span> OFFLINE</span>}
                      {u.activity_status === 'ON_BREAK' && <span className="flex items-center text-yellow-500 text-xs font-bold tracking-widest"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span> ON BREAK {u.active_break_start && <span className="ml-1.5 text-[10px] bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-400 font-mono tracking-normal">(<LiveBreakTimer startTime={u.active_break_start} />)</span>}</span>}
                      {u.login_time && <span className="text-[10px] text-slate-500">In: {new Date(u.login_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                      {u.logout_time && <span className="text-[10px] text-slate-500">Out: {new Date(u.logout_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-300 font-mono">
                      {u.total_break_duration > 0 ? `${Math.round(u.total_break_duration)}m` : '0m'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">
                    {new Date(u.date_joined).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === u.id ? null : u.id);
                      }}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeDropdown === u.id && (
                      <div 
                        ref={dropdownRef}
                        className="absolute right-6 top-12 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-2 z-[100] animate-in fade-in slide-in-from-top-2 origin-top-right duration-200"
                      >
                        {u.role !== 'SUPERADMIN' && (
                          <>
                            <button
                              onClick={() => openEditForm(u)}
                              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-blue-400 flex items-center transition-colors"
                            >
                              <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                            </button>
                            <button
                              onClick={() => openSecureModal('toggle_active', u.id, u.is_active ? 'Suspend Account' : 'Activate Account', 'Please enter your Super Admin password to confirm this action.')}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                                u.is_active ? 'text-slate-300 hover:bg-white/5 hover:text-yellow-400' : 'text-slate-300 hover:bg-white/5 hover:text-emerald-400'
                              }`}
                            >
                              <Power className="w-4 h-4 mr-2" /> {u.is_active ? 'Suspend Account' : 'Activate Account'}
                            </button>
                            <button
                              onClick={() => openSecureModal('toggle_lock', u.id, u.is_locked ? 'Unlock Account' : 'Lock Account', 'Please enter your Super Admin password to confirm this action.')}
                              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-orange-400 flex items-center transition-colors"
                            >
                              {u.is_locked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />} 
                              {u.is_locked ? 'Unlock Account' : 'Lock Account'}
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => openSecureModal('reset_password', u.id, 'Force Password Reset', 'Generate a new temporary password. They will be forced to change it on next login.')}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-blue-400 flex items-center transition-colors"
                        >
                          <KeyRound className="w-4 h-4 mr-2" /> Reset Password
                        </button>
                        
                        {u.role !== 'SUPERADMIN' && (
                          <>
                            <div className="h-px bg-white/10 my-1"></div>
                            <button
                              onClick={() => openSecureModal('delete', u.id, 'Permanently Delete Account', 'This action cannot be undone. Enter your Super Admin password to confirm.')}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Permanently Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Password Reset Requests Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-black text-white tracking-tight uppercase flex items-center mb-6">
          <KeyRound className="w-6 h-6 mr-3 text-orange-500" /> Pending Password Reset Requests
        </h2>
        {resetRequests.filter(r => r.status === 'PENDING').length === 0 ? (
          <p className="text-slate-500">No pending password reset requests at this time.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resetRequests.filter(r => r.status === 'PENDING').map(req => (
              <div key={req.id} className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-white font-bold">{req.username} <span className="text-slate-400 text-xs font-normal">({req.email})</span></div>
                  <div className="text-xs text-orange-400 mt-1">Requested: {new Date(req.created_at).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => openSecureModal('approve_reset', req.id, 'Approve Password Reset', `Generate a temporary password for ${req.username}.`)}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-bold transition-all text-xs"
                >
                  Approve Reset
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secure Action Modal Overlay */}
      {secureModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeSecureModal}></div>
          <div className="bg-[#0f172a] border border-red-500/30 rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-red-500" /> {secureModal.data.title}
            </h3>
            <p className="text-sm text-slate-400 mb-6">{secureModal.data.description}</p>
            
            <form onSubmit={executeSecureAction} className="space-y-4">
              {(secureModal.action === 'reset_password' || secureModal.action === 'approve_reset') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">New Temporary Password</label>
                  <div className="relative">
                    <input 
                      type={showTempPassword ? "text" : "password"} 
                      required 
                      minLength="8"
                      value={tempPassword} 
                      onChange={e => setTempPassword(e.target.value)} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-11 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono" 
                      placeholder="e.g. TempPass123!"
                    />
                    <button type="button" onClick={() => setShowTempPassword(!showTempPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-orange-400 mt-1">Please securely communicate this to the user immediately.</p>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Super Admin Password</label>
                <div className="relative">
                  <input 
                    type={showSuperAdminPassword ? "text" : "password"} 
                    required 
                    value={superAdminPassword} 
                    onChange={e => setSuperAdminPassword(e.target.value)} 
                    className="w-full bg-black/40 border border-red-500/30 rounded-xl pl-4 pr-11 py-3 text-white focus:outline-none focus:border-red-500/50 transition-all" 
                    placeholder="Verify your password..."
                  />
                  <button type="button" onClick={() => setShowSuperAdminPassword(!showSuperAdminPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showSuperAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {((secureModal.action === 'toggle_active' && secureModal.data.title !== 'Activate Account') || 
                (secureModal.action === 'toggle_lock' && secureModal.data.title !== 'Unlock Account')) && (
                <div className="space-y-1 mt-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Suspension / Lock Reason (Optional)</label>
                  <textarea 
                    value={suspensionNote} 
                    onChange={e => setSuspensionNote(e.target.value)} 
                    rows="3"
                    className="w-full bg-black/40 border border-red-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-all text-sm" 
                    placeholder="This reason will be visible to the user when they try to log in..."
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button type="button" onClick={closeSecureModal} className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
