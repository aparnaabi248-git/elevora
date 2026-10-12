import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Brain, Cpu, MessageSquare, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 flex flex-col justify-between">
      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center gap-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-700 dark:text-violet-300 text-xs font-bold animate-pulse-slow">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen AI & Career Consultancy Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl text-slate-900 dark:text-white">
          Elevate Your Career with{' '}
          <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
            AI & Professional Consultancy
          </span>
        </h1>

        <p className="text-slate-600 dark:text-slate-250 text-base sm:text-lg max-w-2xl leading-relaxed">
          Book 1-on-1 career consultations with domain-specific AI mentors or professional human recruiters, get instant ATS resume auditing, trace career paths, and find matching jobs.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {user ? (
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <>
              <Link
                to="/register"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-2xl glass-effect border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-250 font-bold hover:bg-slate-100 dark:hover:bg-slate-850 hover:scale-[1.02] transition-all"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
          <GlassCard className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resume Analyzer</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Upload your PDF resume to extract skills, compute profile completeness, and review immediate ATS strength comments.
            </p>
          </GlassCard>

          <GlassCard className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Skill Gap Roadmaps</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Identify key technical skills required in current job openings, review roadmaps, and browse online learning recommendations.
            </p>
          </GlassCard>

          <GlassCard className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">1-on-1 Consultancy</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Book live virtual consultations with expert AI personas or real recruiters to prepare for interviews and review resumes.
            </p>
          </GlassCard>
        </section>

        {/* Dynamic Telemetry Panel */}
        <section className="w-full mt-12 py-8 px-6 rounded-3xl glass-effect border border-slate-200/50 dark:border-slate-800/40 flex flex-wrap justify-around items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-indigo-500">95%</div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold">ATS Matching Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-cyan-500">10k+</div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold">Mock Job Listings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-purple-500">24/7</div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold">AI Career Coaching</div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/40 dark:border-slate-800/40 mt-12">
        &copy; {new Date().getFullYear()} Nexora Career Intelligence Platform. Powered by Google Gemini AI.
      </footer>
    </div>
  );
};

export default LandingPage;
