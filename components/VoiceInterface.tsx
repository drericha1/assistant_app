import React from 'react';

interface VoiceInterfaceProps {
  isActive: boolean;
  volume: number; // 0 to 1
  onDisconnect: () => void;
  activeTool?: string;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ isActive, volume, onDisconnect, activeTool }) => {
  // Use a damped scale calculation. 
  // CSS transitions will handle the actual smoothing between low-frequency updates.
  const scale = 1 + Math.min(volume * 2.5, 1.8);
  const glowScale = scale * 1.4;

  return (
    <div className="flex flex-row items-center justify-between px-6 py-4 h-full relative overflow-hidden bg-gray-950/90 backdrop-blur-xl border-t border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      
      {/* Active Tool Indicator (Corner) */}
      {activeTool && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-gray-800 border border-gray-700 px-3 py-1 rounded-full flex items-center gap-2 text-xs text-accent-400 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Tool: <span className="font-mono font-bold">{activeTool}</span>
          </div>
        </div>
      )}

      {/* Visualizer (Left) */}
      <div className="flex items-center gap-6">
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Animated background glow */}
          <div 
            className="absolute inset-0 bg-accent-500/30 rounded-full blur-2xl will-change-transform transition-transform duration-300 ease-out"
            style={{ transform: `scale(${glowScale})` }}
          />
          
          {/* Main pulsing circle */}
          <div 
            className="w-12 h-12 bg-gradient-to-br from-accent-400 via-accent-500 to-indigo-600 rounded-full shadow-lg flex items-center justify-center relative will-change-transform transition-transform duration-300 ease-out"
            style={{ transform: `scale(${scale})` }}
          >
            <div className="w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center">
                {/* Center dot */}
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                {isActive ? "Gemini Live" : "Connecting..."}
                {isActive && <span className="flex gap-0.5 items-end h-3">
                    <span className="w-1 bg-accent-400 rounded-full animate-wave" style={{ animationDelay: '0s', height: '40%' }} />
                    <span className="w-1 bg-accent-400 rounded-full animate-wave" style={{ animationDelay: '0.1s', height: '80%' }} />
                    <span className="w-1 bg-accent-400 rounded-full animate-wave" style={{ animationDelay: '0.2s', height: '60%' }} />
                </span>}
            </h2>
            <p className="text-xs text-accent-400/80 font-medium">
                {isActive ? "Listening for your voice..." : "Preparing your audio session..."}
            </p>
        </div>
      </div>

      {/* Controls (Right) */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status</span>
            <span className="text-xs text-green-400 font-medium">Active Session</span>
        </div>
        <button
            onClick={onDisconnect}
            className="group p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-full transition-all duration-300 shadow-lg shadow-red-500/5 hover:shadow-red-500/20"
            title="End Voice Session"
        >
            <svg className="w-6 h-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
      </div>
    </div>
  );
};