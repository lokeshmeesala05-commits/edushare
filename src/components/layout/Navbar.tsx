import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const isAdmin = user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'super_admin';

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-navy rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-bold text-2xl text-brand-text dark:text-white tracking-tight">Edu<span className="text-brand-primary">Share</span></span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-white/5 rounded-lg transition-all duration-300">
                Home
              </Link>
              <Link to="/notes" className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-white/5 rounded-lg transition-all duration-300">
                Browse Notes
              </Link>
              {user && (
                <>
                  <Link to="/upload" className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-white/5 rounded-lg transition-all duration-300">
                    Upload
                  </Link>
                  <Link to="/dashboard" className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-white/5 rounded-lg transition-all duration-300">
                    Dashboard
                  </Link>
                  <Link to="/student/downloads" className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-white/5 rounded-lg transition-all duration-300">
                    Downloads
                  </Link>
                  <Link to="/student/requests" className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-white/5 rounded-lg transition-all duration-300">
                    Requests
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/users" className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-white/5 rounded-lg transition-all duration-300">
                      Manage Users
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-brand-primary dark:text-slate-400 dark:hover:text-amber-400 hover:bg-brand-primary/10 dark:hover:bg-white/5 rounded-lg transition-all"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {/* User Avatar */}
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition" title="My Profile">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-navy rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-brand-primary/20">
                    {initials}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                    {user?.user_metadata?.full_name || user.email}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-white/10 rounded-lg transition-all"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-white transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-navy hover:from-brand-navy hover:to-brand-primary text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-brand-primary/25"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              onClick={() => setMobileOpen(o => !o)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-white/10 py-3 space-y-1 bg-white dark:bg-slate-900 px-4 -mx-4 shadow-lg">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Home</Link>
            <Link to="/notes" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Browse Notes</Link>
            {user && (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Profile</Link>
                <Link to="/upload" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Upload</Link>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Dashboard</Link>
                <Link to="/student/downloads" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Downloads</Link>
                <Link to="/student/requests" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Requests</Link>
                {isAdmin && (
                  <Link to="/admin/users" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Manage Users</Link>
                )}
                <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-white/5 rounded-lg">Sign out</button>
              </>
            )}
            {!user && (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Log in</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-white/5 rounded-lg">Sign up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
