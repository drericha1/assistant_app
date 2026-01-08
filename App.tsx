import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { VoiceInterface } from './components/VoiceInterface';
import { Conversation, Message, MessageRole, AppMode } from './types';
import { LiveManager } from './services/liveManager';
import { GoogleGenAI } from "@google/genai";
import { toolsDef, executeTool } from './services/tools';

const SYSTEM_INSTRUCTION = "You are a helpful AI assistant. You have access to tools to change the UI color, check time, and search my history. Be concise and conversational.";

export default function App() {
  // --- Core State ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<AppMode>(AppMode.TEXT);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bgColor, setBgColor] = useState('#0d1117');
  
  // --- UI/Interaction State ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [activeTool, setActiveTool] = useState<string | undefined>(undefined);
  const [streamingContent, setStreamingContent] = useState<{ text: string; role: MessageRole } | null>(null);
  
  // --- Refs ---
  const liveManagerRef = useRef<LiveManager | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  // Keep conversationsRef in sync for use inside callbacks
  useEffect(() => {
    conversationsRef.current = conversations;
    if (conversations.length > 0) {
      localStorage.setItem('gemini_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // --- Initial Load ---
  useEffect(() => {
    const saved = localStorage.getItem('gemini_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0) setActiveId(parsed[parsed.length - 1].id);
      } catch (e) {
        createNewConversation();
      }
    } else {
      createNewConversation();
    }
  }, []);

  const activeConversation = conversations.find(c => c.id === activeId);

  // --- Actions ---
  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    setConversations(prev => [...prev, newConv]);
    setActiveId(newConv.id);
    setMode(AppMode.TEXT);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const updateConversation = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => c.id === id ? updater(c) : c));
  }, []);

  const generateTitle = async (convId: string, messages: Message[]) => {
    if (messages.length > 6) return;
    try {
      const apiKey = process.env.API_KEY || '';
      const client = new GoogleGenAI({ apiKey });
      const historyText = messages.slice(0, 4).map(m => `${m.role}: ${m.text}`).join('\n');
      const prompt = `Generate a very short, catchy title (max 4 words) for this conversation based on this start: \n\n${historyText}\n\nReturn ONLY the title text.`;

      const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      const title = response.text?.trim()?.replace(/^["']|["']$/g, '');
      if (title) {
        updateConversation(convId, c => ({ ...c, title }));
      }
    } catch (e) {
      console.error("Auto-title failed", e);
    }
  };

  // --- Message Handling ---
  const handleSendMessage = async (text: string) => {
    if (!activeId) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: MessageRole.USER, 
      text, 
      timestamp: Date.now() 
    };
    
    // Update local UI immediately
    updateConversation(activeId, c => ({
      ...c,
      messages: [...c.messages, userMsg],
      lastModified: Date.now(),
      title: c.title === 'New Conversation' ? text.slice(0, 30) : c.title
    }));
    
    setIsGenerating(true);

    try {
      const apiKey = process.env.API_KEY || '';
      const client = new GoogleGenAI({ apiKey });
      
      const history = (activeConversation?.messages || []).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const chat = client.chats.create({ 
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: toolsDef }]
        },
        history: history
      });

      let response = await chat.sendMessage({ message: text });
      let responseText = "";

      // Handle function calls if model wants to use tools
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        const result = await executeTool(call.name, call.args, {
            setBackground: setBgColor,
            searchHistory: (q) => {
                 const hits = conversationsRef.current
                    .flatMap(c => c.messages)
                    .filter(m => m.text.toLowerCase().includes(q.toLowerCase()))
                    .map(m => m.text.slice(0, 60));
                 return hits.slice(0, 5).join("\n") || "No history matches.";
            }
        });

        response = await chat.sendMessage({
          message: [{ functionResponse: { name: call.name, response: { result } } }]
        });
      }
      
      responseText = response.text || "I'm sorry, I couldn't process that.";

      const modelMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: MessageRole.MODEL, 
        text: responseText, 
        timestamp: Date.now() 
      };
      
      updateConversation(activeId, c => ({
        ...c,
        messages: [...c.messages, modelMsg],
        lastModified: Date.now()
      }));

      // Auto-title if this is the start of the chat
      const currentConv = conversationsRef.current.find(c => c.id === activeId);
      if (currentConv && (currentConv.title === 'New Conversation' || currentConv.messages.length <= 4)) {
          generateTitle(activeId, [...currentConv.messages, modelMsg]);
      }

    } catch (err) {
      console.error(err);
      updateConversation(activeId, c => ({ 
        ...c, 
        messages: [...c.messages, { 
          id: Date.now().toString(), 
          role: MessageRole.SYSTEM, 
          text: "Lost connection to Gemini. Please check your network.", 
          timestamp: Date.now() 
        }] 
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Voice Mode Management ---
  const startVoiceSession = useCallback(async () => {
    if (!activeId) return;
    setMode(AppMode.VOICE);
    
    const apiKey = process.env.API_KEY || '';
    const currentConv = conversationsRef.current.find(c => c.id === activeId);
    const historySnippet = currentConv?.messages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n') || '';

    liveManagerRef.current = new LiveManager({
      apiKey,
      systemInstruction: `${SYSTEM_INSTRUCTION}\nRecent history:\n${historySnippet}`,
      onAudioData: setVoiceVolume,
      onTranscript: (text, isUser, isFinal) => {
          const role = isUser ? MessageRole.USER : MessageRole.MODEL;
          if (!isFinal) {
             setStreamingContent({ text, role });
          } else {
             setStreamingContent(null);
             if (text.trim()) {
                const newMsg: Message = { id: Date.now().toString(), role, text, timestamp: Date.now() };
                setConversations(prev => prev.map(c => {
                    if (c.id === activeId) {
                        return { ...c, messages: [...c.messages, newMsg], lastModified: Date.now() };
                    }
                    return c;
                }));
             }
          }
      },
      onToolCall: (name) => {
          setActiveTool(name);
          setTimeout(() => setActiveTool(undefined), 3000);
      },
      toolContext: {
        setBackground: setBgColor,
        searchHistory: (q) => {
            const hits = conversationsRef.current.flatMap(c => c.messages)
              .filter(m => m.text.toLowerCase().includes(q.toLowerCase()))
              .map(m => m.text.slice(0, 50));
            return hits.join(", ") || "No matches.";
        }
      }
    });

    try {
      await liveManagerRef.current.connect();
    } catch (e) {
      setMode(AppMode.TEXT);
    }
  }, [activeId]);

  const endVoiceSession = () => {
    liveManagerRef.current?.stop();
    liveManagerRef.current = null;
    setMode(AppMode.TEXT);
    setVoiceVolume(0);
    setStreamingContent(null);
  };

  // --- Render ---
  return (
    <div className="flex h-screen overflow-hidden font-sans transition-colors duration-700 select-none" style={{ backgroundColor: bgColor }}>
      
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => { setActiveId(id); setMode(AppMode.TEXT); if(window.innerWidth < 768) setSidebarOpen(false); }}
        onNew={createNewConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        {/* Navigation / Mode Switcher */}
        <header className="flex items-center justify-center p-4 bg-transparent absolute top-0 left-0 right-0 z-30 pointer-events-none">
           <div className="flex gap-1 bg-gray-900/40 backdrop-blur-2xl p-1 rounded-2xl border border-white/5 pointer-events-auto shadow-2xl">
             <button
               onClick={() => { if (mode === AppMode.VOICE) endVoiceSession(); else setMode(AppMode.TEXT); }}
               className={`px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 ${mode === AppMode.TEXT ? 'bg-white text-gray-950 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
             >
               Chat
             </button>
             <button
               onClick={() => { if (mode === AppMode.TEXT) startVoiceSession(); }}
               className={`px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 ${mode === AppMode.VOICE ? 'bg-accent-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
             >
               Live
             </button>
           </div>
        </header>

        <section className="flex-1 h-full relative overflow-hidden">
          <ChatInterface 
             messages={activeConversation?.messages || []} 
             isLoading={isGenerating} 
             onSend={handleSendMessage}
             streamingMessage={streamingContent}
          />
          
          {/* Voice Interface Overlay */}
          {mode === AppMode.VOICE && (
             <div className="absolute inset-x-0 bottom-0 z-40 animate-in slide-in-from-bottom duration-500">
                <VoiceInterface 
                  isActive={!!liveManagerRef.current}
                  volume={voiceVolume}
                  onDisconnect={endVoiceSession}
                  activeTool={activeTool}
                />
             </div>
          )}
        </section>
      </main>
    </div>
  );
}