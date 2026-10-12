import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertTriangle, KeyRound } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setError('');
    
    if (!forgotEmail) {
      setError('Please enter your email first.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (response.ok) {
        setForgotMsg(`Mock instructions generated! Reset token: ${data.resetToken}. Use this to mock your password reset.`);
      } else {
        setError(data.message || 'No account found with this email.');
      }
    } catch (err) {
      setError('Connection to auth server failed.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <GlassCard className="w-full max-w-md p-8 shadow-2xl relative" hover={false}>
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white mx-auto shadow-lg shadow-indigo-500/25 mb-4">
            N
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Welcome Back</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Access your career intelligence dashboard
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-semibold animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {forgotMsg && (
          <div className="flex items-start gap-2 p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-all">{forgotMsg}</span>
          </div>
        )}

        {!showForgot ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider pl-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center pl-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setError(''); setForgotMsg(''); }}
                  className="text-xs font-semibold text-indigo-500 hover:text-indigo-650 transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:opacity-60 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider pl-1">
                Enter Account Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-650 transition text-sm"
              >
                Send Code
              </button>
              <button
                type="button"
                onClick={() => { setShowForgot(false); setError(''); setForgotMsg(''); }}
                className="flex-1 py-3 rounded-xl glass-effect border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 font-bold hover:bg-slate-100 transition text-sm"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-450">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-indigo-500 hover:text-indigo-650 transition ml-0.5">
            Create Account
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};

export default Login;
