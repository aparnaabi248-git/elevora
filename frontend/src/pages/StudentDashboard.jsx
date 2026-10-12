import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Bookmark, FileText, Send, Sparkles, AlertTriangle, ArrowRight, ArrowUpRight } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    applicationsCount: 0,
    savedJobsCount: 0,
    resumeScore: 0,
    completion: 0
  });
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Load User Profile for completion and resume details
        const profileRes = await API.get('/profile');
        const profile = profileRes.data;

        // 2. Load Applications
        const appRes = await API.get('/applications');
        
        // 3. Load Jobs for recommendations matching user skills
        const jobsRes = await API.get('/jobs?limit=5');
        const allJobs = jobsRes.data.jobs || [];

        // Match jobs based on user skills (simple intersection check)
        const userSkills = profile.skills || [];
        const matched = allJobs.filter(job => 
          job.skillsRequired && job.skillsRequired.some(s => userSkills.includes(s))
        ).slice(0, 3);

        // If no skills overlap, recommend standard entry-level jobs
        const finalRecs = matched.length > 0 ? matched : allJobs.slice(0, 3);

        // 4. Load Notifications
        const notifRes = await API.get('/notifications');

        setStats({
          applicationsCount: appRes.data.length,
          savedJobsCount: profile.savedJobs?.length || 0,
          resumeScore: profile.resumeScore || 0,
          completion: profile.profileCompletion || 20
        });

        setRecommendedJobs(finalRecs);
        setNotifications(notifRes.data.slice(0, 3));
      } catch (error) {
        console.error('Error loading student dashboard:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
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
      {/* Welcome Hero Card */}
      <div className="dashboard-hero relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 p-8 text-white shadow-xl">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold page-heading-white">Welcome back, {user?.name}!</h2>
            <p className="text-indigo-100 text-sm max-w-xl">Dashboard</p>
          </div>
          <button
            onClick={() => navigate('/upload-resume')}
            className="px-6 py-3 shrink-0 rounded-2xl bg-white text-indigo-600 font-bold hover:bg-indigo-50 active:scale-[0.98] transition-all flex items-center gap-2 text-sm shadow-md"
          >
            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
            <span>AI Resume Review</span>
          </button>
        </div>
      </div>

      {/* Profile Completion Indicator */}
      <GlassCard className="p-6" hover={false}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Profile Completion</h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
              Complete your profile details to unlock better matched jobs.
            </p>
          </div>
          <span className="font-black text-indigo-500 text-lg">{stats.completion}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-1000"
            style={{ width: `${stats.completion}%` }}
          />
        </div>
        {stats.completion < 100 && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Tip: {stats.completion < 40 ? 'Fill in your education details' : stats.completion < 60 ? 'Add certifications' : stats.completion < 80 ? 'Add your work experience' : 'Upload your resume'} to hit 100%!
            </span>
          </div>
        )}
      </GlassCard>

      {/* Telemetry Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <GlassCard className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.applicationsCount}</div>
            <div className="text-xs text-slate-450 dark:text-slate-500 font-medium">Applications Submitted</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.savedJobsCount}</div>
            <div className="text-xs text-slate-450 dark:text-slate-500 font-medium">Saved Bookmarks</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.resumeScore}/100</div>
            <div className="text-xs text-slate-450 dark:text-slate-500 font-medium">AI Resume ATS Score</div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Recommended Jobs */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Recommended Opportunities</h3>
            <Link to="/jobs" className="text-xs font-bold text-indigo-500 hover:text-indigo-650 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {recommendedJobs.length === 0 ? (
              <GlassCard className="text-center py-8 text-slate-500" hover={false}>
                No jobs matched your current skill set. Search jobs to browse listings.
              </GlassCard>
            ) : (
              recommendedJobs.map((job) => (
                <GlassCard
                  key={job._id}
                  onClick={() => navigate(`/jobs/${job._id}`)}
                  className="flex gap-4 items-center justify-between p-4"
                >
                  <div className="flex gap-4 items-center min-w-0">
                    <img
                      src={job.companyLogo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&fit=crop'}
                      alt={job.companyName}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">{job.title}</h4>
                      <p className="text-xs text-indigo-500 font-medium mt-0.5">{job.companyName}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                          {job.location}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 font-semibold">
                          {job.workMode}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-500 transition">
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </GlassCard>
              ))
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Recent Alerts</h3>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <GlassCard className="text-center py-8 text-slate-500" hover={false}>
                No alerts at this moment
              </GlassCard>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 rounded-2xl glass-effect border border-slate-200/50 dark:border-slate-800/40 flex items-start gap-3 ${
                    n.read ? 'opacity-60' : 'border-l-4 border-indigo-500 bg-indigo-500/5'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{n.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
