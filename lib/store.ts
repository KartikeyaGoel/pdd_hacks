'use client';

import { create } from 'zustand';
import { Conversation } from '@11labs/client';
import type { Conversation as ConversationType, Document } from './types';

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
  
  // ElevenLabs Conversation instance
  conversation: Conversation | null;
  sessionId: string | null;
  sessionStartTime: Date | null;

  // ============= Conversation Actions =============
  connect: (websocketUrl: string, conversationId: string, sessionId: string) => Promise<void>;
  disconnect: () => Promise<void>;
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
  conversations: ConversationType[];
  isLoadingConversations: boolean;
  
  // ============= History Actions =============
  setConversations: (conversations: ConversationType[]) => void;
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
  conversation: null,
  sessionId: null,
  sessionStartTime: null,

  // ============= Conversation Actions =============
  connect: async (websocketUrl: string, conversationId: string, sessionId: string) => {
    const { conversation: existingConversation, addMessage } = get();
    
    // Close existing connection
    if (existingConversation) {
      await existingConversation.endSession();
    }

    set({ isConnecting: true });

    try {
      // Use the ElevenLabs SDK to start the session
      const conversation = await Conversation.startSession({
        signedUrl: websocketUrl,
        onConnect: () => {
          console.log('ElevenLabs conversation connected');
          set({
            isConversationActive: true,
            isConnecting: false,
            currentConversationId: conversationId,
            sessionId,
            sessionStartTime: new Date(),
          });
        },
        onDisconnect: () => {
          console.log('ElevenLabs conversation disconnected');
          set({
            isConversationActive: false,
            isAgentSpeaking: false,
            conversation: null,
            sessionId: null,
          });
        },
        onMessage: (message) => {
          // ElevenLabs SDK message format: { message: string; source: Role }
          // source is 'user' or 'ai'
          console.log('ElevenLabs message:', message);
          
          if (message.message && message.source) {
            const role = message.source === 'ai' ? 'assistant' : 'user';
            console.log('Adding message:', role, message.message);
            addMessage({
              role,
              content: message.message,
            });
          }
        },
        onModeChange: (mode) => {
          // mode.mode can be 'speaking' or 'listening'
          set({ isAgentSpeaking: mode.mode === 'speaking' });
        },
        onError: (error) => {
          console.error('ElevenLabs conversation error:', error);
          set({ isConnecting: false });
        },
      });

      set({ conversation });
    } catch (error) {
      console.error('Failed to start ElevenLabs conversation:', error);
      set({ isConnecting: false });
      throw error;
    }
  },

  disconnect: async () => {
    const { conversation, currentConversationId, transcript } = get();
    
    console.log('Disconnect called:', { currentConversationId, transcriptLength: transcript.length });
    
    // Save conversation metadata before disconnecting
    if (currentConversationId) {
      try {
        // Get title from first user message or first assistant message
        const firstUserMessage = transcript.find(m => m.role === 'user');
        const firstMessage = transcript[0];
        let title = 'Learning Session';
        
        if (firstUserMessage) {
          title = firstUserMessage.content.substring(0, 50);
          if (firstUserMessage.content.length > 50) {
            title += '...';
          }
        } else if (firstMessage) {
          // Use first assistant message if no user message
          title = firstMessage.content.substring(0, 50);
          if (firstMessage.content.length > 50) {
            title += '...';
          }
        }

        console.log('Saving conversation with title:', title);

        // Save to API
        const response = await fetch(`/api/conversations/${currentConversationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            messages: transcript.map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp.toISOString(),
            })),
          }),
        });
        
        if (response.ok) {
          console.log('Conversation saved successfully');
        } else {
          console.error('Failed to save conversation:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
    }
    
    if (conversation) {
      await conversation.endSession();
    }
    set({
      isConversationActive: false,
      isAgentSpeaking: false,
      conversation: null,
      sessionId: null,
      currentConversationId: null,
      sessionStartTime: null,
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
