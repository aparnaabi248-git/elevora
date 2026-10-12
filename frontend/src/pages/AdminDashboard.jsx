import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Users, FileText, Cpu, Compass, ArrowRight, Shield, Activity, BarChart2 } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    students: 0,
    recruiters: 0,
    jobs: 0,
    applications: 0,
    companies: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await API.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === 'admin') {
      fetchAdminStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Admin Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-650 to-blue-600 p-8 text-white shadow-xl border border-white/10">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
              <Shield className="w-8 h-8 text-yellow-400 fill-current" />
              <span>Admin Console</span>
            </h2>
            <p className="text-purple-100 text-sm max-w-xl">
              Hello, {user?.name}. You have access to system-wide administration. Review platform usage telemetry and manage registered accounts below.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="px-5 py-3 shrink-0 rounded-2xl bg-white text-indigo-600 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center gap-2 text-xs shadow-md"
            >
              <span>Manage User Accounts</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Stats Grid */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" />
          <span>System Usage Metrics</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
          <GlassCard className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.students}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Students</div>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.recruiters}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Recruiters</div>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.jobs}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Active Jobs</div>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.applications}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Applications</div>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.companies}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Companies</div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Admin Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 space-y-4" hover={false}>
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <span>Platform Overview</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            All user registration and vacancy matching functions are working normally. Simulated AI resume scores and roadmaps are currently running in mock/offline mode unless the Google Gemini Key is configured in the environment settings.
          </p>
          <div className="pt-2">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Quick Actions:</span>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-650 text-white font-bold text-xs transition"
              >
                Manage User Directory
              </button>
              <button
                onClick={() => navigate('/post-job')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white transition font-bold text-xs text-slate-705 dark:text-slate-350"
              >
                Post Platform Job
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4" hover={false}>
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
            <Compass className="w-5 h-5 text-purple-500" />
            <span>Platform Security Policies</span>
          </h3>
          <ul className="text-xs text-slate-500 space-y-2 leading-relaxed list-disc pl-4">
            <li>Admins are not permitted to modify their own role structure directly.</li>
            <li>Deleting a user account automatically drops related resume analyses, bookmarks, and applications.</li>
            <li>Recruiter account removal deletes their respective company profile references.</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminDashboard;
