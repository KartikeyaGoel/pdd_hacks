/**
 * examples/usage_example.tsx
 * 
 * This example demonstrates how to use the global Zustand store in a React component.
 * It shows how to:
 * 1. Select specific state slices to prevent unnecessary re-renders.
 * 2. Dispatch actions to update the global state.
 * 3. Handle async actions like loading history.
 */

import React, { useEffect } from 'react';
import { useAppStore, Message } from '../lib/store'; // Adjust path as needed

const ChatInterface = () => {
  // 1. SELECTING STATE
  // Best Practice: Select only what you need to avoid re-renders when other state changes.
  
  // Get conversation state
  const transcript = useAppStore((state) => state.transcript);
  const status = useAppStore((state) => state.conversationStatus);
  const isConnected = useAppStore((state) => state.isConnected);
  
  // Get upload state
  const uploadProgress = useAppStore((state) => state.uploadProgress);
  const currentUpload = useAppStore((state) => state.currentUpload);

  // 2. SELECTING ACTIONS
  // Actions are stable, so you can destructure them or select them.
  const addMessage = useAppStore((state) => state.addMessageToTranscript);
  const setStatus = useAppStore((state) => state.setConversationStatus);
  const setUploadProgress = useAppStore((state) => state.setUploadProgress);
  const loadConversations = useAppStore((state) => state.loadConversations);

  // Example: Load history on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Example: Simulate receiving a message
  const handleSendMessage = () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Hello, AI!',
      timestamp: Date.now(),
    };

    // Update state via action
    addMessage(newMessage);
    setStatus('active');
  };

  // Example: Simulate a file upload
  const handleFileUpload = () => {
    useAppStore.getState().setCurrentUpload('document.pdf'); // Accessing state outside hook (rarely needed but possible)
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 500);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h2>Chat Interface</h2>
      
      <div className="status-bar">
        <p>Status: <strong>{status}</strong></p>
        <p>WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      </div>

      <div className="chat-window" style={{ minHeight: '100px', background: '#f5f5f5' }}>
        {transcript.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          transcript.map((msg) => (
            <div key={msg.id}>
              <strong>{msg.role}:</strong> {msg.content}
            </div>
          ))
        )}
      </div>

      <div className="controls" style={{ marginTop: '10px' }}>
        <button onClick={handleSendMessage}>Send Message</button>
        <button onClick={handleFileUpload}>Simulate Upload</button>
        <button onClick={() => useAppStore.getState().resetConversation()}>
          Reset Chat
        </button>
      </div>

      {currentUpload && (
        <div className="upload-status">
          Uploading {currentUpload}: {uploadProgress}%
        </div>
      )}
    </div>
  );
};

export default ChatInterface;