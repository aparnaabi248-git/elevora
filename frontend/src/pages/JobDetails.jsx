import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Calendar, Sparkles, Send, CheckCircle, ArrowLeft, ArrowUpRight } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadJobAndApplicationStatus = async () => {
      try {
        setLoading(true);
        // Load Job Details
        const jobRes = await API.get(`/jobs/${id}`);
        setJob(jobRes.data);

        // Load applications list to see if student already applied
        const appsRes = await API.get('/applications');
        const hasApplied = appsRes.data.some(app => app.job?._id === id);
        setApplied(hasApplied);
      } catch (err) {
        console.error('Failed to load job details:', err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadJobAndApplicationStatus();
  }, [id]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await API.post('/applications', {
        jobId: id,
        coverLetter
      });
      setApplied(true);
      setSuccessMsg('Your application was submitted successfully!');
      setTimeout(() => {
        setShowApplyModal(false);
        setSuccessMsg('');
      }, 2500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setSubmitLoading(true);
    setErrorMsg('');
    try {
      const res = await API.post('/ai/cover-letter', {
        jobTitle: job.title,
        companyName: job.companyName,
        jobDescription: job.description
      });
      setCoverLetter(res.data.coverLetter || '');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to auto-generate cover letter via AI. Make sure you have filled in your profile experience.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-slate-550 dark:text-slate-400">Job post not found.</p>
        <Link to="/jobs" className="text-indigo-500 font-bold hover:underline">Back to Job search</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-450 hover:text-indigo-550 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Search Listings</span>
      </button>

      {/* Header Info */}
      <GlassCard className="p-8 space-y-6" hover={false}>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex gap-5 items-center">
            <img
              src={job.companyLogo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&fit=crop'}
              alt={job.companyName}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
            />
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{job.title}</h2>
              <span className="text-sm font-extrabold text-indigo-500 mt-1 block">
                {job.companyName}
              </span>
            </div>
          </div>

          {applied ? (
            <button
              disabled
              className="px-6 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-extrabold text-xs flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Applied</span>
            </button>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Application</span>
            </button>
          )}
        </div>

        {/* Metas details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-slate-250/40 dark:border-slate-800/40 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Type</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-350">{job.type}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Work Mode</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-350">{job.workMode}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-350">{job.location}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salary Range</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-350">
              {job.salaryMin ? `${job.salaryMin.toLocaleString()} - ${job.salaryMax ? job.salaryMax.toLocaleString() : 'Negotiable'} ${job.salaryCurrency}` : 'Negotiable'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Description */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6 space-y-4" hover={false}>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Role Overview</h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 whitespace-pre-line">
              {job.description}
            </p>
          </GlassCard>
        </div>

        {/* Right Column: Required Skills & Meta info */}
        <div className="space-y-6">
          {/* LinkedIn Skill Match Breakdown */}
          <GlassCard className="p-6 space-y-4 border-l-4 border-sky-500" hover={false}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sky-500">
                <span>LinkedIn Profile Overlap</span>
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500">
                Verified Match
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Comparison between your verified LinkedIn skills and this position's core requirements:
            </p>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {job.skillsRequired?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 font-extrabold text-[10px] flex items-center gap-1"
                  >
                    <span>✓ {skill}</span>
                  </span>
                ))}
              </div>
            </div>
            {job.applyUrl && (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-2 mt-2"
              >
                <span>Apply via LinkedIn / Company Site</span>
              </a>
            )}
          </GlassCard>

          <GlassCard className="p-6 space-y-4" hover={false}>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Skills Requirements</h3>
            <div className="flex flex-wrap gap-2">
              {job.skillsRequired?.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </GlassCard>

          {job.company && (
            <GlassCard className="p-6 space-y-4" hover={false}>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">About Company</h3>
              <p className="text-xs text-slate-500 leading-relaxed truncate-3-lines">{job.company.description}</p>
              <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                <span className="text-slate-405">Industry: {job.company.industry}</span>
                {job.company.website && (
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-500 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>Website</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-lg p-6 shadow-2xl space-y-4 relative" hover={false}>
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
            >
              &times;
            </button>

            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Submit Application</h3>
            <p className="text-xs text-slate-500 mt-1">
              Apply for <strong>{job.title}</strong> at <strong>{job.companyName}</strong>.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                    Cover Letter (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateCoverLetter}
                    disabled={submitLoading}
                    className={`text-[10px] font-bold text-indigo-500 hover:text-indigo-650 flex items-center gap-0.5 ${submitLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>{submitLoading ? 'Generating...' : 'AI Auto-Generate'}</span>
                  </button>
                </div>
                <textarea
                  rows="6"
                  placeholder="Tell the recruiter why you're a great fit..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  {submitLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
