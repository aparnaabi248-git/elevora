import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MapPin, Briefcase, Trash2, ArrowRight } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const SavedJobs = () => {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const response = await API.get('/jobs/saved');
      // Wait, in jobController.js the route we created for getting saved jobs is:
      // GET /jobs/saved
      setSavedJobs(response.data || []);
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleUnsave = async (jobId, e) => {
    e.stopPropagation();
    try {
      await API.post(`/jobs/${jobId}/unsave`);
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
    } catch (err) {
      console.error('Failed to unsave job:', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold page-heading-white">Saved Bookmarks</h2>
        <p className="text-xs page-subtitle-white mt-1">Saved Jobs</p>
      </div>

      {savedJobs.length === 0 ? (
        <GlassCard className="text-center py-12 space-y-4 max-w-lg mx-auto" hover={false}>
          <Bookmark className="w-12 h-12 text-slate-350 mx-auto" />
          <p className="text-sm font-bold text-slate-500">No Bookmarked Jobs</p>
          <p className="text-xs text-slate-400">
            Browse jobs and save them. They will appear here for easy reference.
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-xs"
          >
            Find Jobs
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {savedJobs.map((job) => (
            <GlassCard
              key={job._id}
              onClick={() => navigate(`/jobs/${job._id}`)}
              className="p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex gap-4 items-center justify-between">
                  <div className="flex gap-3 items-center min-w-0">
                    <img
                      src={job.companyLogo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&fit=crop'}
                      alt={job.companyName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">{job.title}</h4>
                      <p className="text-[10px] text-indigo-500 font-medium">{job.companyName}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleUnsave(job._id, e)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:text-rose-500 transition text-slate-400"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.type} • {job.workMode}</span>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/40 flex justify-end mt-2">
                <button className="text-xs font-bold text-indigo-500 flex items-center gap-0.5 hover:underline">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
