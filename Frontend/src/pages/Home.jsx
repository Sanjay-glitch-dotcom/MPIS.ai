import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, Eye, ScanFace, Database, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80 } }
};

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10 overflow-hidden relative">
      {/* Background Neon Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="text-center max-w-4xl relative z-10"
      >
        <motion.div variants={itemVariants} className="mb-6 flex justify-center">
          <div className="bg-primary/10 border border-primary/30 px-4 py-1.5 rounded-full flex items-center shadow-[0_0_15px_rgba(220,38,38,0.3)]">
            <ScanFace className="w-4 h-4 text-primary mr-2" />
            <span className="text-xs font-bold text-primary tracking-widest uppercase">Global AI Monitoring System Online</span>
          </div>
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-black tracking-tighter mb-8 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          BRING THEM <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-red-800">HOME.</span>
        </motion.h1>
        
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-bold mb-4 font-mono tracking-tighter">THE <span className="text-primary">MPIS</span> DIRECTIVE</h3>
          <p className="text-slate-300 mb-6 leading-relaxed text-xl md:text-2xl font-light px-4">
            Every 40 seconds, a child goes missing in the world. MPIS utilizes neural network facial recognition to cross-reference missing person reports with crowdsourced citizen sightings globally.
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-24 px-4">
          <Link to="/report-missing" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_35px_rgba(220,38,38,0.6)] transition-all">
            Report Missing Person
          </Link>
          <Link to="/submit-sighting" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 backdrop-blur-md hover:bg-white/10 text-white font-bold tracking-widest uppercase text-sm border border-white/10 hover:border-primary/50 transition-all">
            Submit Sighting Data
          </Link>
        </motion.div>

        <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-6 text-left px-4">
          <motion.div variants={itemVariants} className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Search className="w-24 h-24" /></div>
            <div className="bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-primary/30">
              <Search className="text-primary w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-wide">DeepFace Engine</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-light">Instantly extracts 128-d facial embeddings and compares new sightings with thousands of records using Cosine Similarity.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Globe className="w-24 h-24" /></div>
            <div className="bg-red-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-red-500/30">
              <Globe className="text-red-500 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-wide">Global Sourcing</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-light">Citizens act as global sensors. Anyone can easily snap a photo and submit a sighting anonymously and securely.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ShieldCheck className="w-24 h-24" /></div>
            <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30">
              <ShieldCheck className="text-blue-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-wide">Admin Verification</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-light">High-confidence matches are securely routed to authorities for manual verification before notifying family members.</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
