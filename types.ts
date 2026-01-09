
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  attachment?: {
    type: 'image';
    data: string; // base64
    mimeType: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  lastModified: number;
}

export enum AppMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE'
}

export enum AppView {
  CHAT = 'CHAT',
  CALENDAR = 'CALENDAR',
  GITHUB = 'GITHUB',
  EMAIL = 'EMAIL'
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ToolResponse {
  id: string;
  name: string;
  result: Record<string, any>;
}

export interface VoiceSessionStatus {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  volume: number; // 0 to 1
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
}

export interface GithubItem {
  id: string;
  type: 'PR' | 'ISSUE';
  repo: string;
  number: number;
  title: string;
  author: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED' | 'DRAFT';
  labels: string[];
  description: string; 
  content?: string; // Detailed content (diffs, logs) for AI analysis
  createdAt: string;
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  isRead: boolean;
}
