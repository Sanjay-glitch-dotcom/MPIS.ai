import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, TriangleAlert, Trash2, Key, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwdStrength, setPwdStrength] = useState(0);

  // Delete Account State
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Profile Update State
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone_number: user?.phone_number || ''
  });
  const [profilePassword, setProfilePassword] = useState('');
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone_number: user.phone_number || ''
      });
    }
  }, [user, navigate]);

  // Calculate Password Strength
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength += 25;
    if (/[A-Z]/.test(newPassword)) strength += 25;
    if (/\d/.test(newPassword)) strength += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength += 25;
    setPwdStrength(strength);
  }, [newPassword]);

  const getStrengthColor = () => {
    if (pwdStrength <= 25) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]';
    if (pwdStrength <= 50) return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]';
    if (pwdStrength <= 75) return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]';
    return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]';
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwdStrength < 75) {
      toast.error('New password is too weak. Add numbers and special characters.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success('Security key updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwdStrength(0);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update security key');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profilePassword) {
      toast.error('Please enter your current security key to confirm changes.');
      return;
    }
    setUpdatingProfile(true);
    try {
      await api.post('auth/update-profile/', {
        ...profileData,
        current_password: profilePassword
      });
      toast.success('Profile updated successfully.');
      setProfilePassword('');
      useAuthStore.getState().fetchUser();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion');
      return;
    }

    if (!window.confirm('Are you absolutely sure you want to permanently delete your account? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await api.post('auth/delete-account/', {
        password: deletePassword
      });
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 py-8 relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mb-10 flex items-center space-x-4">
        <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Account Settings</h1>
          <p className="text-slate-400 font-light">Manage your security credentials and data</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 relative z-10">
        
        {/* Personal Intel Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl md:col-span-2"
        >
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-white tracking-wide">Personal Intel</h2>
            </div>
            <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-widest rounded-lg">
              {user?.role || 'Agent'}
            </span>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agent ID (Username)</label>
                <input type="text" value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Comm Link (Email)</label>
                <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">First Name</label>
                <input type="text" value={profileData.first_name} onChange={e => setProfileData({...profileData, first_name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                <input type="text" value={profileData.last_name} onChange={e => setProfileData({...profileData, last_name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" required />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Secure Line (Phone Number) - Optional</label>
                <input type="tel" value={profileData.phone_number} onChange={e => setProfileData({...profileData, phone_number: e.target.value})} placeholder="+1 (555) 000-0000" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner placeholder-slate-600" />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 mt-6">
              <p className="text-sm text-slate-400 mb-4 font-light">To save changes to your personal intel, please confirm your current security key.</p>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="space-y-1.5 flex-1 w-full">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Current Security Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input type={showProfilePassword ? "text" : "password"} value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} placeholder="••••••••" className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-11 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                    <button type="button" onClick={() => setShowProfilePassword(!showProfilePassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={updatingProfile || !profilePassword} className="w-full md:w-auto bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/50 text-xs font-bold uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all shadow-sm disabled:opacity-50 h-[46px] whitespace-nowrap">
                  {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Security Update Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl ${(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') ? 'md:col-span-2 md:w-1/2 md:mx-auto' : ''}`}
        >
          <div className="flex items-center space-x-3 mb-6 border-b border-white/5 pb-4">
            <Key className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold text-white tracking-wide">Update Security Key</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Current Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input type={showCurrent ? "text" : "password"} value={currentPassword} required onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-11 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">New Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input type={showNew ? "text" : "password"} value={newPassword} required onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-11 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength Indicator */}
              <div className="px-1 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Strength</span>
                  <span className="text-[10px] font-bold text-white">{pwdStrength}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                  <motion.div animate={{ width: `${pwdStrength}%` }} className={`h-1 transition-all duration-300 ${getStrengthColor()}`} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Confirm New Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input type={showNew ? "text" : "password"} value={confirmPassword} required onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
              </div>
            </div>

            <button type="submit" disabled={changingPassword} className="w-full mt-4 bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] disabled:opacity-50">
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </motion.div>

        {/* Danger Zone Section */}
        {(user?.role === 'PUBLIC') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-950/20 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 shadow-[0_0_30px_rgba(239,68,68,0.05)] h-fit"
          >
          <div className="flex items-center space-x-3 mb-6 border-b border-red-500/20 pb-4">
            <TriangleAlert className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-red-500 tracking-wide">Danger Zone</h2>
          </div>
          
          <p className="text-slate-400 text-sm font-light leading-relaxed mb-6">
            Permanently removing your account will revoke your access to the MPIS directive. Your historical sightings and reports will be retained for police investigations, but your personal identifier will be anonymized.
          </p>

          <form onSubmit={handleDeleteAccount} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-red-400 ml-1">Confirm Identity (Password)</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/50 group-focus-within:text-red-500 transition-colors" />
                <input type={showDeletePassword ? "text" : "password"} value={deletePassword} required onChange={(e) => setDeletePassword(e.target.value)} className="w-full bg-black/40 border border-red-500/20 rounded-xl pl-11 pr-11 py-3 text-white focus:outline-none focus:border-red-500/50 focus:bg-red-950/30 transition-all shadow-inner" />
                <button type="button" onClick={() => setShowDeletePassword(!showDeletePassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={deleting} className="w-full mt-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4)] disabled:opacity-50 flex items-center justify-center">
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Terminating...' : 'Delete Account'}
            </button>
          </form>
        </motion.div>
        )}
      </div>
    </div>
  );
};

export default Settings;
