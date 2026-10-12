import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Users, FileText, CheckCircle2, XCircle, ArrowUpRight, HelpCircle } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    jobsCount: 0,
    applicantsCount: 0
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Company creation form state
  const [hasCompany, setHasCompany] = useState(true);
  const [compName, setCompName] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compInd, setCompInd] = useState('');
  const [compLoc, setCompLoc] = useState('');
  const [compWeb, setCompWeb] = useState('');
  const [compMsg, setCompMsg] = useState('');
  const [compErr, setCompErr] = useState('');

  const loadRecruiterData = async () => {
    try {
      setLoading(true);
      // Load user profile to verify company setup
      const profileRes = await API.get('/profile');
      const profile = profileRes.data;

      if (!profile.company) {
        setHasCompany(false);
        setLoading(false);
        return;
      }

      setHasCompany(true);

      // Load job listings posted by recruiter
      const jobsRes = await API.get('/jobs');
      const allJobs = jobsRes.data.jobs || [];
      const myJobs = allJobs.filter(j => j.postedBy?.toString() === user._id || j.postedBy === user._id);

      // Load applications
      const appsRes = await API.get('/applications');
      const myApps = appsRes.data || [];

      setStats({
        jobsCount: myJobs.length,
        applicantsCount: myApps.length
      });

      setApplications(myApps);
    } catch (error) {
      console.error('Error loading recruiter dashboard:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecruiterData();
    }
  }, [user]);

  const handleCreateCompanySubmit = async (e) => {
    e.preventDefault();
    setCompErr('');
    setCompMsg('');

    try {
      await API.post('/companies', {
        name: compName,
        description: compDesc,
        industry: compInd,
        location: compLoc,
        website: compWeb
      });
      setCompMsg('Company profile created successfully!');
      setTimeout(() => {
        loadRecruiterData();
      }, 2000);
    } catch (err) {
      setCompErr(err.response?.data?.message || 'Failed to create company profile.');
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await API.patch(`/applications/${appId}/status`, { status: newStatus });
      setApplications(prev =>
        prev.map(app => app._id === appId ? { ...app, status: newStatus } : app)
      );
    } catch (error) {
      console.error('Failed to change application status:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!hasCompany) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Setup Company Profile</h2>
          <p className="text-xs text-slate-500 mt-1">Provide metadata details to enable posting listings</p>
        </div>

        <GlassCard className="p-6" hover={false}>
          {compErr && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs mb-4">
              {compErr}
            </div>
          )}
          {compMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-650 text-xs mb-4">
              {compMsg}
            </div>
          )}

          <form onSubmit={handleCreateCompanySubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Company Name</label>
              <input
                type="text"
                required
                placeholder="e.g. NexaSpheres"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-850 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Description</label>
              <textarea
                rows="4"
                required
                placeholder="Write a brief overview of company industry focus..."
                value={compDesc}
                onChange={(e) => setCompDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-850 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Industry</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technology"
                  value={compInd}
                  onChange={(e) => setCompInd(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-850 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. San Francisco, CA"
                  value={compLoc}
                  onChange={(e) => setCompLoc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-850 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Website URL (Optional)</label>
              <input
                type="url"
                placeholder="https://company.io"
                value={compWeb}
                onChange={(e) => setCompWeb(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-850 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-md transition"
            >
              Create Company Profile
            </button>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Recruiter Dashboard</h2>
        <p className="text-xs text-slate-500 mt-1">Manage company job listings, evaluate applicants, and review match metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <GlassCard className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.jobsCount}</div>
            <div className="text-xs text-slate-450 dark:text-slate-500 font-medium">Active Job Listings</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.applicantsCount}</div>
            <div className="text-xs text-slate-450 dark:text-slate-500 font-medium">Job Applicants Received</div>
          </div>
        </GlassCard>
      </div>

      {/* Applications Table list */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Received Applications</h3>
        
        <div className="space-y-4">
          {applications.length === 0 ? (
            <GlassCard className="text-center py-12 text-slate-500" hover={false}>
              No candidates have applied to your job postings yet.
            </GlassCard>
          ) : (
            applications.map((app) => (
              <GlassCard key={app._id} className="p-6 space-y-4" hover={false}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      {app.student?.name || 'Applicant'}
                    </h4>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">{app.student?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-indigo-500">Applied for:</span>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded font-bold">
                        {app.job?.title || 'Unknown Job'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`text-[10px] px-2.5 py-1.5 rounded-xl font-bold uppercase tracking-wider ${
                      app.status === 'Shortlisted' || app.status === 'Interviewing'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
                        : app.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/25'
                        : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/25'
                    }`}>
                      {app.status}
                    </span>
                    
                    <a
                      href={app.resumeUrl.startsWith('/') ? `http://localhost:5000${app.resumeUrl}` : app.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 hover:text-indigo-500 transition text-[11px] font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-350"
                    >
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>Review Resume</span>
                    </a>
                  </div>
                </div>

                {app.coverLetter && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850/50">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Cover Letter:</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {app.coverLetter}
                    </p>
                  </div>
                )}

                {/* Candidate details preview (education/experience) */}
                {app.student?.skills && app.student.skills.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Extracted Candidate Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {app.student.skills.map((skill, idx) => (
                        <span key={idx} className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 rounded-md font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operations controls */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/40 mt-2">
                  <button
                    onClick={() => handleStatusChange(app._id, 'Shortlisted')}
                    disabled={app.status === 'Shortlisted'}
                    className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition text-[11px] font-bold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Shortlist</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(app._id, 'Rejected')}
                    disabled={app.status === 'Rejected'}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition text-[11px] font-bold flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
