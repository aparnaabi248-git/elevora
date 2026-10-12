import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, DollarSign, Sparkles, Bookmark, ArrowUpRight, Globe, ExternalLink, CheckCircle2, RefreshCw } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'linkedin'
  const [linkedinData, setLinkedinData] = useState(null);
  
  // Search parameters
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [workMode, setWorkMode] = useState('');
  
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(false);

  // User details for bookmark indicator
  const [savedJobIds, setSavedJobIds] = useState([]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'linkedin') {
        const res = await API.get('/jobs/linkedin-matched');
        setJobs(res.data.jobs || []);
        setLinkedinData(res.data);
        setPages(1);
      } else {
        const params = new URLSearchParams({ page, limit: 6 });
        if (search) params.append('search', search);
        if (location) params.append('location', location);
        if (type) params.append('type', type);
        if (workMode) params.append('workMode', workMode);

        const response = await API.get(`/jobs?${params.toString()}`);
        setJobs(response.data.jobs || []);
        setPages(response.data.pages || 1);
        setTotalJobs(response.data.totalJobs || 0);
      }

      const savedRes = await API.get('/jobs/saved');
      setSavedJobIds(savedRes.data.map(j => j._id));
    } catch (error) {
      console.error('Failed to load jobs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, type, workMode, activeTab]); // Trigger automatically on pagination/dropdown filter changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleSaveToggle = async (jobId, e) => {
    e.stopPropagation();
    try {
      const isSaved = savedJobIds.includes(jobId);
      if (isSaved) {
        await API.post(`/jobs/${jobId}/unsave`);
        setSavedJobIds(prev => prev.filter(id => id !== jobId));
      } else {
        await API.post(`/jobs/${jobId}/save`);
        setSavedJobIds(prev => [...prev, jobId]);
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold page-heading-white">Explore Jobs</h2>
          <p className="text-xs page-subtitle-white mt-1">Search real-world tech positions matched to your LinkedIn profile</p>
        </div>

        <div className="flex gap-2 p-1.5 rounded-2xl glass-effect border border-slate-200/50 dark:border-slate-800/40">
          <button
            onClick={() => { setActiveTab('all'); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All Opportunities
          </button>
          <button
            onClick={() => { setActiveTab('linkedin'); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'linkedin'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                : 'text-sky-500 hover:text-sky-600 dark:hover:text-sky-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>LinkedIn Matched Jobs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-6" hover={false}>
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
              <input
                type="text"
                placeholder="Developer, React..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
              <input
                type="text"
                placeholder="San Francisco, Remote..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">Job Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
            >
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">Work Mode</label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
            >
              <option value="">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>
        </form>
      </GlassCard>

      {/* Main Jobs Listing */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500">
                No jobs matched your current filters.
              </div>
            ) : (
              jobs.map((job) => {
                const isBookmarked = savedJobIds.includes(job._id);
                return (
                  <GlassCard
                    key={job._id}
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="p-6 flex flex-col justify-between gap-4 cursor-pointer hover:border-indigo-500/40 transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={job.companyLogo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&fit=crop'}
                            alt={job.companyName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">{job.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-indigo-500 font-medium">{job.companyName}</p>
                              {job.matchPercentage && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 font-black flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>{job.matchPercentage}% LinkedIn Match</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleSaveToggle(job._id, e)}
                          className={`p-2 rounded-xl border transition ${
                            isBookmarked
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400'
                          }`}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 dark:text-slate-400 text-xs">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{job.location}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span>{job.type} • {job.workMode}</span>
                        </span>
                        {job.salaryMin && (
                          <span className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span>
                              {job.salaryMin.toLocaleString()} - {job.salaryMax ? job.salaryMax.toLocaleString() : 'Negotiable'} {job.salaryCurrency}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/40 flex justify-between items-center mt-2">
                      <span className="text-[10px] text-slate-400">Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}</span>
                      {job.applyUrl && job.applyUrl.includes('linkedin.com') ? (
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                        >
                          <span>Apply on LinkedIn</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 transition font-bold text-xs flex items-center gap-1 text-slate-700 dark:text-slate-350">
                          <span>Details</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 text-xs font-bold transition"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {pages}
            </span>
            <button
              disabled={page === pages}
              onClick={() => setPage(p => Math.min(p + 1, pages))}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 text-xs font-bold transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
