import React from 'react';
import { Email } from '../types';

interface EmailViewProps {
  emails: Email[];
  onCompose: () => void;
  onReply: (email: Email) => void;
}

export const EmailView: React.FC<EmailViewProps> = ({ emails, onCompose, onReply }) => {
  return (
    <div className="flex flex-col h-full bg-gray-950/20 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="text-2xl">📧</span> Inbox
          </h2>
          <p className="text-gray-400 text-sm mt-1">{emails.filter(e => !e.isRead).length} unread messages</p>
        </div>
        <button
          onClick={onCompose}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white shadow-lg transition-all text-sm font-bold active:scale-95"
        >
          <span>✏️</span> Compose
        </button>
      </div>

      <div className="space-y-3">
        {emails.map(email => (
          <div key={email.id} className={`p-4 rounded-xl border transition-all duration-200 group relative ${email.isRead ? 'bg-gray-900/30 border-gray-800' : 'bg-gray-900/80 border-gray-700 shadow-md'}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-inner ${email.isRead ? 'bg-gray-800 text-gray-500' : 'bg-gradient-to-br from-accent-500 to-indigo-600 text-white'}`}>
                  {email.from.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className={`text-sm ${email.isRead ? 'font-medium text-gray-300' : 'font-bold text-white'}`}>{email.from}</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Today, 10:23 AM</p>
                </div>
              </div>
              {!email.isRead && <div className="w-2.5 h-2.5 rounded-full bg-accent-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
            </div>
            
            <div className="ml-12">
              <h4 className={`text-sm mb-1.5 ${email.isRead ? 'text-gray-400' : 'text-gray-100 font-semibold'}`}>{email.subject}</h4>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{email.snippet}</p>
              
              <div className="mt-4 pt-3 border-t border-gray-800/50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onReply(email)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
                >
                  <span>↩️</span> Reply with AI
                </button>
              </div>
            </div>
          </div>
        ))}
        {emails.length === 0 && (
            <div className="text-center py-20 bg-gray-900/20 rounded-2xl border border-gray-800/50 border-dashed">
                <p className="text-gray-500">Inbox is empty.</p>
            </div>
        )}
      </div>
    </div>
  );
};