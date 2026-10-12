import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Briefcase, MapPin, DollarSign, Calendar, FileText, ArrowLeft, Check } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyName: '',
    companyLogo: '',
    skillsRequired: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    location: '',
    type: 'Full-time',
    workMode: 'On-site',
    experienceLevel: 'Entry',
    applyUrl: '',
    expiresAt: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Auto-redirect if recruiter doesn't have a company profile
  useEffect(() => {
    const checkCompanyProfile = async () => {
      if (user?.role === 'recruiter') {
        try {
          const res = await API.get('/profile');
          if (!res.data.company) {
            setError('You must configure your company profile first before posting jobs.');
            setTimeout(() => {
              navigate('/');
            }, 3000);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    checkCompanyProfile();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Format fields
    const dataToSend = {
      ...formData,
      salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
      salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
      skillsRequired: formData.skillsRequired
        ? formData.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean)
        : []
    };

    try {
      await API.post('/jobs', dataToSend);
      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        companyName: '',
        companyLogo: '',
        skillsRequired: '',
        salaryMin: '',
        salaryMax: '',
        salaryCurrency: 'USD',
        location: '',
        type: 'Full-time',
        workMode: 'On-site',
        experienceLevel: 'Entry',
        applyUrl: '',
        expiresAt: ''
      });
      setTimeout(() => {
        setSuccess(false);
        navigate('/jobs');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-450 hover:text-indigo-550 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Post a Job</h2>
        <p className="text-xs text-slate-500 mt-1">Create a new career listing matching talented students</p>
      </div>

      <GlassCard className="p-8" hover={false}>
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs mb-4 flex items-center gap-1.5 font-bold">
            <Check className="w-4 h-4" />
            <span>Job listing posted successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Job Title</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Junior React Developer"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Location</label>
              <input
                type="text"
                name="location"
                required
                placeholder="e.g. San Francisco, CA / Remote"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850 dark:text-slate-100"
              />
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  required
                  placeholder="e.g. Nexora Enterprises"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Company Logo URL</label>
                <input
                  type="url"
                  name="companyLogo"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.companyLogo}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Job Description</label>
            <textarea
              name="description"
              required
              rows="6"
              placeholder="Outline the responsibilities, requirements, and benefits of the role..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Required Skills (Comma separated)</label>
            <input
              type="text"
              name="skillsRequired"
              placeholder="React, Node.js, Express, MongoDB, Tailwind"
              value={formData.skillsRequired}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Job Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-700 dark:text-slate-350"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Work Mode</label>
              <select
                name="workMode"
                value={formData.workMode}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-700 dark:text-slate-350"
              >
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Experience Level</label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-700 dark:text-slate-350"
              >
                <option value="Entry">Entry</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Min Salary</label>
              <input
                type="number"
                name="salaryMin"
                placeholder="60000"
                value={formData.salaryMin}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-855 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Max Salary</label>
              <input
                type="number"
                name="salaryMax"
                placeholder="90000"
                value={formData.salaryMax}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-855 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Currency</label>
              <input
                type="text"
                name="salaryCurrency"
                placeholder="USD"
                value={formData.salaryCurrency}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-855 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Apply URL (Optional)</label>
              <input
                type="url"
                name="applyUrl"
                placeholder="https://company.com/careers/job"
                value={formData.applyUrl}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-855 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Expires At (Optional)</label>
              <input
                type="date"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-855 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Publish Job Listing</span>
              </>
            )}
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

export default PostJob;
