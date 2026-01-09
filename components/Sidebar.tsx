import React from 'react';
import { Conversation, AppView } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  currentView: AppView;
  onSelectConversation: (id: string) => void;
  onChangeView: (view: AppView) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  conversations, 
  activeId, 
  currentView,
  onSelectConversation, 
  onChangeView,
  onNew, 
  onDelete, 
  isOpen, 
  onToggle 
}) => {
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDelete(id);
    }
  };

  // Filter out empty conversations for the display list
  const displayConversations = conversations.filter(c => c.messages.length > 0);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={onToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-md text-white shadow-lg"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        flex flex-col
      `}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-accent-500 tracking-tight">Gemini Omni</h1>
            <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">v1.1</span>
          </div>

          {/* View Switcher */}
          <div className="mb-6 space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Workspace</h3>
            <button
              onClick={() => onChangeView(AppView.CHAT)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-sm font-medium ${
                currentView === AppView.CHAT 
                  ? 'bg-gray-800 text-white shadow-inner' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <span>💬</span> Chat
            </button>
            <button
              onClick={() => onChangeView(AppView.EMAIL)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-sm font-medium ${
                currentView === AppView.EMAIL
                  ? 'bg-gray-800 text-white shadow-inner' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <span>📧</span> Inbox
            </button>
            <button
              onClick={() => onChangeView(AppView.CALENDAR)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-sm font-medium ${
                currentView === AppView.CALENDAR
                  ? 'bg-gray-800 text-white shadow-inner' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <span>📅</span> Calendar
            </button>
            <button
              onClick={() => onChangeView(AppView.GITHUB)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-sm font-medium ${
                currentView === AppView.GITHUB
                  ? 'bg-gray-800 text-white shadow-inner' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> 
              GitHub
            </button>
          </div>

          {currentView === AppView.CHAT && (
            <button
              onClick={onNew}
              className="w-full flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-500 text-white p-3 rounded-lg mb-4 transition-colors shadow-lg shadow-accent-600/20 font-medium text-sm"
            >
              <span>+</span> New Conversation
            </button>
          )}

          <div className="flex-1 overflow-y-auto space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              {currentView === AppView.CHAT ? "Recent Chats" : currentView === AppView.GITHUB ? "Repositories" : currentView === AppView.EMAIL ? "Mailboxes" : "Events Overview"}
            </h3>
            
            {currentView === AppView.CHAT ? (
              <>
                {displayConversations.length === 0 && (
                  <div className="text-sm text-gray-600 italic px-2">No history yet.</div>
                )}
                {displayConversations.slice().reverse().map(conv => (
                  <div 
                    key={conv.id}
                    className={`group flex items-center w-full rounded-lg transition-all duration-200 ${
                      activeId === conv.id 
                        ? 'bg-gray-800 border-l-2 border-accent-500' 
                        : 'hover:bg-gray-900'
                    }`}
                  >
                    <button
                      onClick={() => onSelectConversation(conv.id)}
                      className={`flex-1 text-left p-3 text-sm truncate ${
                        activeId === conv.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
                      }`}
                    >
                      {conv.title || 'Untitled Conversation'}
                    </button>
                    
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="p-2 mr-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      title="Delete conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            ) : currentView === AppView.GITHUB ? (
               <div className="px-2 space-y-2">
                 <div className="text-sm text-gray-400 hover:text-white cursor-pointer transition-colors">frontend-monorepo</div>
                 <div className="text-sm text-gray-400 hover:text-white cursor-pointer transition-colors">api-gateway</div>
                 <div className="text-sm text-gray-400 hover:text-white cursor-pointer transition-colors">docs-site</div>
               </div>
            ) : currentView === AppView.EMAIL ? (
                <div className="px-2 space-y-2">
                   <div className="text-sm text-white font-medium bg-gray-800/50 p-2 rounded cursor-pointer">Inbox</div>
                   <div className="text-sm text-gray-400 hover:text-white p-2 rounded cursor-pointer">Sent</div>
                   <div className="text-sm text-gray-400 hover:text-white p-2 rounded cursor-pointer">Drafts</div>
                   <div className="text-sm text-gray-400 hover:text-white p-2 rounded cursor-pointer">Spam</div>
                </div>
            ) : (
                <div className="px-2 text-sm text-gray-500">
                    <p>Switch to Day/Week view capabilities coming soon.</p>
                </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-600">
            <p>Powered by Gemini Live API</p>
          </div>
        </div>
      </div>
    </>
  );
};