import React from 'react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ conversations, activeId, onSelect, onNew, onDelete, isOpen, onToggle }) => {
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDelete(id);
    }
  };

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
      `}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-accent-500 tracking-tight">Gemini Omni</h1>
            <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">v1.0</span>
          </div>

          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-500 text-white p-3 rounded-lg mb-6 transition-colors shadow-lg shadow-accent-600/20 font-medium"
          >
            <span>+</span> New Conversation
          </button>

          <div className="flex-1 overflow-y-auto space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">History</h3>
            {conversations.length === 0 && (
              <div className="text-sm text-gray-600 italic px-2">No history yet.</div>
            )}
            {conversations.slice().reverse().map(conv => (
              <div 
                key={conv.id}
                className={`group flex items-center w-full rounded-lg transition-all duration-200 ${
                  activeId === conv.id 
                    ? 'bg-gray-800 border-l-2 border-accent-500' 
                    : 'hover:bg-gray-900'
                }`}
              >
                <button
                  onClick={() => onSelect(conv.id)}
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
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-600">
            <p>Powered by Gemini Live API</p>
          </div>
        </div>
      </div>
    </>
  );
};