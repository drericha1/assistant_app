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