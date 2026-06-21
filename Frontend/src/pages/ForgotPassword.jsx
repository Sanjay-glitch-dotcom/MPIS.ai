import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, KeyRound, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState('PUBLIC'); // 'PUBLIC' or 'OFFICIAL'
  
  // Form State
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdStrength, setPwdStrength] = useState(0);

  // Strength Calculator
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

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (recoveryMode === 'OFFICIAL') {
      try {
        const response = await api.post('/admin/password-requests/', { username: email });
        toast.success(response.data.message);
        // Reset form for official, no next steps
        navigate('/login');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to submit request.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email) return;
    try {
      await api.post('auth/forgot-password/request/', { email });
      toast.success('Security code sent! Check your comm link.');
      setStep(2);
    } catch (error) {
      toast.error('Failed to request reset. Ensure the email is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      setStep(3);
    } else {
      toast.error('Please enter the full 6-digit code.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Security keys do not match.');
      return;
    }
    if (pwdStrength < 75) {
      toast.error('Security key is not strong enough.');
      return;
    }

    setLoading(true);
    try {
      await api.post('auth/forgot-password/confirm/', { 
        email: email.trim(), 
        otp_code: otpCode.trim(), 
        new_password: newPassword 
      });
      toast.success('Security key reset successfully! You can now access the grid.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password. Code may be expired.');
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden py-10">
      {/* Animated Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 p-8 sm:p-10 bg-surface/60 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-red-800 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20 mb-6 border border-primary/50">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Recovery Protocol</h2>
          <p className="text-slate-400 font-light">
            {step === 1 ? 'Verify identity to regain access' : step === 2 ? 'Enter authorization code' : 'Set new credentials'}
          </p>
        </div>

        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Request OTP or Official Reset */}
            {step === 1 && (
              <motion.form key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleRequestOTP} className="space-y-6">
                
                <div className="flex bg-black/40 border border-white/5 rounded-xl p-1 mb-6">
                  <button 
                    type="button"
                    onClick={() => setRecoveryMode('PUBLIC')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${recoveryMode === 'PUBLIC' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Public Account
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRecoveryMode('OFFICIAL')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${recoveryMode === 'OFFICIAL' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Official Personnel
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                    {recoveryMode === 'PUBLIC' ? 'Comm Link (Email)' : 'Agent ID / Username'}
                  </label>
                  <div className="relative group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 group-focus-within:text-primary transition-colors ${recoveryMode === 'PUBLIC' ? 'text-slate-500' : 'text-red-500/50'}`} />
                    <input type={recoveryMode === 'PUBLIC' ? 'email' : 'text'} required placeholder={recoveryMode === 'PUBLIC' ? "agent@mpis.local" : "e.g. admin01"} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:bg-black/60 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className={`w-full relative group overflow-hidden text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(220,38,38,0.3)] ${recoveryMode === 'PUBLIC' ? 'bg-primary hover:bg-primary/90' : 'bg-red-600 hover:bg-red-500'}`}>
                  {loading ? 'Transmitting...' : recoveryMode === 'PUBLIC' ? 'Send Recovery Code' : 'Request Admin Reset'}
                </button>
              </motion.form>
            )}

            {/* STEP 2: Verify OTP */}
            {step === 2 && (
              <motion.form key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">6-Digit Access Code</label>
                  <div className="relative group text-center">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input type="text" required maxLength="6" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white text-center tracking-[0.5em] text-xl placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                  </div>
                  <p className="text-[10px] text-slate-500 text-center mt-2">Check your terminal console for the email</p>
                </div>

                <button type="submit" className="w-full relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                  Verify Code
                </button>
              </motion.form>
            )}

            {/* STEP 3: Reset Password */}
            {step === 3 && (
              <motion.form key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">New Security Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input type={showPassword ? "text" : "password"} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-12 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Confirm Key</label>
                  <div className="relative group">
                    <CheckCircle2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${confirmPassword && newPassword === confirmPassword ? 'text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-slate-500 group-focus-within:text-primary'}`} />
                    <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-12 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full relative group overflow-hidden bg-primary hover:bg-primary/90 text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                  {loading ? 'Processing...' : 'Engage New Key'}
                </button>
              </motion.form>
            )}

          </AnimatePresence>
        </div>

        <p className="mt-8 text-center text-slate-400 text-sm font-light">
          Remember your credentials? <Link to="/login" className="text-primary hover:text-primary/80 font-bold ml-1 transition-colors">Abort sequence</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
