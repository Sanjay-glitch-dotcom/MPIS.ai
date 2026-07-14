import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Eye, EyeOff, Lock, User as UserIcon, ShieldCheck, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    role: 'PUBLIC',
    phone_number: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwdStrength, setPwdStrength] = useState(0);
  
  const register = useAuthStore(state => state.register);
  const navigate = useNavigate();

  // Password strength calculator
  useEffect(() => {
    let strength = 0;
    if (formData.password.length >= 8) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/\d/.test(formData.password)) strength += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) strength += 25;
    setPwdStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    setError('');
  };

  const nextStep = () => {
    if (step === 1 && (!formData.first_name || !formData.last_name || !formData.username || !formData.email)) {
      setError("Please fill all required fields to continue.");
      return;
    }
    if (step === 2) {
      if (formData.password !== formData.confirm_password) {
        setError("Security keys do not match.");
        return;
      }
      if (pwdStrength < 75) {
        setError("Security key is not strong enough. Please add numbers and special characters.");
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError("Security keys do not match.");
      return;
    }

    if (pwdStrength < 75) {
      setError("Security key is not strong enough.");
      return;
    }

    setLoading(true);
    const { confirm_password, ...submitData } = formData;
    
    const success = await register(submitData);
    setLoading(false);
    
    if (success) {
      navigate('/login');
    } else {
      setError('Registration failed. ID or email might be taken.');
    }
  };

  const getStrengthColor = () => {
    if (pwdStrength <= 25) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]';
    if (pwdStrength <= 50) return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]';
    if (pwdStrength <= 75) return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]';
    return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]';
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden py-10">
      {/* Animated Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-lg relative z-10 p-8 sm:p-10 bg-surface/60 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10"
      >
        <div className="text-center mb-8">
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-primary to-red-800 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20 mb-6 border border-primary/50"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Join the Grid</h2>
          <p className="text-slate-400 font-light">Step {step} of 2: {step === 1 ? 'Personal Intel' : 'Security Clearance'}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-1.5 mb-8 overflow-hidden">
          <motion.div 
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 2) * 100}%` }}
            className="bg-primary h-1.5 shadow-[0_0_10px_rgba(220,38,38,1)] transition-all duration-500"
          />
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center shadow-[0_0_15px_rgba(239,68,68,0.15)]"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 mr-3 animate-pulse" />
            {error}
          </motion.div>
        )}
        
        <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()} className="relative flex flex-col min-h-[360px]">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">First Name</label>
                    <input name="first_name" value={formData.first_name} required onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Last Name</label>
                    <input name="last_name" value={formData.last_name} required onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Agent ID (Username)</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input name="username" value={formData.username} required onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Comm Link (Email)</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input name="email" type="email" value={formData.email} required onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Secure Line (Phone Number) - Optional</label>
                  <div className="relative group">
                    <input name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} placeholder="+1 (555) 000-0000" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner placeholder-slate-600" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Credentials */}
            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Security Key (Password)</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input name="password" type={showPassword ? "text" : "password"} value={formData.password} required onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-11 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Strength Indicator */}
                  <div className="px-1 mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">Signal Strength</span>
                      <span className="text-[10px] font-bold text-white">{pwdStrength}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                      <motion.div animate={{ width: `${pwdStrength}%` }} className={`h-1 transition-all duration-300 ${getStrengthColor()}`} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Verify Security Key</label>
                  <div className="relative group">
                    <CheckCircle2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${formData.confirm_password && formData.password === formData.confirm_password ? 'text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-slate-500 group-focus-within:text-primary'}`} />
                    <input name="confirm_password" type={showConfirmPassword ? "text" : "password"} value={formData.confirm_password} required onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-11 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-auto w-full flex justify-between pt-6 border-t border-white/5 relative z-10">
            {step > 1 ? (
              <button type="button" onClick={prevStep} className="flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors px-4 py-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
            ) : <div></div>}

            {step < 2 ? (
              <button type="button" onClick={nextStep} className="flex items-center text-xs font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="flex items-center text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]">
                {loading ? 'Processing...' : 'Complete Registry'}
              </button>
            )}
          </div>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm font-light">
          Already authorized? <Link to="/login" className="text-primary hover:text-primary/80 font-bold ml-1 transition-colors">Access grid</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
