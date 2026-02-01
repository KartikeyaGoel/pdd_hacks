/**
 * lib/store.ts
 * 
 * Global state management for the learning assistant application using Zustand.
 * Handles conversation flow, WebSocket connections, document uploads, and history.
 */

import { create } from 'zustand';

// --- Types ---

export type ConversationStatus = 'idle' | 'connecting' | 'active' | 'ended';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// --- State Interface ---

export interface AppState {
  // Conversation State
  conversationStatus: ConversationStatus;
  currentSessionId: string | null;
  transcript: Message[];
  
  // WebSocket State
  websocketUrl: string | null;
  isConnected: boolean;
  connectionError: string | null;
  
  // Upload State
  uploadProgress: number; // 0 to 100
  currentUpload: string | null; // filename
  uploadError: string | null;
  
  // History State
  conversations: Conversation[];
  isLoadingHistory: boolean;

  // --- Actions ---

  // Conversation Actions
  setConversationStatus: (status: ConversationStatus) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  addMessageToTranscript: (message: Message) => void;
  updateTranscript: (messages: Message[]) => void;
  resetConversation: () => void;

  // WebSocket Actions
  setWebSocketUrl: (url: string | null) => void;
  setIsConnected: (isConnected: boolean) => void;
  setConnectionError: (error: string | null) => void;

  // Upload Actions
  setUploadProgress: (progress: number) => void;
  setCurrentUpload: (filename: string | null) => void;
  setUploadError: (error: string | null) => void;
  resetUpload: () => void;

  // History Actions
  setConversations: (conversations: Conversation[]) => void;
  setIsLoadingHistory: (isLoading: boolean) => void;
  loadConversations: () => Promise<void>; // Example async action
}

// --- Store Implementation ---

export const useAppStore = create<AppState>()((set, get) => ({
  // Initial Conversation State
  conversationStatus: 'idle',
  currentSessionId: null,
  transcript: [],

  // Initial WebSocket State
  websocketUrl: null,
  isConnected: false,
  connectionError: null,

  // Initial Upload State
  uploadProgress: 0,
  currentUpload: null,
  uploadError: null,

  // Initial History State
  conversations: [],
  isLoadingHistory: false,

  // --- Action Implementations ---

  // Conversation Actions
  setConversationStatus: (status) => set({ conversationStatus: status }),
  
  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
  
  addMessageToTranscript: (message) => set((state) => ({
    transcript: [...state.transcript, message]
  })),
  
  updateTranscript: (messages) => set({ transcript: messages }),
  
  resetConversation: () => set({
    conversationStatus: 'idle',
    currentSessionId: null,
    transcript: [],
    isConnected: false,
    connectionError: null
  }),

  // WebSocket Actions
  setWebSocketUrl: (url) => set({ websocketUrl: url }),
  
  setIsConnected: (isConnected) => set({ isConnected }),
  
  setConnectionError: (error) => set({ connectionError: error }),

  // Upload Actions
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  
  setCurrentUpload: (filename) => set({ currentUpload: filename }),
  
  setUploadError: (error) => set({ uploadError: error }),
  
  resetUpload: () => set({
    uploadProgress: 0,
    currentUpload: null,
    uploadError: null
  }),

  // History Actions
  setConversations: (conversations) => set({ conversations }),
  
  setIsLoadingHistory: (isLoading) => set({ isLoadingHistory: isLoading }),
  
  // Example async action to load conversations
  // In a real app, this would fetch from an API endpoint
  loadConversations: async () => {
    const { setIsLoadingHistory, setConversations } = get();
    
    setIsLoadingHistory(true);
    
    try {
      // Simulate API call
      // const response = await fetch('/api/conversations');
      // const data = await response.json();
      
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockConversations: Conversation[] = [
        {
          id: '1',
          title: 'Introduction to React',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Advanced TypeScript Patterns',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // Optionally set an error state here if needed
    } finally {
      setIsLoadingHistory(false);
    }
  }
}));