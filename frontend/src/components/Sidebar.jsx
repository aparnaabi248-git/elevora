import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  FileUp,
  Briefcase,
  Bookmark,
  TrendingUp,
  MessageSquare,
  Sparkles,
  FileText,
  PlusCircle,
  Users,
  Video,
  LogOut
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const studentLinks = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/profile', label: 'My Profile', icon: <User className="w-5 h-5" /> },
    { to: '/upload-resume', label: 'Upload Resume', icon: <FileUp className="w-5 h-5" /> },
    { to: '/consultancy', label: 'Career Consultancy', icon: <Video className="w-5 h-5" /> },
    { to: '/jobs', label: 'Search Jobs', icon: <Briefcase className="w-5 h-5" /> },
    { to: '/saved-jobs', label: 'Saved Jobs', icon: <Bookmark className="w-5 h-5" /> },
    { to: '/career-insights', label: 'Career Insights', icon: <TrendingUp className="w-5 h-5" /> },
    { to: '/chat-mentor', label: 'AI Chat Mentor', icon: <MessageSquare className="w-5 h-5" /> },
    { to: '/interview-prep', label: 'AI Interview Prep', icon: <Sparkles className="w-5 h-5" /> },
    { to: '/cover-letter', label: 'AI Cover Letter', icon: <FileText className="w-5 h-5" /> }
  ];

  const recruiterLinks = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/post-job', label: 'Post a Job', icon: <PlusCircle className="w-5 h-5" /> }
  ];

  const adminLinks = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/admin/users', label: 'Manage Users', icon: <Users className="w-5 h-5" /> }
  ];

  const getLinks = () => {
    switch (user.role) {
      case 'student':
        return studentLinks;
      case 'recruiter':
        return recruiterLinks;
      case 'admin':
        return adminLinks;
      default:
        return [];
    }
  };

  const links = getLinks();

  const sidebarClass = `fixed inset-y-0 left-0 z-30 w-64 glass-effect border-r border-slate-200/50 dark:border-slate-800/60 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-[calc(100vh-76px)] ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  }`;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm md:hidden"
        />
      )}

      <aside className={`sidebar-menu ${sidebarClass}`}>
        <div className="flex flex-col gap-6 min-h-0">
          <div className="sidebar-heading text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[10px] font-bold">
            Navigation Menu
          </div>

          <nav className="flex flex-col gap-1 min-h-0 overflow-y-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all border-l-4 border-transparent hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-850/40 dark:hover:text-slate-100 ${
                    isActive ? 'active-nav-item' : 'text-slate-700 dark:text-slate-300'
                  }`
                }
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-2 text-slate-800 dark:text-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-250">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">{user.name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-450 capitalize">{user.role}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
