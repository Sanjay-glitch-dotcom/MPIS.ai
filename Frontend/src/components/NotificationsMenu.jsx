import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import api from '../lib/api';

const NotificationsMenu = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('notifications/');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`notifications/${id}/`, { is_read: true });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`notifications/${id}/`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="text-slate-400 hover:text-white transition-colors relative p-2 rounded-lg hover:bg-white/5"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-white/10 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right duration-200">
          <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
            <h3 className="font-bold text-white text-sm uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No notifications right now.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(notification => (
                  <div key={notification.id} className={`p-4 transition-colors ${notification.is_read ? 'bg-transparent' : 'bg-blue-500/5'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm ${notification.is_read ? 'text-slate-300' : 'text-white font-bold'}`}>{notification.title}</h4>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.is_read && (
                          <button onClick={() => markAsRead(notification.id)} className="text-blue-400 hover:text-blue-300" title="Mark as read"><Check className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => deleteNotification(notification.id)} className="text-slate-500 hover:text-red-400" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <p className={`text-xs ${notification.is_read ? 'text-slate-500' : 'text-slate-400'} line-clamp-2`}>{notification.message}</p>
                    <div className="text-[10px] text-slate-600 font-mono mt-2">{new Date(notification.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;
