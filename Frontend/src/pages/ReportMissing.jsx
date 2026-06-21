import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/api';
import { Camera, UserPlus, ScanFace, CheckCircle2, Map as MapIcon, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import LocationPicker from '../components/LocationPicker';

const AiScannerOverlay = ({ imageSrc, logs }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg p-6 bg-surface/90 rounded-2xl border border-primary/50 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        <div className="flex items-center space-x-3 mb-6">
          <ScanFace className="w-8 h-8 text-primary animate-pulse" />
          <h3 className="text-xl font-bold text-white tracking-widest uppercase">AI Feature Extraction</h3>
        </div>
        
        <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden border border-slate-700 mb-6">
          <img src={imageSrc} alt="Analyzing" className="w-full h-full object-contain opacity-50 grayscale" />
          
          <motion.div 
            className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_20px_rgba(220,38,38,1)]"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          <motion.div 
            className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-primary/50"
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>

        <div className="bg-black/50 p-4 rounded-lg font-mono text-sm h-32 overflow-hidden flex flex-col justify-end border border-slate-800">
          <AnimatePresence>
            {logs.map((log, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-primary mb-1 flex items-center"
              >
                <span className="mr-2">&gt;</span> {log}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const ReportMissing = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  
  // Calculate today's date for max attribute
  const [todayDate, setTodayDate] = useState('');
  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISODate = (new Date(now - tzOffset)).toISOString().split('T')[0];
    setTodayDate(localISODate);
  }, []);
  
  const [formData, setFormData] = useState({ 
    first_name: '', 
    last_name: '', 
    age: '',
    gender: '',
    last_seen_location: '',
    last_seen_date: '',
    description: '', 
    status: 'ACTIVE' 
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [position, setPosition] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [scanningLogs, setScanningLogs] = useState([]);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (currentTranscript.trim()) {
          setFormData(prev => ({ ...prev, description: (prev.description + ' ' + currentTranscript).trim() }));
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please allow microphone permissions.");
        } else if (event.error === 'network') {
          toast.error("Voice dictation network error. Speech recognition requires an internet connection and a supported browser (like Chrome/Edge). Ad-blockers or privacy browsers (like Brave) might block this feature.");
        } else {
          toast.error(`Voice dictation error: ${event.error}`);
        }
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        // Automatically set to false when speech recognition stops
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        toast.error("Voice dictation is not supported in this browser.");
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">Please log in to report a missing person</h2>
        <button onClick={() => navigate('/login')} className="bg-primary px-6 py-2 rounded-lg font-medium text-white hover:bg-primary/90 transition-all">Log in</button>
      </div>
    );
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const simulateLogs = () => {
    const logSequence = [
      "Initializing DeepFace engine...",
      "Locating facial landmarks in reference photo...",
      "Generating 128-d facial embeddings...",
      "Encrypting embedding vectors...",
      "Storing profile in active database...",
      "Initializing global monitoring protocol..."
    ];
    
    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < logSequence.length) {
        setScanningLogs(prev => {
          const newLogs = [...prev, logSequence[currentLog]];
          return newLogs.slice(-4);
        });
        currentLog++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    return interval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      toast.error('Please provide a photo for AI analysis.');
      return;
    }
    
    setLoading(true);
    setScanningLogs(["Initiating secure profile creation..."]);
    
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('photo', photo);
    
    if (position) {
      data.append('latitude', position.lat);
      data.append('longitude', position.lng);
    }

    const logInterval = simulateLogs();

    try {
      await api.post('missing-persons/', data);
      
      setTimeout(() => {
        clearInterval(logInterval);
        setLoading(false);
        toast.success("Profile Activated", {
          description: "Missing person report added to the active monitoring database.",
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
        });
        navigate('/dashboard');
      }, 5000);

    } catch (err) {
      console.error(err);
      clearInterval(logInterval);
      setLoading(false);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to submit report. Please try again.';
      toast.error(`Error: ${errMsg}`);
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && <AiScannerOverlay imageSrc={preview} logs={scanningLogs} />}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-surface/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 mt-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <h2 className="text-3xl font-black mb-8 uppercase tracking-wide flex items-center text-white">
          <UserPlus className="mr-3 text-primary w-8 h-8" /> Create Missing Report
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">First Name</label>
              <input name="first_name" required onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Last Name</label>
              <input name="last_name" required onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Age</label>
              <input name="age" type="number" min="0" required onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner [color-scheme:dark] [&::-webkit-inner-spin-button]:opacity-100" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Gender</label>
              <select name="gender" required value={formData.gender} onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner">
                <option value="" disabled>----</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Last Seen Location</label>
              <input name="last_seen_location" required value={formData.last_seen_location} onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Last Seen Date</label>
              <input name="last_seen_date" type="date" required onChange={handleChange} max={todayDate} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner [color-scheme:dark]" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-slate-300 font-medium flex items-center">
              <MapIcon className="w-4 h-4 mr-2" /> Pinpoint Last Seen Location
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-slate-300 shadow-inner flex items-center">
                {formData.last_seen_location ? (
                  <span className="truncate">{formData.last_seen_location}</span>
                ) : (
                  <span className="text-slate-500">No location selected</span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] whitespace-nowrap"
              >
                Pick on Map
              </button>
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 flex justify-between items-center">
              <span>Physical Description & Additional Details</span>
              <button 
                type="button"
                onClick={toggleListening}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-bold transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                <span>{isListening ? 'Listening...' : 'Voice Dictation'}</span>
              </button>
            </label>
            <textarea name="description" required rows="3" value={formData.description} onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Reference Photo (Critical for AI)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/10 border-dashed rounded-xl hover:border-primary/50 transition-colors relative bg-black/40 shadow-inner group cursor-pointer overflow-hidden">
              {preview ? (
                <div className="relative w-full h-64">
                  <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                  <button type="button" onClick={() => {setPhoto(null); setPreview('');}} className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm transition-colors">×</button>
                </div>
              ) : (
                <div className="space-y-2 text-center py-8">
                  <Camera className="mx-auto h-12 w-12 text-slate-500 group-hover:text-primary transition-colors" />
                  <div className="flex text-sm text-slate-400 justify-center">
                    <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                      <span>Upload Clear Face Image</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-600 uppercase tracking-widest">High Quality PNG or JPG</p>
                </div>
              )}
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading} 
            className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] text-white font-bold uppercase tracking-wider py-4 rounded-xl transition-all disabled:opacity-50 mt-4"
          >
            Generate AI Profile
          </motion.button>
        </form>
      </motion.div>

      {showLocationPicker && (
        <LocationPicker 
          onConfirm={(loc) => {
            setPosition({ lat: loc.lat, lng: loc.lng });
            if (loc.address) {
              setFormData(prev => ({ ...prev, last_seen_location: loc.address }));
              toast.success("Location auto-filled from map pin!");
            }
            setShowLocationPicker(false);
          }}
          onCancel={() => setShowLocationPicker(false)}
        />
      )}
    </>
  );
};

export default ReportMissing;
