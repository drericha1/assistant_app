import React from 'react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ conversations, activeId, onSelect, onNew, isOpen, onToggle }) => {
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
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 truncate ${
                  activeId === conv.id 
                    ? 'bg-gray-800 text-white border-l-2 border-accent-500' 
                    : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                }`}
              >
                {conv.title || 'Untitled Conversation'}
              </button>
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