import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register: React.FC = () => {
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [phone, setPhone] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [subject, setSubject] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = (pw: string) => {
    if (pw.length === 0) return { score: 0, label: '', color: '' };
    if (pw.length < 6) return { score: 1, label: 'Too short', color: 'bg-red-500' };
    if (pw.length < 8) return { score: 2, label: 'Weak', color: 'bg-orange-500' };
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw) && pw.length >= 8)
      return { score: 4, label: 'Strong', color: 'bg-green-500' };
    return { score: 3, label: 'Good', color: 'bg-yellow-500' };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (role === 'teacher' && (!phone || !schoolName || !subject)) {
      setError('Phone number, School name, and Subject are required for teachers.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const signupRole = role === 'teacher' ? 'pending_teacher' : 'student';
    const { error } = await signUp(email, password, fullName, signupRole, phone, schoolName, subject);
    setLoading(false);

    if (error) {
      // Friendly messages for common Supabase errors
      const msg = error.message || '';
      if (msg.includes('rate limit') || msg.includes('email rate')) {
        setError('Too many sign-up attempts. Please wait a few minutes and try again, or use a different email address.');
      } else if (msg.includes('already registered') || msg.includes('User already')) {
        setError('This email is already registered. Try signing in instead.');
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="card-base p-10 text-center max-w-md w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-5">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-brand-text dark:text-white mb-3">Check your email!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            We've sent a confirmation link to <span className="text-brand-primary font-medium">{email}</span>.
            Click the link to activate your account.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-brand-primary hover:bg-brand-navy text-white font-semibold rounded-xl shadow-md transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 transition-colors duration-300 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background blobs - Dark mode only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-navy rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Join EduShare and start sharing knowledge</p>
        </div>

        {/* Card */}
        <div className="card-base p-8">
          {error && (
            <div className="mb-5 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-650 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Selection */}
            <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  role === 'student' 
                    ? 'bg-white dark:bg-slate-800 text-brand-text dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                🎓 I am a Student
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  role === 'teacher' 
                    ? 'bg-white dark:bg-slate-800 text-brand-text dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                👨‍🏫 I am a Teacher
              </button>
            </div>

            {role === 'teacher' && (
              <div className="p-4 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-xl mb-4 text-sm text-brand-navy dark:text-indigo-200">
                Teacher accounts require admin approval before you can manage content. Please provide your verifiable details.
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-brand-border dark:border-slate-700 rounded-xl px-4 py-3 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email address
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-brand-border dark:border-slate-700 rounded-xl px-4 py-3 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                autoComplete="email"
                required
              />
            </div>

            {/* Teacher Specific Fields */}
            {role === 'teacher' && (
              <>
                <div>
                  <label htmlFor="register-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="register-phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Your contact number"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-brand-border dark:border-slate-700 rounded-xl px-4 py-3 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                    required={role === 'teacher'}
                  />
                </div>
                <div>
                  <label htmlFor="register-school" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    School Name & District
                  </label>
                  <input
                    id="register-school"
                    type="text"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="e.g. ZPHS High School, Hyderabad"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-brand-border dark:border-slate-700 rounded-xl px-4 py-3 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                    required={role === 'teacher'}
                  />
                </div>
                <div>
                  <label htmlFor="register-subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Subject You Teach
                  </label>
                  <select
                    id="register-subject"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-brand-border dark:border-slate-700 rounded-xl px-4 py-3 text-brand-text dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition appearance-none"
                    required={role === 'teacher'}
                  >
                    <option value="" disabled>Select a subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="English">English</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-brand-border dark:border-slate-700 rounded-xl px-4 py-3 pr-12 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : 'bg-slate-200 dark:bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl px-4 py-3 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-500/50 focus:ring-red-500'
                    : 'border-brand-border dark:border-slate-700 focus:ring-brand-primary'
                }`}
                required
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-brand-primary hover:bg-brand-navy text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-brand-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-primary hover:text-brand-navy dark:text-brand-primary dark:hover:text-white font-medium transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
