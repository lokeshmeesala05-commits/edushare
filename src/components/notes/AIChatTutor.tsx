import React, { useState, useEffect, useRef } from 'react';
import { processDocument } from '../../lib/documentProcessor';
import type { DocumentChunk, FileType } from '../../lib/documentProcessor';
import { buildRagContext } from '../../lib/ragEngine';
import { GROQ_API_KEY, buildTutorContext } from '../../lib/gemini';
import { QuickActions } from './QuickActions';
import { X, Bot, FileText, CheckCircle2, AlertCircle, Loader2, Mic } from 'lucide-react';
interface AIChatTutorProps {
  isOpen: boolean;
  onClose: () => void;
  note: {
    title: string;
    subject: string;
    class_name: string;
    description: string;
    file_url?: string;
  };
  onNavigateToPage?: (page: number) => void;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const MODEL = 'llama-3.3-70b-versatile';

const AIChatTutor: React.FC<AIChatTutorProps> = ({ isOpen, onClose, note, onNavigateToPage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'te-IN' | 'en-IN'>('te-IN');
  
  // Document Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('Initializing...');
  const [docChunks, setDocChunks] = useState<DocumentChunk[]>([]);
  // fileType is tracked in state but not currently displayed in UI
  const [_fileType, setFileType] = useState<FileType>('unknown');
  
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isConfigured = !!GROQ_API_KEY;

  useEffect(() => {
    if (isOpen && isConfigured && !initialized) {
      initChat();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const initChat = async () => {
    setIsProcessing(true);
    let chunks: DocumentChunk[] = [];
    let hasContent = false;
    let type: FileType = 'unknown';

    if (note.file_url) {
      const result = await processDocument(note.file_url, setProgressMsg);
      chunks = result.chunks;
      hasContent = result.hasContent;
      type = result.fileType;
      setFileType(type);
      setDocChunks(chunks);
      
      if (result.error && !hasContent) {
        setError(result.error);
      }
    }

    const systemPrompt = buildTutorContext(note);

    let greetingMsg = '';
    if (hasContent) {
      const typeLabel = type === 'pdf' ? 'PDF' : type === 'docx' ? 'Word Document' : 'Image Note';
      greetingMsg = `Hello! I am **EduBot AI**. I have successfully analyzed the **${typeLabel}** for **"${note.title}"**.\n\n✅ ${chunks.length} sections indexed.\n\nYou can now ask me **anything about the content**. I will find the exact answer and provide the page number!\n\nTry asking a question, or use the quick actions below.`;
    } else if (type === 'doc') {
      greetingMsg = `Hello! I am **EduBot AI**.\n\n⚠️ **Old Word (.doc) format is not supported.** Please upload a **.docx** or **.pdf** file. I will answer based on my general knowledge for now.`;
    } else if (type === 'image' && !hasContent) {
      greetingMsg = `Hello! I am **EduBot AI**.\n\n⚠️ The OCR engine couldn't extract readable text from this image. It might be too blurry. I will answer based on my general knowledge for now.`;
    } else {
      greetingMsg = `Hello! I am **EduBot AI**.\n\n⚠️ I couldn't extract text from this document. I'll answer based on my general knowledge of **${note.subject}** instead.`;
    }

    setMessages([
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: greetingMsg }
    ]);
    
    setInitialized(true);
    setIsProcessing(false);
  };

  const handleSend = async (userMessage: string = input) => {
    const textToSend = userMessage.trim();
    if (!textToSend || isTyping) return;

    setInput('');
    setError('');

    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages as Message[]);
    setIsTyping(true);

    // Build RAG Context
    const { contextString } = buildRagContext(textToSend, docChunks);
    
    const apiMessages = [
      { role: 'system', content: messages[0].content + contextString },
      ...newMessages.slice(1)
    ];

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: apiMessages,
          temperature: 0.2, // Low temperature for high factual accuracy
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to EduBot API');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setMessages(prev => prev.slice(0, -1));
      setInput(textToSend);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListen = () => {
    if (isListening) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Voice input is not supported in this browser.'); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setIsListening(true); setError(''); };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-800 px-1 rounded text-emerald-300 text-xs">$1</code>')
      .replace(/^\s*-\s+(.*)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br />');

    // Parse the new simplified citation format:
    // 📄 Title
    // 📖 Page X
    // 📘 Section
    const citationRegex = /📄 (.*?)<br \/>\s*📖 Page (\d+)(?:<br \/>\s*📘 (.*?))(?:<br \/>|$)/g;
    html = html.replace(citationRegex, (_match, title, pageNum, section) => {
      // Build button markup with available metadata
      let metaLines = `📄 ${title}<br/>📖 Page ${pageNum}`;
      if (section) metaLines += `<br/>📘 ${section}`;
      return `
        <div class="mt-4 p-3 bg-slate-800/50 rounded-xl border border-white/5 shadow-inner">
          <div class="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Source Verified
          </div>
          <div class="text-xs text-slate-400 mb-2">
            ${metaLines.replace(/<br\/>/g, '<br/>')}
          </div>
          <button data-page="${pageNum}" class="source-nav-btn w-full py-1.5 flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg transition-colors text-xs font-medium">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            Open Source Page (Page ${pageNum})
          </button>
        </div>
      `;
    });

    // Clean up any stray emojis that the AI might have accidentally generated
    html = html.replace(/📗/g, '').replace(/📕/g, '');

    return html;
  };

  // Setup event delegation for the dynamically rendered Open Source Page buttons
  useEffect(() => {
    if (!messagesEndRef.current) return;
    const handleNavClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.source-nav-btn') as HTMLButtonElement;
      if (btn && btn.dataset.page && onNavigateToPage) {
        onNavigateToPage(parseInt(btn.dataset.page, 10));
      }
    };
    const container = messagesEndRef.current.parentElement;
    if (container) container.addEventListener('click', handleNavClick);
    return () => {
      if (container) container.removeEventListener('click', handleNavClick);
    };
  }, [onNavigateToPage, messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] z-[100] flex flex-col bg-[#0B1120] border-l border-white/10 shadow-2xl transition-transform">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide">EduBot AI</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-medium">
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                AI Ready
              </span>
              {docChunks.length > 0 && (
                <span className="flex items-center gap-1 text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  <FileText className="w-3 h-3" />
                  Document Indexed
                </span>
              )}
              {_fileType === 'image' && (
                <span className="flex items-center gap-1 text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  OCR Enabled
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      {!isConfigured ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">Setup Required</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Please add your <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">VITE_GROQ_API_KEY</code> to the <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">.env</code> file to enable AI features.
          </p>
        </div>
      ) : isProcessing ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative z-10" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Analyzing Document</h3>
          <p className="text-slate-400 text-sm mb-6 h-4">{progressMsg}</p>
          
          <div className="w-full max-w-[200px] space-y-3 text-left">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Reading File
            </div>
            <div className={`flex items-center gap-2 text-xs transition-opacity duration-500 ${progressMsg.includes('Extract') || progressMsg.includes('OCR') ? 'text-slate-300' : 'text-slate-600'}`}>
              <CheckCircle2 className={`w-4 h-4 ${progressMsg.includes('Extract') || progressMsg.includes('OCR') ? 'text-emerald-500' : 'text-slate-700'}`} />
              Extracting Text & Content
            </div>
            <div className={`flex items-center gap-2 text-xs transition-opacity duration-500 ${docChunks.length > 0 ? 'text-slate-300' : 'text-slate-600'}`}>
              <CheckCircle2 className={`w-4 h-4 ${docChunks.length > 0 ? 'text-emerald-500' : 'text-slate-700'}`} />
              Building Search Index
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-900/50 to-slate-900/80">
            {messages.map((msg, idx) => {
              if (msg.role === 'system') return null;
              const isUser = msg.role === 'user';
              
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
                  {!isUser && (
                    <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1 mr-2 hidden sm:flex">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-sm'
                    }`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1 mr-2 hidden sm:flex">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="bg-slate-800 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3.5 flex gap-1.5 items-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center mt-4">
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Quick Actions & Input Area */}
          <div className="bg-slate-900 border-t border-white/10 pb-4">
            {docChunks.length > 0 && messages.length <= 2 && (
              <QuickActions onActionSelect={handleSend} disabled={isTyping || isListening} />
            )}
            
            <div className="px-4 pt-2">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative flex items-center bg-slate-800 border border-white/10 rounded-xl focus-within:border-indigo-500/50 focus-within:bg-slate-800/80 transition-all shadow-inner">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask a question..."}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm py-3.5 pl-4 pr-2 focus:outline-none"
                    disabled={isTyping}
                  />
                  
                  <div className="flex items-center gap-1 pr-2">
                    <button
                      type="button"
                      onClick={() => setVoiceLang(l => l === 'te-IN' ? 'en-IN' : 'te-IN')}
                      className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                      title="Toggle Language"
                    >
                      {voiceLang === 'te-IN' ? 'TE' : 'EN'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={toggleListen}
                      disabled={isTyping}
                      className={`p-2 rounded-lg transition-colors ${
                        isListening 
                          ? 'text-rose-400 bg-rose-500/20 animate-pulse' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatTutor;
