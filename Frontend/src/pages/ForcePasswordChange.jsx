import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { ShieldCheck, KeyRound, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { toast } from 'sonner';

const ForcePasswordChange = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!user.force_password_change) {
      navigate('/dashboard'); // Already secure
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await api.post('/auth/force-change-password/', { new_password: newPassword });
      toast.success('Security key updated successfully!');
      
      // Update local state to reflect change and redirect
      await useAuthStore.getState().fetchUser();
      const updatedUser = useAuthStore.getState().user;
      
      if (updatedUser?.role === 'ADMIN') navigate('/admin');
      else if (updatedUser?.role === 'SUPERADMIN') navigate('/superadmin');
      else if (updatedUser?.role === 'POLICE' || updatedUser?.role === 'SUB_POLICE') navigate('/police');
      else navigate('/dashboard');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update security key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[150px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 p-8 sm:p-10 bg-surface/80 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(220,38,38,0.2)] border border-red-500/20"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-red-500/30">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Mandatory Security Update</h2>
          <p className="text-slate-400 font-light text-sm">Your security key has been reset by Command. You must set a new permanent key before accessing the system.</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">New Permanent Key</label>
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength="8"
                className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-12 py-3.5 text-white focus:outline-none focus:border-red-500/50 focus:bg-black/60 transition-all font-mono"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Confirm New Key</label>
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength="8"
                className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-12 py-3.5 text-white focus:outline-none focus:border-red-500/50 focus:bg-black/60 transition-all font-mono"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(220,38,38,0.3)] mt-4"
          >
            {loading ? 'Updating Security Protocol...' : 'Confirm & Proceed'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForcePasswordChange;
