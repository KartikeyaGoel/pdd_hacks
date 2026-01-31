'use client';

import { create } from 'zustand';
import type { Conversation, Document } from './types';

/**
 * Message in the conversation transcript
 */
export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Upload progress state
 */
export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

/**
 * Main application state interface
 */
export interface AppState {
  // ============= Conversation State =============
  isConversationActive: boolean;
  isMuted: boolean;
  isAgentSpeaking: boolean;
  isConnecting: boolean;
  currentConversationId: string | null;
  transcript: TranscriptMessage[];
  
  // WebSocket
  ws: WebSocket | null;
  sessionId: string | null;

  // ============= Conversation Actions =============
  connect: (websocketUrl: string, conversationId: string, sessionId: string) => void;
  disconnect: () => void;
  toggleMute: () => void;
  setAgentSpeaking: (speaking: boolean) => void;
  addMessage: (message: Omit<TranscriptMessage, 'id' | 'timestamp'>) => void;
  clearTranscript: () => void;
  setConnecting: (connecting: boolean) => void;

  // ============= Upload State =============
  uploadProgress: UploadProgress | null;
  documents: Document[];
  
  // ============= Upload Actions =============
  setUploadProgress: (progress: UploadProgress | null) => void;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  removeDocument: (documentId: string) => void;

  // ============= History State =============
  conversations: Conversation[];
  isLoadingConversations: boolean;
  
  // ============= History Actions =============
  setConversations: (conversations: Conversation[]) => void;
  setLoadingConversations: (loading: boolean) => void;
  removeConversation: (conversationId: string) => void;
}

/**
 * Generate unique ID for messages
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Zustand store for global application state
 */
export const useAppStore = create<AppState>((set, get) => ({
  // ============= Initial Conversation State =============
  isConversationActive: false,
  isMuted: false,
  isAgentSpeaking: false,
  isConnecting: false,
  currentConversationId: null,
  transcript: [],
  ws: null,
  sessionId: null,

  // ============= Conversation Actions =============
  connect: (websocketUrl: string, conversationId: string, sessionId: string) => {
    const { ws: existingWs } = get();
    
    // Close existing connection
    if (existingWs) {
      existingWs.close();
    }

    const ws = new WebSocket(websocketUrl);

    ws.onopen = () => {
      set({
        isConversationActive: true,
        isConnecting: false,
        currentConversationId: conversationId,
        sessionId,
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types from ElevenLabs
        if (data.type === 'audio') {
          set({ isAgentSpeaking: true });
        } else if (data.type === 'audio_end') {
          set({ isAgentSpeaking: false });
        } else if (data.type === 'transcript') {
          const { addMessage } = get();
          addMessage({
            role: data.role || 'assistant',
            content: data.text || data.content,
          });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      set({ isConnecting: false });
    };

    ws.onclose = () => {
      set({
        isConversationActive: false,
        isAgentSpeaking: false,
        ws: null,
        sessionId: null,
      });
    };

    set({ ws, isConnecting: true });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
    }
    set({
      isConversationActive: false,
      isAgentSpeaking: false,
      ws: null,
      sessionId: null,
      currentConversationId: null,
    });
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  setAgentSpeaking: (speaking: boolean) => {
    set({ isAgentSpeaking: speaking });
  },

  addMessage: (message) => {
    set((state) => ({
      transcript: [
        ...state.transcript,
        {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        },
      ],
    }));
  },

  clearTranscript: () => {
    set({ transcript: [] });
  },

  setConnecting: (connecting: boolean) => {
    set({ isConnecting: connecting });
  },

  // ============= Initial Upload State =============
  uploadProgress: null,
  documents: [],

  // ============= Upload Actions =============
  setUploadProgress: (progress) => {
    set({ uploadProgress: progress });
  },

  setDocuments: (documents) => {
    set({ documents });
  },

  addDocument: (document) => {
    set((state) => ({
      documents: [...state.documents, document],
    }));
  },

  removeDocument: (documentId) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== documentId),
    }));
  },

  // ============= Initial History State =============
  conversations: [],
  isLoadingConversations: false,

  // ============= History Actions =============
  setConversations: (conversations) => {
    set({ conversations });
  },

  setLoadingConversations: (loading) => {
    set({ isLoadingConversations: loading });
  },

  removeConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
    }));
  },
}));

export default useAppStore;
