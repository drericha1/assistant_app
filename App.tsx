import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { VoiceInterface } from './components/VoiceInterface';
import { CalendarView } from './components/CalendarView';
import { GithubView } from './components/GithubView';
import { EmailView } from './components/EmailView';
import { Conversation, Message, MessageRole, AppMode, AppView, CalendarEvent, GithubItem, Email } from './types';
import { LiveManager } from './services/liveManager';
import { GoogleGenAI } from "@google/genai";
import { toolsDef, executeTool } from './services/tools';

const getSystemInstruction = () => {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `You are a helpful AI assistant. Today is ${date} and the time is ${time}. You have access to tools to check time, search history, manage my calendar, and check my Gmail. Be concise and conversational.`;
};

export default function App() {
  // --- Core State ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // View State
  const [mode, setMode] = useState<AppMode>(AppMode.TEXT); // Input mode (Text vs Live Voice)
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT); // Workspace View (Chat vs Calendar)
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // --- Feature State (Mock DB) ---
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const today = new Date();
    const getRelativeDate = (days: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() + days);
        return d.toISOString().split('T')[0];
    };
    
    return [
        { id: '1', title: 'Weekly Team Sync', date: getRelativeDate(0), time: '10:00' },
        { id: '2', title: 'Lunch with Sarah', date: getRelativeDate(0), time: '12:30' },
        { id: '3', title: 'Project Review', date: getRelativeDate(1), time: '14:00' },
        { id: '4', title: 'Dentist Appointment', date: getRelativeDate(3), time: '09:00' },
        { id: '5', title: 'Gym Session', date: getRelativeDate(3), time: '17:30' },
        { id: '6', title: 'Client Presentation', date: getRelativeDate(5), time: '11:00' },
        { id: '7', title: 'Code Review', date: getRelativeDate(-2), time: '15:00' }, 
        { id: '8', title: 'Birthday Dinner', date: getRelativeDate(7), time: '19:00' },
        { id: '9', title: 'Q3 Planning', date: getRelativeDate(12), time: '09:00' },
        { id: '10', title: 'Deep Work', date: getRelativeDate(1), time: '09:00' },
        { id: '11', title: 'Design Sync', date: getRelativeDate(5), time: '14:00' }
    ];
  });

  const [emails, setEmails] = useState<Email[]>([
    { id: '1', from: 'manager@work.com', subject: 'Project Update', snippet: 'Can you please update the slide deck by EOD?', isRead: false },
    { id: '2', from: 'support@aws.com', subject: 'Invoice Available', snippet: 'Your invoice for last month is ready for review.', isRead: true },
    { id: '3', from: 'alice@friends.com', subject: 'Dinner tonight?', snippet: 'Hey, are we still on for sushi at 7?', isRead: false }
  ]);

  const [githubItems] = useState<GithubItem[]>([
    { 
      id: 'pr-1', type: 'PR', repo: 'frontend-monorepo', number: 432, 
      title: 'feat: add infinite scroll to chat list', 
      author: 'jdoe', status: 'OPEN', labels: ['feature', 'ui'], 
      createdAt: '2h ago',
      description: 'Implements intersection observer for lazy loading messages. Includes virtual scrolling optimization.',
      content: `diff --git a/src/components/ChatList.tsx b/src/components/ChatList.tsx
index 83a92b..29b41a 100644
--- a/src/components/ChatList.tsx
+++ b/src/components/ChatList.tsx
@@ -12,6 +12,18 @@ export const ChatList = ({ messages }) => {
+  const observer = useRef();
+  const lastMessageRef = useCallback(node => {
+    if (loading) return;
+    if (observer.current) observer.current.disconnect();
+    observer.current = new IntersectionObserver(entries => {
+      if (entries[0].isIntersecting && hasMore) {
+        setPage(prev => prev + 1);
+      }
+    });
+    if (node) observer.current.observe(node);
+  }, [loading, hasMore]);
+
   return (
     <div className="flex flex-col">
       {messages.map((msg, index) => {
+        if (messages.length === index + 1) {
+          return <div ref={lastMessageRef} key={msg.id}>{msg.text}</div>
+        }
         return <div key={msg.id}>{msg.text}</div>
       })}
     </div>`
    },
    { 
      id: 'issue-1', type: 'ISSUE', repo: 'api-gateway', number: 156, 
      title: 'bug: 500 error on /auth/login when rate limited', 
      author: 'sre-team', status: 'OPEN', labels: ['bug', 'high-priority'], 
      createdAt: '1d ago',
      description: 'The rate limiter middleware throws an unhandled exception instead of returning 429. Stack trace indicates line 45 in RateLimiter.ts.',
      content: `Error: Rate limit exceeded
    at RateLimiter.check (/app/src/middleware/RateLimiter.ts:45:15)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:114:3)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)

File: src/middleware/RateLimiter.ts
40:   async check(req: Request, res: Response, next: NextFunction) {
41:     const ip = req.ip;
42:     const count = await redis.incr(ip);
43:     
44:     if (count > this.limit) {
45:       throw new Error("Rate limit exceeded"); // This crashes the app instead of sending 429!
46:     }
47:     
48:     next();
49:   }`
    },
    { 
      id: 'pr-2', type: 'PR', repo: 'docs-site', number: 89, 
      title: 'docs: update API reference for v2', 
      author: 'techwriter', status: 'DRAFT', labels: ['documentation'], 
      createdAt: '3d ago',
      description: 'Initial draft of v2 endpoints. Needs review from engineering on parameter definitions.',
      content: `## POST /v2/users/create

Creates a new user in the system.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email | string | Yes | The user's email address |
| password | string | Yes | Must be at least 8 chars |
| role | string | No | Defaults to 'admin' |  <-- WAIT, default should be 'user' for security!

### Response

\`\`\`json
{
  "id": "user_123",
  "token": "eyJhbGci..." // Is this returning a JWT directly? We switched to HttpOnly cookies.
}
\`\`\``
    },
    { 
      id: 'issue-2', type: 'ISSUE', repo: 'frontend-monorepo', number: 429, 
      title: 'task: migrate sidebar to new design system', 
      author: 'design-lead', status: 'OPEN', labels: ['refactor'], 
      createdAt: '5d ago',
      description: 'The current sidebar uses legacy Tailwind classes. Needs to be updated to use the new "Accent" design tokens.',
      content: `Current Implementation (Legacy):
<div className="bg-gray-800 text-white w-64 h-full border-r border-gray-700">
  <button className="bg-blue-600 hover:bg-blue-700 text-white rounded p-2">
    New Chat
  </button>
</div>

Required Implementation (New Token System):
- Background: 'surface-primary' (or bg-gray-950)
- Border: 'border-subtle' (or border-gray-800)
- Primary Button: 'action-primary' (bg-accent-600)
- Text: 'text-primary' (text-gray-100)

Please convert the legacy classes to the new system ensuring dark mode compatibility.`
    }
  ]);
  
  // --- UI/Interaction State ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [activeTool, setActiveTool] = useState<string | undefined>(undefined);
  const [streamingContent, setStreamingContent] = useState<{ text: string; role: MessageRole } | null>(null);
  
  // --- Refs ---
  const liveManagerRef = useRef<LiveManager | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const calendarRef = useRef<CalendarEvent[]>([]);
  const emailsRef = useRef<Email[]>([]);

  // Sync refs for tool execution context
  useEffect(() => {
    conversationsRef.current = conversations;
    calendarRef.current = calendarEvents;
    emailsRef.current = emails;

    // Storage logic for conversations
    if (conversations.length > 0) {
      const validConvs = conversations.filter(c => c.messages.length > 0);
      if (validConvs.length > 0) {
        localStorage.setItem('gemini_conversations', JSON.stringify(validConvs));
      } else {
        localStorage.removeItem('gemini_conversations');
      }
    } else {
       localStorage.removeItem('gemini_conversations');
    }
  }, [conversations, calendarEvents, emails]);

  // --- Initial Load ---
  useEffect(() => {
    const saved = localStorage.getItem('gemini_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter((c: Conversation) => c.messages.length > 0);
            if (valid.length > 0) {
                setConversations(valid);
                setActiveId(valid[valid.length - 1].id);
            } else {
                createFirstConversation();
            }
        } else {
            createFirstConversation();
        }
      } catch (e) {
        createFirstConversation();
      }
    } else {
      createFirstConversation();
    }
  }, []);

  const activeConversation = conversations.find(c => c.id === activeId);

  // --- Actions ---
  const createFirstConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    setConversations([newConv]);
    setActiveId(newConv.id);
  };

  const createNewConversation = () => {
    // If starting a new chat, force view to CHAT
    if (currentView !== AppView.CHAT) {
        setCurrentView(AppView.CHAT);
    }

    const current = conversations.find(c => c.id === activeId);
    if (current && current.messages.length === 0) {
        setMode(AppMode.TEXT);
        if (window.innerWidth < 768) setSidebarOpen(false);
        return;
    }

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

  const deleteConversation = (id: string) => {
    const newConvs = conversations.filter(c => c.id !== id);
    if (newConvs.length === 0) {
        localStorage.removeItem('gemini_conversations');
        createFirstConversation();
        setMode(AppMode.TEXT);
    } else {
        setConversations(newConvs);
        if (activeId === id) {
            setActiveId(newConvs[newConvs.length - 1].id);
            setMode(AppMode.TEXT);
        }
    }
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

  // --- Tool Context Logic ---
  const getToolContext = () => ({
    searchHistory: (q: string) => {
        const hits = conversationsRef.current
            .flatMap(c => c.messages)
            .filter(m => m.text.toLowerCase().includes(q.toLowerCase()))
            .map(m => m.text.slice(0, 60));
        return hits.slice(0, 5).join("\n") || "No history matches.";
    },
    calendar: {
      listEvents: (date?: string) => {
        const targetDate = date || new Date().toISOString().split('T')[0];
        return calendarRef.current.filter(e => e.date === targetDate);
      },
      addEvent: (title: string, date: string, time: string) => {
        const newEvent = { id: Date.now().toString(), title, date, time };
        // Optimistically update ref to ensure subsequent tool calls in the same turn see the new event
        calendarRef.current = [...calendarRef.current, newEvent];
        setCalendarEvents(prev => [...prev, newEvent]);
        return `Event '${title}' scheduled for ${date} at ${time}.`;
      }
    },
    email: {
      listEmails: (query?: string) => {
        if (!query) return emailsRef.current;
        const lowerQ = query.toLowerCase();
        return emailsRef.current.filter(e => 
          e.from.toLowerCase().includes(lowerQ) || 
          e.subject.toLowerCase().includes(lowerQ) ||
          e.snippet.toLowerCase().includes(lowerQ)
        );
      },
      sendEmail: (to: string, subject: string, body: string) => {
        console.log(`Sending email to ${to}: ${subject}`);
        return `Email sent to ${to} successfully.`;
      }
    }
  });

  // --- Message Handling ---
  const handleSendMessage = async (text: string, isImageGen?: boolean) => {
    if (!activeId) return;

    // Ensure we are looking at the chat
    if (currentView !== AppView.CHAT) setCurrentView(AppView.CHAT);

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: MessageRole.USER, 
      text, 
      timestamp: Date.now() 
    };
    
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
      
      let responseText = "";
      let attachment: Message['attachment'] | undefined;

      if (isImageGen) {
        // --- Image Generation Logic ---
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: text }] },
          config: { imageConfig: { aspectRatio: "1:1" } }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
           for (const part of parts) {
              if (part.inlineData) {
                  attachment = {
                      type: 'image',
                      data: part.inlineData.data,
                      mimeType: part.inlineData.mimeType
                  };
              } else if (part.text) {
                  responseText += part.text;
              }
           }
        }
        
        if (!attachment && !responseText) {
            responseText = "I couldn't generate an image. The request might have been blocked.";
        }

      } else {
        // --- Standard Text Chat Logic ---
        const history = (activeConversation?.messages || [])
            .filter(m => m.text.trim() !== '') 
            .map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

        const chat = client.chats.create({ 
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: getSystemInstruction(),
                tools: [{ functionDeclarations: toolsDef }]
            },
            history: history
        });

        let response = await chat.sendMessage({ message: text });
        
        // Handle potential tool call loop
        // If the model calls a tool, we execute it and send the response back.
        // We loop until the model returns plain text (no function calls).
        while (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            const result = await executeTool(call.name, call.args, getToolContext());

            // Send tool result back to the model
            response = await chat.sendMessage({
                message: [{ functionResponse: { name: call.name, response: { result } } }]
            });
        }
        
        responseText = response.text || "I'm sorry, I couldn't process that.";
      }

      const modelMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: MessageRole.MODEL, 
        text: responseText, 
        timestamp: Date.now(),
        attachment: attachment
      };
      
      updateConversation(activeId, c => ({
        ...c,
        messages: [...c.messages, modelMsg],
        lastModified: Date.now()
      }));

      // Auto-title
      const currentConv = conversationsRef.current.find(c => c.id === activeId);
      if (currentConv && (currentConv.title === 'New Conversation' || currentConv.messages.length <= 4)) {
          if (isImageGen) {
             const cleanTitle = text.length > 25 ? text.substring(0, 25) + '...' : text;
             updateConversation(activeId, c => ({ ...c, title: `Img: ${cleanTitle}` }));
          } else {
             generateTitle(activeId, [...currentConv.messages, modelMsg]);
          }
      }

    } catch (err) {
      console.error(err);
      updateConversation(activeId, c => ({ 
        ...c, 
        messages: [...c.messages, { 
          id: Date.now().toString(), 
          role: MessageRole.SYSTEM, 
          text: `Error: ${err instanceof Error ? err.message : "Connection failed"}.`, 
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
      systemInstruction: `${getSystemInstruction()}\nRecent history:\n${historySnippet}`,
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
      toolContext: getToolContext()
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

  const handleAnalyzeGithubItem = (item: GithubItem) => {
    // 1. Switch to chat
    setCurrentView(AppView.CHAT);
    
    // 2. Construct prompt with detailed content if available
    let prompt = "";
    if (item.type === 'PR') {
        prompt = `Analyze this Pull Request: ${item.title} (Repo: ${item.repo} #${item.number}). \n\nDescription: "${item.description}"\n\n`;
        if (item.content) {
            prompt += `Diff/Code Context:\n\`\`\`\n${item.content}\n\`\`\`\n\n`;
        }
        prompt += `Please summarize the changes, suggest potential edge cases to test, and draft a constructive review comment.`;
    } else {
        prompt = `Analyze this Issue: ${item.title} (Repo: ${item.repo} #${item.number}). \n\nDescription: "${item.description}"\n\n`;
        if (item.content) {
            prompt += `Error Logs/Context:\n\`\`\`\n${item.content}\n\`\`\`\n\n`;
        }
        prompt += `Please analyze the root cause based on the provided context and suggest a step-by-step fix or debugging strategy.`;
    }

    // 3. Send message
    handleSendMessage(prompt);
  };

  const handleComposeEmail = () => {
    setCurrentView(AppView.CHAT);
    handleSendMessage("I need to send an email. Who should I write to?", false);
  };

  const handleReplyEmail = (email: Email) => {
    setCurrentView(AppView.CHAT);
    const prompt = `I need to reply to this email from ${email.from}.\n\nSubject: ${email.subject}\nContent: "${email.snippet}"\n\nPlease help me draft a professional response.`;
    handleSendMessage(prompt, false);
  };

  // --- Render ---
  return (
    <div className="flex h-screen overflow-hidden font-sans bg-gray-950 text-gray-100 select-none">
      
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        currentView={currentView}
        onSelectConversation={(id) => { 
            setActiveId(id); 
            setCurrentView(AppView.CHAT); 
            setMode(AppMode.TEXT); 
            if(window.innerWidth < 768) setSidebarOpen(false); 
        }}
        onChangeView={(view) => {
            setCurrentView(view);
            if(window.innerWidth < 768) setSidebarOpen(false);
        }}
        onNew={createNewConversation}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        {/* Navigation / Mode Switcher (Visual Layer) */}
        <header className="flex items-center justify-center p-4 bg-transparent absolute top-0 left-0 right-0 z-30 pointer-events-none">
           <div className="flex gap-1 bg-gray-900/40 backdrop-blur-2xl p-1 rounded-2xl border border-white/5 pointer-events-auto shadow-2xl">
             <button
               onClick={() => { if (mode === AppMode.VOICE) endVoiceSession(); else setMode(AppMode.TEXT); }}
               className={`px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 ${mode === AppMode.TEXT ? 'bg-white text-gray-950 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
             >
               Type
             </button>
             <button
               onClick={() => { if (mode === AppMode.TEXT) startVoiceSession(); }}
               className={`px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 ${mode === AppMode.VOICE ? 'bg-accent-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
             >
               Voice
             </button>
           </div>
        </header>

        <section className="flex-1 h-full relative overflow-hidden">
          {currentView === AppView.CHAT ? (
            <ChatInterface 
               messages={activeConversation?.messages || []} 
               isLoading={isGenerating} 
               onSend={handleSendMessage}
               streamingMessage={streamingContent}
            />
          ) : currentView === AppView.GITHUB ? (
            <div className="h-full pt-20">
               <GithubView items={githubItems} onAnalyze={handleAnalyzeGithubItem} />
            </div>
          ) : currentView === AppView.EMAIL ? (
             <div className="h-full pt-20">
               <EmailView emails={emails} onCompose={handleComposeEmail} onReply={handleReplyEmail} />
             </div>
          ) : (
            <div className="h-full pt-20">
              <CalendarView events={calendarEvents} />
            </div>
          )}
          
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