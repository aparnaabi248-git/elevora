import React, { useState } from 'react';
import { Sparkles, MessageSquare, ShieldAlert, ArrowRight, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const InterviewPrep = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobDescription) {
      setError('Please provide both Job Title and Job Description.');
      return;
    }

    setLoading(true);
    setError('');
    setQuestions([]);
    setExpandedIndex(null);

    try {
      const response = await API.post('/ai/interview-prep', {
        jobTitle,
        jobDescription
      });
      setQuestions(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate interview questions. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold page-heading-white">AI Interview Prep</h2>
        <p className="text-xs page-subtitle-white mt-1">AI Interview Prep</p>
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
                  placeholder="e.g. Front-End Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Job Description</label>
                <textarea
                  rows="8"
                  required
                  placeholder="Paste the job description details here to extract matched questions..."
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
                    <span>Generating drills...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Interview Drills</span>
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Questions List Column */}
        <div className="md:col-span-3">
          {questions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Practice Drills</h3>
              <div className="space-y-3">
                {questions.map((q, index) => {
                  const isExpanded = expandedIndex === index;
                  return (
                    <GlassCard
                      key={index}
                      className="p-5 space-y-3 cursor-pointer"
                      hover={!isExpanded}
                      onClick={() => toggleExpand(index)}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            Q{index + 1}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 leading-snug">
                            {q.question}
                          </h4>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
                      </div>

                      {isExpanded && (
                        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/40 space-y-3 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Category:</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold capitalize">
                              {q.type}
                            </span>
                          </div>
                          
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/50">
                            <h5 className="font-bold text-[10px] uppercase text-indigo-500 flex items-center gap-1 mb-2">
                              <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                              <span>AI Answer Guideline:</span>
                            </h5>
                            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                              {q.guideline}
                            </p>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          ) : (
            <GlassCard className="p-12 text-center space-y-4 text-slate-450" hover={false}>
              <MessageSquare className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-800" />
              <p className="text-sm font-bold text-slate-500">No Drill Set Loaded</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Specify your target title and paste the job outline on the left. The AI coach will build 5 target drills matching your exact profile skills.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;
