import React from 'react';
import { GithubItem } from '../types';

interface GithubViewProps {
  items: GithubItem[];
  onAnalyze: (item: GithubItem) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': return 'text-green-400 border-green-400/30 bg-green-400/10';
    case 'MERGED': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
    case 'CLOSED': return 'text-red-400 border-red-400/30 bg-red-400/10';
    case 'DRAFT': return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    default: return 'text-gray-400';
  }
};

interface CardProps {
  item: GithubItem;
  onAnalyze: (item: GithubItem) => void;
}

const Card: React.FC<CardProps> = ({ item, onAnalyze }) => (
  <div className="group p-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-accent-500/50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col gap-3">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wider ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
        <span className="text-xs text-gray-500 font-mono">{item.repo} #{item.number}</span>
      </div>
      <span className="text-xs text-gray-500">{item.createdAt}</span>
    </div>

    <div>
      <h3 className="text-sm font-bold text-gray-200 group-hover:text-accent-400 transition-colors line-clamp-2 leading-snug">
        {item.title}
      </h3>
      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
        {item.description}
      </p>
    </div>

    <div className="flex flex-wrap gap-2 mt-auto pt-2">
      {item.labels.map(label => (
        <span key={label} className="text-[10px] px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
          {label}
        </span>
      ))}
    </div>

    <div className="pt-3 mt-1 border-t border-gray-800 flex justify-between items-center">
      <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold">
            {item.author.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-500">{item.author}</span>
      </div>
      
      <button
        onClick={() => onAnalyze(item)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-600/10 hover:bg-accent-600 text-accent-400 hover:text-white border border-accent-600/30 transition-all text-xs font-medium"
      >
        <span className="text-lg leading-none">✨</span> Analyze
      </button>
    </div>
  </div>
);

export const GithubView: React.FC<GithubViewProps> = ({ items, onAnalyze }) => {
  const prs = items.filter(i => i.type === 'PR');
  const issues = items.filter(i => i.type === 'ISSUE');

  return (
    <div className="flex flex-col h-full bg-gray-950/20 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub Dashboard
          </h2>
          <p className="text-gray-400 text-sm mt-1">Smart Triage & Code Analysis</p>
        </div>
        <div className="flex gap-2">
            <span className="px-3 py-1 rounded bg-gray-900 border border-gray-800 text-xs text-gray-500">Connected as @engineer</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pull Requests Column */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Pull Requests
              <span className="px-2 py-0.5 rounded-full bg-gray-800 text-[10px] text-gray-400">{prs.length}</span>
            </h3>
          </div>
          <div className="space-y-3">
            {prs.map(item => <Card key={item.id} item={item} onAnalyze={onAnalyze} />)}
            {prs.length === 0 && <div className="text-gray-600 text-sm italic">No open PRs.</div>}
          </div>
        </section>

        {/* Issues Column */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Assigned Issues
              <span className="px-2 py-0.5 rounded-full bg-gray-800 text-[10px] text-gray-400">{issues.length}</span>
            </h3>
          </div>
          <div className="space-y-3">
            {issues.map(item => <Card key={item.id} item={item} onAnalyze={onAnalyze} />)}
            {issues.length === 0 && <div className="text-gray-600 text-sm italic">No assigned issues.</div>}
          </div>
        </section>
      </div>
    </div>
  );
};