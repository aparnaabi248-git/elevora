import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Sparkles, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];
const ACCEPT_ATTR = '.pdf,.docx';

const getFriendlyUploadError = (err) => {
  const status = err?.response?.status;
  const code = err?.response?.data?.code;
  const serverMessage = err?.response?.data?.message;

  if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')) {
    return 'Analysis is taking longer than expected (the AI service may be busy). Please try again in a moment.';
  }

  switch (code) {
    case 'GEMINI_OVERLOADED':
      return 'The AI service is still overloaded after several attempts. Please try again in a few minutes.';
    case 'GEMINI_RATE_LIMITED':
      return 'Too many AI requests right now. Please wait a minute and try again.';
    case 'GEMINI_AUTH':
    case 'GEMINI_NOT_CONFIGURED':
      return 'The AI service is currently misconfigured. Please try again later or contact support.';
    case 'GEMINI_MODEL_NOT_FOUND':
    case 'GEMINI_MODEL_MISCONFIGURED':
      return 'The configured AI model is unsupported. Please contact support.';
    case 'GEMINI_INVALID_RESPONSE':
      return 'The AI service returned an unexpected response. Please try uploading again.';
    case 'ANALYSIS_SAVE_FAILED':
      return 'Your resume was analyzed but the result could not be saved. Please try again.';
    case 'INVALID_RESUME_FILE':
      return serverMessage || 'Invalid resume file. Please upload a valid PDF or DOCX resume.';
    default:
      break;
  }

  if (status === 503) return 'The AI service is still overloaded after several attempts. Please try again in a few minutes.';
  if (status === 429) return 'Too many requests right now. Please wait a minute and try again.';
  if (status === 400) return serverMessage || 'Invalid resume file. Please upload a valid PDF or DOCX resume.';
  return serverMessage || 'Resume upload or analysis failed. Try again.';
};

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);

  // Load existing analysis on component mount
  useEffect(() => {
    const fetchExistingAnalysis = async () => {
      try {
        const response = await API.get('/ai/resume-analysis');
        setAnalysis(response.data);
      } catch (err) {
        // Safe to ignore if they haven't uploaded yet
        console.log('No existing analysis found.');
      }
    };
    fetchExistingAnalysis();
  }, []);

  const handleFileChange = (e) => {
    setError('');
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const lowerName = selectedFile.name.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExtension) {
      setError('Only PDF and DOCX resumes are supported. Legacy .doc files must be converted first.');
      return;
    }
    if (selectedFile.size > MAX_RESUME_BYTES) {
      setError('Resume file is too large. Please upload a file smaller than 10MB.');
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF or DOCX file first.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      // AI analysis with retries/backoff can exceed the default 30s API
      // timeout, so allow up to 120s for this request only.
      const response = await API.post('/ai/analyze-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      setAnalysis(response.data);
    } catch (err) {
      setError(getFriendlyUploadError(err));
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500/35';
    if (score >= 60) return 'text-indigo-500 border-indigo-500/35';
    return 'text-amber-500 border-amber-500/35';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold page-heading-white">AI Resume Analyzer</h2>
        <p className="text-xs page-subtitle-white mt-1">Upload Resume</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        {/* Upload Column */}
        <div className="md:col-span-2 space-y-4">
          <GlassCard className="p-6 text-center" hover={false}>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-8 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition cursor-pointer relative group">
                <input
                  type="file"
                  accept={ACCEPT_ATTR}
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 transition mx-auto mb-3" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {file ? file.name : 'Select PDF or DOCX Resume'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Drag and drop or click to browse (max 10MB)
                </span>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </button>
            </form>
          </GlassCard>

          {analysis && (
            <GlassCard className="p-6 space-y-4" hover={false}>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Career Suggestions</h3>
              <div className="flex flex-col gap-2">
                {analysis.careerSuggestions?.map((path, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/50 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between"
                  >
                    <span>{path}</span>
                    <ArrowRight className="w-4 h-4 text-indigo-500" />
                  </span>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Results Column */}
        <div className="md:col-span-3">
          {analysis ? (
            <div className="space-y-6">
              {/* ATS Score card */}
              <GlassCard className="p-6 flex flex-col sm:flex-row items-center gap-6" hover={false}>
                <div className={`w-24 h-24 rounded-full border-8 flex items-center justify-center shrink-0 ${getScoreColor(analysis.resumeScore)}`}>
                  <div className="text-center">
                    <span className="text-2xl font-black">{analysis.resumeScore}</span>
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-450">Score</span>
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-indigo-500 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Evaluation Results</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {analysis.feedback}
                  </p>
                </div>
              </GlassCard>

              {/* Skills Card */}
              <GlassCard className="p-6 space-y-4" hover={false}>
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-250">Extracted Core Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.extractedInfo?.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-500 font-bold text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </GlassCard>

              {/* Roadmap Card */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">AI Learning Roadmap</h3>
                <div className="space-y-4">
                  {analysis.learningRoadmap?.map((item, idx) => (
                    <GlassCard key={idx} className="p-5 space-y-3" hover={false}>
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <h4 className="font-extrabold text-sm text-indigo-500 flex items-center gap-1.5">
                          <BookOpen className="w-4.5 h-4.5" />
                          <span>{item.topic}</span>
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-500">
                          {item.estimatedTime}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                        {item.description}
                      </p>
                      {item.resources && item.resources.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-850/50">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Recommended Learning Paths:</span>
                          <div className="flex flex-wrap gap-2">
                            {item.resources.map((res, rIdx) => (
                              <span
                                key={rIdx}
                                className="text-[10px] text-indigo-500 font-semibold hover:underline cursor-pointer"
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <GlassCard className="p-12 text-center space-y-4 text-slate-400" hover={false}>
              <FileText className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-800" />
              <p className="text-sm font-bold text-slate-500">No Resume Uploaded</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Upload your resume in the left panel. Our AI engine will immediately parse credentials, evaluate profile scores, and build study roadmaps.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;
