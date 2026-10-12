import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, LogOut, User, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import API from '../services/api';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch user notifications
  const fetchNotifications = async () => {
    try {
      if (user) {
        const response = await API.get('/notifications');
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif => notif._id === id ? { ...notif, read: true } : notif)
      );
    } catch (error) {
      console.error('Failed to mark read:', error.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Failed to mark all read:', error.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <nav className="glass-navbar sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between text-slate-800 dark:text-slate-100">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <span className="sr-only">Toggle Sidebar</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 via-indigo-600 to-indigo-800 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/30 border border-violet-300">
            N
          </div>
          <span className="font-black text-xl tracking-widest bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
            NEXORA
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </button>

        {/* Notifications Dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto glass-effect rounded-2xl p-4 shadow-2xl z-50 border border-slate-200/50 dark:border-slate-800/60 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-850/50 mb-3">
                  <h3 className="font-bold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-sm text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => !n.read && handleMarkAsRead(n._id)}
                        className={`flex gap-3 p-3 rounded-xl transition cursor-pointer ${
                          n.read
                            ? 'opacity-65 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                            : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-l-4 border-indigo-500 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40'
                        }`}
                      >
                        <div className="mt-0.5">{getIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs truncate">{n.title}</h4>
                          <p className="text-[11px] mt-0.5 leading-relaxed text-slate-500 dark:text-slate-400">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Card & Logout */}
        {user ? (
          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="font-bold text-sm truncate max-w-[120px]">{user.name}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
                {user.role}
              </span>
            </div>
            <div className="relative">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-800" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-semibold text-sm">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
              )}
              {user.linkedinConnected && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center font-black text-[9px] shadow-sm border border-white dark:border-slate-900" title="LinkedIn profile analyzed">
                  in
                </span>
              )}
            </div>
            <button
              onClick={logout}
              className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/20"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
