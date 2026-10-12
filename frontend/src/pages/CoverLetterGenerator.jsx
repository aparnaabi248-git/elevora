import React, { useState } from 'react';
import { Sparkles, FileText, Clipboard, Check, AlertCircle } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const CoverLetterGenerator = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!jobTitle || !companyName || !jobDescription) {
      setError('Please provide Job Title, Company Name and Job Description.');
      return;
    }

    setLoading(true);
    setError('');
    setCoverLetter('');
    setCopied(false);

    try {
      const response = await API.post('/ai/cover-letter', {
        jobTitle,
        companyName,
        jobDescription
      });
      setCoverLetter(response.data.coverLetter || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate cover letter. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold page-heading-white">AI Cover Letter</h2>
        <p className="text-xs page-subtitle-white mt-1">AI Cover Letter</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        {/* Input Form Column */}
        <div className="md:col-span-2">
          <GlassCard className="p-6" hover={false}>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Target Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Stack Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NexaSpheres"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Job Description</label>
                <textarea
                  rows="6"
                  required
                  placeholder="Paste the job description details..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Drafting letter...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Cover Letter</span>
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Output Column */}
        <div className="md:col-span-3">
          {coverLetter ? (
            <GlassCard className="p-6 space-y-4 relative" hover={false}>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800/40">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span>Draft Cover Letter</span>
                </h3>
                <button
                  onClick={handleCopy}
                  className={`p-2 rounded-xl border flex items-center gap-1 transition text-xs font-bold ${
                    copied
                      ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-550'
                  }`}
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850/50 overflow-y-auto max-h-[500px]">
                <p className="text-xs leading-relaxed text-slate-655 dark:text-slate-350 whitespace-pre-wrap font-sans">
                  {coverLetter}
                </p>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-12 text-center space-y-4 text-slate-450" hover={false}>
              <FileText className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-800" />
              <p className="text-sm font-bold text-slate-500">No Letter Generated</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Provide the target title, company name, and job outlines on the left. The AI writer will pull your profile credentials to compile a professional application template.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverLetterGenerator;
