import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface RequestNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  initialClass: string;
  initialSubject: string;
}

const CLASSES = ['6th Class', '7th Class', '8th Class', '9th Class', '10th Class', 'Intermediate 1st Year', 'Intermediate 2nd Year'];

const RequestNoteModal: React.FC<RequestNoteModalProps> = ({ isOpen, onClose, initialQuery, initialClass, initialSubject }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialQuery || '');
  const [className, setClassName] = useState(initialClass || '');
  const [subject, setSubject] = useState(initialSubject || '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to request a note.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const { error: reqError } = await supabase.from('note_requests').insert([{
        requested_title: title,
        class_name: className,
        subject: subject,
        description: description,
        requested_by: user.id
      }]);

      if (reqError) throw reqError;
      
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-xl font-bold text-white mb-1">Request a Note</h3>
        <p className="text-sm text-slate-400 mb-5">
          Can't find what you're looking for? Let us know!
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Topic / Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
              placeholder="e.g., Photosynthesis Chapter 5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Class *</label>
              <select
                required
                value={className}
                onChange={e => setClassName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none text-sm cursor-pointer"
              >
                <option value="" disabled className="bg-slate-900">Select Class</option>
                {CLASSES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                placeholder="e.g., Biology"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none text-sm"
              placeholder="Any specific details about what you need?"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-xl font-medium text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
              submitting 
                ? 'bg-indigo-500/50 text-indigo-200 cursor-wait'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 active:scale-95'
            }`}
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
            ) : (
              'Submit Request'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestNoteModal;
