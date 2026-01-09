import React, { useRef, useEffect, useState } from 'react';
import { Message, MessageRole } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string, isImageGen?: boolean) => void;
  streamingMessage?: { text: string; role: MessageRole } | null;
}

// Fixed set of high-value tech productivity starters
const STARTERS = [
  { icon: '💻', label: 'Code Review', text: "Create a comprehensive checklist for reviewing a React component, focusing on performance and accessibility." },
  { icon: '📧', label: 'Status Update', text: "Draft a project status update email for stakeholders. Include sections for: Key Achievements, Current Blockers, and Next Steps." },
  { icon: '🏗️', label: 'Architecture', text: "Outline a high-level architecture for a scalable real-time notification system using Node.js." },
  { icon: '🐛', label: 'Debug Strategy', text: "Explain how to identify and fix memory leaks in a Node.js production application." },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isLoading, 
  onSend, 
  streamingMessage 
}) => {
  const [input, setInput] = useState('');
  const [isImageMode, setIsImageMode] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || streamingMessage) return;
    onSend(trimmedInput, isImageMode);
    setInput('');
    setIsImageMode(false);
  };

  const handleStarterClick = (text: string) => {
    if (isLoading || streamingMessage) return;
    const isImage = text.toLowerCase().startsWith('generate an image');
    onSend(text, isImage);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950/20 backdrop-blur-sm">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-40 md:pb-32 scroll-smooth">
        {messages.length === 0 && !streamingMessage && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-gray-700">
              <span className="text-3xl animate-bounce">⚡</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">System Online. Ready.</h2>
            <p className="text-gray-400 mb-10 text-center max-w-sm">
              I can help with code reviews, system design, debugging, or technical documentation.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {STARTERS.map((starter, i) => (
                <button
                  key={i}
                  onClick={() => handleStarterClick(starter.text)}
                  disabled={isLoading}
                  className="bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 hover:border-accent-500/50 p-4 rounded-xl text-left transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl p-2 bg-gray-900/50 rounded-lg group-hover:bg-accent-500/10 transition-colors">
                      {starter.icon}
                    </span>
                    <div>
                      <span className="block text-sm font-bold text-gray-200 group-hover:text-accent-400 mb-0.5 transition-colors">
                        {starter.label}
                      </span>
                      <span className="text-xs text-gray-500 group-hover:text-gray-400 line-clamp-2 leading-snug">
                        {starter.text}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-md ${
                msg.role === MessageRole.USER
                  ? 'bg-accent-600 text-white rounded-br-none'
                  : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
              }`}
            >
              {msg.attachment && msg.attachment.type === 'image' && (
                <div className="mb-3 rounded-xl overflow-hidden shadow-lg border border-white/10">
                   <img 
                     src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} 
                     alt="Generated content"
                     className="w-full h-auto object-cover max-h-96" 
                     loading="lazy"
                   />
                </div>
              )}
              {msg.text && <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</div>}
              
              <div className={`text-[10px] mt-2 font-medium opacity-50 ${msg.role === MessageRole.USER ? 'text-right' : 'text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {streamingMessage && (
          <div className={`flex ${streamingMessage.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-lg border transition-all duration-300 ${
                streamingMessage.role === MessageRole.USER
                  ? 'bg-accent-600/60 text-white rounded-br-none border-accent-400/30'
                  : 'bg-gray-800/80 text-gray-100 rounded-bl-none border-gray-600'
              }`}
            >
               <div className="whitespace-pre-wrap leading-relaxed text-[15px] animate-pulse">
                 {streamingMessage.text || 'Thinking...'}
               </div>
               <div className="flex items-center gap-2 text-[10px] mt-2 font-bold uppercase tracking-widest opacity-60">
                 <span className="flex h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                 {streamingMessage.role === MessageRole.USER ? 'Listening' : 'Gemini speaking'}
               </div>
            </div>
          </div>
        )}

        {isLoading && !streamingMessage && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-4 rounded-2xl rounded-bl-none border border-gray-700 shadow-sm">
              <div className="flex space-x-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gray-900/80 border-t border-gray-800 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto relative group">
          <form onSubmit={handleSubmit} className="relative">
            {/* Image Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsImageMode(!isImageMode)}
              className={`absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300 z-10 ${
                isImageMode 
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={isImageMode ? "Switch to Text Mode" : "Switch to Image Mode"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isImageMode ? 2 : 1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isLoading 
                  ? "Gemini is working..." 
                  : isImageMode 
                    ? "Describe the image you want to generate..." 
                    : "Ask me anything..."
              }
              className={`w-full bg-gray-800/50 text-white rounded-2xl py-4 pl-14 pr-14 focus:outline-none focus:ring-2 border transition-all text-[15px] ${
                isImageMode 
                  ? 'border-purple-500/30 focus:ring-purple-500/50 placeholder-purple-200/30' 
                  : 'border-gray-700 hover:border-gray-600 focus:ring-accent-500/50 placeholder-gray-500'
              }`}
              disabled={isLoading || !!streamingMessage}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading || !!streamingMessage}
              className={`absolute right-2.5 top-2.5 bottom-2.5 aspect-square text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-30 ${
                isImageMode
                  ? 'bg-purple-600 hover:bg-purple-500 disabled:hover:bg-purple-600'
                  : 'bg-accent-600 hover:bg-accent-500 disabled:hover:bg-accent-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};