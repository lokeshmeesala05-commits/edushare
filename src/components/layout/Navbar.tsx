import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-bold text-xl text-white tracking-tight">Edu<span className="text-indigo-400">Share</span></span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/" className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                Home
              </Link>
              <Link to="/notes" className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                Browse Notes
              </Link>
              {user && (
                <>
                  <Link to="/upload" className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    Upload
                  </Link>
                  <Link to="/dashboard" className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Avatar */}
                <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <span className="hidden md:block text-sm text-slate-300 max-w-[120px] truncate">
                    {user?.user_metadata?.full_name || user.email}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 rounded-lg transition-all"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white"
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
          <div className="md:hidden border-t border-white/10 py-3 space-y-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Home</Link>
            <Link to="/notes" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Browse Notes</Link>
            {user && (
              <>
                <Link to="/upload" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Upload</Link>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Dashboard</Link>
                <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg">Sign out</button>
              </>
            )}
            {!user && (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Log in</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-white/5 rounded-lg">Sign up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
