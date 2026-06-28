import React, { useState, useRef } from 'react';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const CLASSES   = ['6th Class','7th Class','8th Class','9th Class','10th Class','Intermediate 1st Year','Intermediate 2nd Year'];
const SUBJECTS  = ['Mathematics','Science','Social Studies','Telugu','Hindi','English','Physics','Chemistry','Biology','Other'];
const LANGUAGES = ['Telugu Medium','English Medium'];
const DOC_TYPES = [
  { value: 'notes',      label: '📝 Notes',       desc: 'Handwritten or typed chapter notes' },
  { value: 'textbook',   label: '📚 Textbook',     desc: 'Full SCERT / NCERT textbooks' },
  { value: 'guide',      label: '📋 Study Guide',  desc: 'Summary sheets, revision guides' },
  { value: 'exam_paper', label: '📄 Exam Paper',   desc: 'Previous year question papers' },
  { value: 'model_paper',label: '🎯 Model Paper',  desc: 'Practice / model papers' },
];

const UploadNote: React.FC = () => {
  const { user } = useAuth();

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [className, setClassName]   = useState('10th Class');
  const [subject, setSubject]       = useState('Science');
  const [customSubject, setCustomSubject] = useState('');
  const [chapter, setChapter]       = useState('');
  const [language, setLanguage]     = useState('Telugu Medium');
  const [docType, setDocType]       = useState('notes');
  const [file, setFile]             = useState<File | null>(null);
  const [dragOver, setDragOver]     = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [status, setStatus]         = useState<{type:'idle'|'success'|'error'; message:string}>({type:'idle',message:''});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setStatus({type:'error', message:'Please select a file to upload.'}); return; }
    if (file.size > 20 * 1024 * 1024) { setStatus({type:'error', message:'File size must be less than 20 MB.'}); return; }

    const finalSubject = subject === 'Other' ? customSubject.trim() : subject;
    if (!finalSubject) { setStatus({type:'error', message:'Please provide a subject.'}); return; }

    setIsUploading(true);
    setProgress(10);
    setStatus({type:'idle', message:''});

    try {
      const fileExt  = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      setProgress(30);
      const { error: uploadError } = await supabase.storage.from('notes').upload(filePath, file);
      if (uploadError) throw uploadError;

      setProgress(70);
      const { data: { publicUrl } } = supabase.storage.from('notes').getPublicUrl(filePath);

      setProgress(85);
      const isAutoApproved = user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'super_admin' || user?.user_metadata?.role === 'teacher';
      
      const { error: insertError } = await supabase.from('notes').insert([{
        title,
        description,
        class_name: className,
        subject: finalSubject,
        chapter,
        language,
        doc_type: docType,
        file_url: publicUrl,
        uploaded_by: user?.id || null,
        approval_status: isAutoApproved ? 'approved' : 'pending',
      }]);
      if (insertError) throw insertError;

      setProgress(100);
      setStatus({
        type: 'success', 
        message: isAutoApproved ? '🎉 Note uploaded and published instantly!' : '🎉 Note uploaded! It will be visible once an admin approves it.'
      });
      setTitle(''); setDescription(''); setChapter(''); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setProgress(0), 1500);
    } catch (err: any) {
      setStatus({type:'error', message: err.message || 'Upload failed. Please try again.'});
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 transition-colors duration-300">
      <div className="relative max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-primary/10 rounded-2xl shadow-sm mb-4 text-brand-primary">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-brand-text dark:text-white">Upload Educational Material</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Share notes, guides or question papers. Reviewed by admin before publishing.</p>
        </div>

        <div className="card-base p-8">
          {/* Status Messages */}
          {status.type === 'success' && (
            <div className="mb-6 flex items-center gap-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800 dark:text-green-300 text-sm">{status.message}</p>
            </div>
          )}
          {status.type === 'error' && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 dark:text-red-300 text-sm">{status.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label htmlFor="upload-title" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Document Title *</label>
              <input
                id="upload-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. 10th Class Physics Chapter 1 Notes"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-sm"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="upload-desc" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span></label>
              <textarea
                id="upload-desc"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe what this document covers…"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-sm resize-none"
              />
            </div>

            {/* 2-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Class */}
              <div>
                <label htmlFor="upload-class" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Class *</label>
                <select
                  id="upload-class"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-sm appearance-none"
                  required
                >
                  {CLASSES.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>)}
                </select>
              </div>
              {/* Subject */}
              <div>
                <label htmlFor="upload-subject" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subject *</label>
                <div className="flex gap-2">
                  <select
                    id="upload-subject"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-sm appearance-none"
                    required
                  >
                    {SUBJECTS.map(s => <option key={s} value={s} className="bg-white dark:bg-slate-900">{s}</option>)}
                  </select>
                  {subject === 'Other' && (
                    <input
                      type="text"
                      value={customSubject}
                      onChange={e => setCustomSubject(e.target.value)}
                      placeholder="Type custom subject..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-sm"
                      required
                    />
                  )}
                </div>
              </div>
              {/* Language */}
              <div>
                <label htmlFor="upload-lang" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Language Medium *</label>
                <select
                  id="upload-lang"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-sm appearance-none"
                  required
                >
                  {LANGUAGES.map(l => <option key={l} value={l} className="bg-white dark:bg-slate-900">{l}</option>)}
                </select>
              </div>
              {/* Document Type */}
              <div>
                <label htmlFor="upload-doctype" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Document Type *</label>
                <select
                  id="upload-doctype"
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-sm appearance-none"
                  required
                >
                  {DOC_TYPES.map(d => <option key={d.value} value={d.value} className="bg-white dark:bg-slate-900">{d.label}</option>)}
                </select>
              </div>
              {/* Chapter */}
              <div>
                <label htmlFor="upload-chapter" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Chapter / Unit <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span></label>
                <input
                  id="upload-chapter"
                  type="text"
                  value={chapter}
                  onChange={e => setChapter(e.target.value)}
                  placeholder="e.g. Kinematics"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* File Drop Zone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">File Upload *</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-brand-primary bg-brand-primary/10'
                    : file
                    ? 'border-brand-emerald bg-brand-emerald/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-brand-primary hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                {file ? (
                  <>
                    <div className="w-12 h-12 bg-brand-emerald/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-brand-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-brand-emerald font-medium text-sm">{file.name}</p>
                    <p className="text-slate-500 text-xs mt-1">{formatBytes(file.size)} · Click to change</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-brand-text dark:text-white font-medium text-sm mb-1">Drag & drop or click to browse</p>
                    <p className="text-slate-500 text-xs">PDF, DOC, DOCX, JPG, PNG — up to 20 MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-primary rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              id="upload-submit"
              type="submit"
              disabled={isUploading}
              className="w-full py-3.5 bg-brand-primary hover:bg-brand-navy text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading…</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>Upload Note</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadNote;
