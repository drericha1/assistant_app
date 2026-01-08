import React, { useRef, useEffect, useMemo } from 'react';
import { Message, MessageRole } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
  streamingMessage?: { text: string; role: MessageRole } | null;
}

const ALL_STARTERS = [
  { icon: '🧠', label: 'Brainstorm', text: "Give me 5 creative ideas for a science fiction novel." },
  { icon: '💻', label: 'Code', text: "Write a Python script to scrape a website using beautifulsoup." },
  { icon: '✈️', label: 'Plan', text: "Plan a 3-day trip to Kyoto, Japan for a first-timer." },
  { icon: '🎨', label: 'Design', text: "Suggest a color palette for a modern meditation app." },
  { icon: '🍳', label: 'Recipe', text: "Suggest a healthy dinner recipe using chicken, spinach, and feta." },
  { icon: '📚', label: 'Summarize', text: "Explain the main concepts of quantum entanglement in simple terms." },
  { icon: '💪', label: 'Fitness', text: "Create a 15-minute bodyweight workout for beginners." },
  { icon: '✍️', label: 'Write', text: "Write a formal email asking for a follow-up after a job interview." },
  { icon: '📊', label: 'Analysis', text: "Explain the current trends in sustainable energy for 2025." },
  { icon: '🌎', label: 'Language', text: "Translate 'Where is the nearest library?' into five different languages." },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isLoading, 
  onSend, 
  streamingMessage 
}) => {
  const [input, setInput] = React.useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Memoize random starters so they don't jump around on re-renders
  const displayStarters = useMemo(() => {
    return [...ALL_STARTERS].sort(() => Math.random() - 0.5).slice(0, 4);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || streamingMessage) return;
    onSend(trimmedInput);
    setInput('');
  };

  const handleStarterClick = (text: string) => {
    if (isLoading || streamingMessage) return;
    onSend(text);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950/20 backdrop-blur-sm">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-40 md:pb-32 scroll-smooth">
        {messages.length === 0 && !streamingMessage && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-gray-700">
              <span className="text-3xl animate-bounce">✨</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">How can I help you today?</h2>
            <p className="text-gray-400 mb-10 text-center max-w-sm">
              I can help with coding, planning, creative writing, or just having a conversation.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {displayStarters.map((starter, i) => (
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
              <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</div>
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
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading || streamingMessage ? "Gemini is thinking..." : "Ask me anything..."}
              className="w-full bg-gray-800/50 text-white placeholder-gray-500 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-accent-500/50 border border-gray-700 hover:border-gray-600 transition-all text-[15px]"
              disabled={isLoading || !!streamingMessage}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !!streamingMessage}
              className="absolute right-2.5 top-2.5 bottom-2.5 aspect-square bg-accent-600 hover:bg-accent-500 disabled:opacity-30 disabled:hover:bg-accent-600 text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95"
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