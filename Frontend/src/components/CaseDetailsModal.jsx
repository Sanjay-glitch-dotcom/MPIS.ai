import React, { useState, useEffect } from 'react';
import { X, Edit, Clock, FileText, Send, Calendar, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { toast } from 'sonner';

const statusColors = {
  ACTIVE: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  PROCESSING: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  POSSIBLE_MATCH: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  VERIFIED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  FOUND: 'bg-green-500/10 text-green-500 border-green-500/30',
  CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const CaseDetailsModal = ({ mp, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [editFormData, setEditFormData] = useState({ description: mp.description, status: mp.status });
  
  const [notes, setNotes] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingExtras, setLoadingExtras] = useState(false);

  useEffect(() => {
    fetchExtras();
  }, [mp.id]);

  const fetchExtras = async () => {
    setLoadingExtras(true);
    try {
      const [notesRes, timelineRes] = await Promise.all([
        api.get(`investigation-notes/?missing_person=${mp.id}`),
        api.get(`timeline/?missing_person=${mp.id}`)
      ]);
      setNotes(notesRes.data);
      setTimeline(timelineRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load case details.');
    } finally {
      setLoadingExtras(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`missing-persons/${mp.id}/`, editFormData);
      toast.success("Case file updated successfully.");
      onUpdate();
    } catch (error) {
      toast.error("Failed to update case file.");
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await api.post('investigation-notes/', {
        missing_person: mp.id,
        content: newNote
      });
      setNotes([res.data, ...notes]);
      setNewNote('');
      toast.success("Note added.");
    } catch (err) {
      toast.error("Failed to add note.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40">
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center">
            <Shield className="w-6 h-6 mr-3 text-blue-500" /> 
            Case File: {mp.first_name} {mp.last_name}
            <span className={`ml-4 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-lg border ${statusColors[editFormData.status] || statusColors['ACTIVE']}`}>
              {editFormData.status}
            </span>
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex border-b border-white/5 bg-black/20">
          <button 
            onClick={() => setActiveTab('details')} 
            className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'details' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Edit className="w-4 h-4 inline mr-2" /> Details & Status
          </button>
          <button 
            onClick={() => setActiveTab('notes')} 
            className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'notes' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FileText className="w-4 h-4 inline mr-2" /> Investigation Notes
          </button>
          <button 
            onClick={() => setActiveTab('timeline')} 
            className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'timeline' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Clock className="w-4 h-4 inline mr-2" /> Public Timeline
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-black/20 relative">
          
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex gap-6">
                {mp.photo && (
                  <img src={mp.photo.startsWith('http') ? mp.photo : `http://localhost:8000${mp.photo}`} alt={mp.first_name} className="w-48 h-48 object-cover rounded-2xl border border-white/10" />
                )}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Age</div>
                    <div className="text-white font-bold">{mp.age}</div>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Gender</div>
                    <div className="text-white font-bold">{mp.gender === 'M' ? 'Male' : mp.gender === 'F' ? 'Female' : 'Other'}</div>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 col-span-2">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Last Seen</div>
                    <div className="text-white font-bold">{mp.last_seen_location} <span className="text-slate-500 font-normal ml-2">on {mp.last_seen_date}</span></div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSaveEdit} className="space-y-4 pt-6 border-t border-white/5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Update Case Status</label>
                  <select 
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-4 text-white focus:border-blue-500/50 transition-all font-medium"
                  >
                    <option value="REPORTED">Reported</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="POSSIBLE_MATCH">Possible Match Found</option>
                    <option value="VERIFIED">Verified Match</option>
                    <option value="FOUND">Found / Safe</option>
                    <option value="CLOSED">Closed / Unresolved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Case Description (Public)</label>
                  <textarea 
                    rows="4"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-4 text-white focus:border-blue-500/50 transition-all text-sm leading-relaxed"
                  />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]">
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 absolute inset-0 p-6">
              <div className="flex-1 space-y-4 mb-6 overflow-y-auto pr-2 pb-32">
                {loadingExtras ? (
                  <div className="text-center text-slate-500 py-10 animate-pulse">Loading internal notes...</div>
                ) : notes.length === 0 ? (
                  <div className="text-center text-slate-500 py-10 bg-black/40 rounded-xl border border-white/5">No internal investigation notes yet.</div>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-blue-400 font-bold text-sm">Officer {note.officer_name}</span>
                        <span className="text-slate-500 text-xs font-mono">{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a] p-6 border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
                <form onSubmit={handleAddNote} className="relative">
                  <textarea 
                    required
                    rows="2"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add a secure internal note..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-14 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm resize-none"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 transition-colors p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg">
                    <Send className="w-5 h-5" />
                  </button>
                </form>
                <p className="text-[10px] text-orange-400 mt-2 uppercase tracking-widest text-center flex items-center justify-center">
                  <Shield className="w-3 h-3 mr-1" /> Highly classified internal communications.
                </p>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pl-4">
              {loadingExtras ? (
                <div className="text-center text-slate-500 py-10 animate-pulse">Loading timeline events...</div>
              ) : timeline.length === 0 ? (
                <div className="text-center text-slate-500 py-10 bg-black/40 rounded-xl border border-white/5">No timeline events recorded.</div>
              ) : (
                <div className="relative border-l-2 border-white/10 pl-6 space-y-8 py-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[35px] bg-[#0f172a] p-1 rounded-full border border-white/20">
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                        <div className="text-[10px] text-slate-500 font-mono mb-1">{new Date(event.timestamp).toLocaleString()}</div>
                        <h4 className="text-white font-bold text-sm mb-1">{event.event_type}</h4>
                        <p className="text-slate-400 text-sm">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CaseDetailsModal;
