import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent transition-colors duration-200 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Forgot Password?</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Enter your email and we'll send a reset link</p>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-xl dark:shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check your email!</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                We sent a password reset link to <span className="text-indigo-650 dark:text-indigo-400 font-medium">{email}</span>.
                Click the link in the email to reset your password.
              </p>
              <Link to="/login" className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm shadow-md">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3">
                  <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  />
                </div>
                <button
                  id="forgot-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</>
                  ) : 'Send Reset Link'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Remember your password?{' '}
                <Link to="/login" className="text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
