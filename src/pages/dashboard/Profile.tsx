import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, school_name')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      if (data) {
        setName(data.name || '');
        setSchoolName(data.school_name || '');
      }
    } catch (err) {
      console.error('Error fetching profile', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('users')
        .update({ name, school_name: schoolName })
        .eq('id', user?.id);

      if (error) throw error;
      
      // Also update auth metadata if needed
      await supabase.auth.updateUser({
        data: { name }
      });

      setMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err.message || 'Error updating profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 transition-colors duration-300 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="card-base p-8">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center text-2xl font-bold">
              {name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-text dark:text-white">My Profile</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
            </div>
          </div>

          {msg.text && (
            <div className={`p-4 rounded-xl mb-6 text-sm ${msg.type === 'success' ? 'bg-green-50 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400 border border-green-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">School / College Name (Optional)</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors"
                placeholder="ZPHS High School"
              />
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-brand-primary hover:bg-brand-navy disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-md"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
