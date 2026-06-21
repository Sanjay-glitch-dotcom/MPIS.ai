import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/api';
import { Camera, MapPin, ScanFace, CheckCircle2, Map as MapIcon, Video, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import LocationPicker from '../components/LocationPicker';

const LocationMarker = ({ position, setPosition }) => {
  return null;
};

const AiScannerOverlay = ({ isVideo, logs }) => {
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
          <h3 className="text-xl font-bold text-white tracking-widest uppercase">
            {isVideo ? "Deep Video Analysis" : "AI Image Analysis"}
          </h3>
        </div>
        
        <div className="relative w-full h-24 bg-black rounded-lg overflow-hidden border border-slate-700 mb-6 flex items-center justify-center">
          <div className="text-primary animate-pulse flex items-center space-x-2">
            <Activity className="w-6 h-6" />
            <span className="font-mono uppercase tracking-widest text-sm">Processing Media Stream</span>
          </div>
          
          <motion.div 
            className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_20px_rgba(220,38,38,1)]"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
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

import { Activity } from 'lucide-react'; // needed for overlay

const SubmitSighting = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const locationState = useLocation().state;
  
  const missingDate = locationState?.missing_date;
  
  // Calculate max datetime (now)
  const [maxDateTime, setMaxDateTime] = useState('');
  
  useEffect(() => {
    const now = new Date();
    // Format to YYYY-MM-DDThh:mm
    const tzOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(now - tzOffset)).toISOString().slice(0, 16);
    setMaxDateTime(localISOTime);
  }, []);
  
  const minDateTime = missingDate ? `${missingDate}T00:00` : undefined;

  const [formData, setFormData] = useState({ location: '', date: '', description: '' });
  const [position, setPosition] = useState(null);
  const [media, setMedia] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
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

  const [loading, setLoading] = useState(false);
  const [scanningLogs, setScanningLogs] = useState([]);
  
  if (!isAuthenticated) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">Please log in to submit a sighting</h2>
        <button onClick={() => navigate('/login')} className="bg-primary px-6 py-2 rounded-lg font-medium text-white hover:bg-primary/90 transition-all">Log in</button>
      </div>
    );
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleMediaChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMedia(file);
      setIsVideo(file.type.startsWith('video/'));
    }
  };

  const simulateLogs = (isVid) => {
    const logSequence = isVid ? [
      "Initializing OpenCV Video Extractor...",
      "Extracting keyframes (1 FPS)...",
      "Running Haar Cascades for face detection...",
      "Extracting 128-d embeddings using Facenet...",
      "Cross-referencing global missing database...",
      "Generating temporal match reports..."
    ] : [
      "Initializing DeepFace engine...",
      "Locating facial landmarks...",
      "Extracting 128-d embeddings...",
      "Running Facenet comparison...",
      "Computing cosine similarity...",
      "Finalizing Match Status..."
    ];
    
    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < logSequence.length) {
        setScanningLogs(prev => {
          const newLogs = [...prev, logSequence[currentLog]];
          return newLogs.slice(-4);
        });
        currentLog++;
      }
    }, 1200);
    return interval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!media) {
      toast.error('Please provide photographic or video evidence.');
      return;
    }
    
    setLoading(true);
    setScanningLogs(["Initiating secure neural upload..."]);
    
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    if (isVideo) {
      data.append('video', media);
    } else {
      data.append('photo', media);
    }

    if (position) {
      data.append('latitude', position.lat);
      data.append('longitude', position.lng);
    }
    
    const logInterval = simulateLogs(isVideo);

    try {
      if (isVideo) {
        data.append('video', media);
        const res = await api.post('analyze-video/', data);
        clearInterval(logInterval);
        
        toast.success("Video Analysis Complete!", {
          description: `Analyzed ${res.data.faces_analyzed} faces. Found ${res.data.matches_found} matches.`,
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
        });
      } else {
        data.append('date', formData.date);
        data.append('photo', media);
        await api.post('sightings/', data);
        clearInterval(logInterval);
        
        toast.success("Sighting Submitted Successfully!", {
          description: "Our AI is actively monitoring for potential matches.",
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
        });
      }
      
      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error(err);
      clearInterval(logInterval);
      setLoading(false);
      toast.error('Failed to submit intelligence. Please try again.');
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && <AiScannerOverlay isVideo={isVideo} logs={scanningLogs} />}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-surface/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 mt-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-8">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-wide flex items-center text-white">
              <MapPin className="mr-3 text-primary w-8 h-8" /> Intelligence Upload
            </h2>
            <p className="text-slate-400 font-mono text-sm uppercase tracking-widest mt-2">Submit images or video for deep analysis.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-2">
            <label className="block text-sm text-slate-300 font-medium flex items-center">
              <MapIcon className="w-4 h-4 mr-2" /> Pinpoint Sighting Location
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-slate-300 shadow-inner flex items-center">
                {formData.location ? (
                  <span className="truncate">{formData.location}</span>
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
            <p className="text-xs text-slate-500 font-mono">Click to open map and place a highly accurate geospatial pin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Location Name (Landmark)</label>
              <input name="location" required value={formData.location} onChange={handleChange} className="w-full bg-black/40 border border-white/5 focus:border-primary/50 focus:bg-black/60 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none" placeholder="e.g. Central Station Platform 4" />
            </div>

            {!isVideo && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Date & Time</label>
                <input name="date" type="datetime-local" required={!isVideo} onChange={handleChange} min={minDateTime} max={maxDateTime} className="w-full bg-black/40 border border-white/5 focus:border-primary/50 focus:bg-black/60 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none [color-scheme:dark]" />
              </div>
            )}
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 flex justify-between items-center">
              <span>Behavioral / Contextual Details</span>
              <button 
                type="button"
                onClick={toggleListening}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-bold transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                <span>{isListening ? 'Listening...' : 'Voice Dictation'}</span>
              </button>
            </label>
            <textarea name="description" required rows="3" value={formData.description} onChange={handleChange} className="w-full bg-black/40 border border-white/5 focus:border-primary/50 focus:bg-black/60 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none" placeholder="What were they doing? Who were they with?" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Digital Evidence (Image or CCTV Video)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/10 border-dashed rounded-xl hover:border-primary/50 transition-colors relative bg-black/40 shadow-inner group cursor-pointer overflow-hidden">
              {media ? (
                <div className="text-center py-4">
                  {isVideo ? <Video className="mx-auto h-12 w-12 text-primary" /> : <Camera className="mx-auto h-12 w-12 text-primary" />}
                  <p className="mt-2 text-white font-bold">{media.name}</p>
                  <button type="button" onClick={() => {setMedia(null); setIsVideo(false);}} className="mt-4 px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors text-sm font-bold">Remove File</button>
                </div>
              ) : (
                <div className="space-y-2 text-center py-8">
                  <div className="flex justify-center space-x-4 mb-4">
                    <Camera className="h-12 w-12 text-slate-500 group-hover:text-primary transition-colors" />
                    <Video className="h-12 w-12 text-slate-500 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex text-sm text-slate-400 justify-center">
                    <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                      <span>Upload Photo or Video (.mp4)</span>
                      <input type="file" accept="image/*,video/*" className="sr-only" onChange={handleMediaChange} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-600 uppercase tracking-widest">We accept static images or raw CCTV footage.</p>
                </div>
              )}
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading} 
            className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] text-white font-bold uppercase tracking-wider py-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center mt-4"
          >
            <ScanFace className="w-5 h-5 mr-3" /> Engage Deep Analysis
          </motion.button>
        </form>
      </motion.div>

      {showLocationPicker && (
        <LocationPicker 
          onConfirm={(loc) => {
            setPosition({ lat: loc.lat, lng: loc.lng });
            if (loc.address) {
              setFormData(prev => ({ ...prev, location: loc.address }));
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

export default SubmitSighting;
