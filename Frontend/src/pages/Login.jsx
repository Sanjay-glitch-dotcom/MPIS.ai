import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Eye, EyeOff, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore(state => state.login);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.force_password_change) navigate('/force-change-password');
      else if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'SUPERADMIN') navigate('/superadmin');
      else if (user.role === 'POLICE') navigate('/police');
      else if (user.role === 'SUB_ADMIN') navigate('/subadmin');
      else if (user.role === 'SUB_POLICE') navigate('/subpolice');
      else navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(username, password);
    setLoading(false);
    
    if (result.success) {
      const userState = useAuthStore.getState().user;
      if (userState?.force_password_change) {
        navigate('/force-change-password');
      } else if (userState?.role === 'ADMIN') {
        navigate('/admin');
      } else if (userState?.role === 'SUPERADMIN') {
        navigate('/superadmin');
      } else if (userState?.role === 'POLICE') {
        navigate('/police');
      } else if (userState?.role === 'SUB_ADMIN') {
        navigate('/subadmin');
      } else if (userState?.role === 'SUB_POLICE') {
        navigate('/subpolice');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message || 'Invalid username or password');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-md relative z-10 p-8 sm:p-10 bg-surface/60 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-primary to-red-800 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20 mb-6 border border-primary/50"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Welcome Back</h2>
          <p className="text-slate-400 font-light">Secure access to the MPIS directive</p>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center shadow-[0_0_15px_rgba(239,68,68,0.15)]"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 mr-3 shrink-0 animate-pulse" />
            <div className="whitespace-pre-wrap">{error}</div>
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Agent ID / Username</label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                required
                placeholder="Enter your username"
                className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:bg-black/60 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Security Key</label>
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Forgot?</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:bg-black/60 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden bg-primary hover:bg-primary/90 text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] mt-4"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            {loading ? 'Authenticating...' : 'Authorize Access'}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm font-light">
          Not part of the grid yet? <Link to="/register" className="text-primary hover:text-primary/80 font-bold ml-1 transition-colors">Apply here</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
