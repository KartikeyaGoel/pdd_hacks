/**
 * examples/api-usage-example.tsx
 * 
 * This example demonstrates how to use the API client module in a React component.
 * It covers:
 * 1. Fetching data on mount (getConversations)
 * 2. Handling user interactions (uploadDocument, deleteConversation)
 * 3. Managing loading states and errors
 * 4. Using the ApiError class for specific error handling
 */

import React, { useState, useEffect } from 'react';
import {
  uploadDocument,
  initializeAgent,
  getConversations,
  deleteConversation,
  ApiError,
  type Conversation,
  type DocumentResponse
} from '../lib/api-client'; // Adjust path as needed

export const Dashboard: React.FC = () => {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // 1. Fetch data on component mount
  useEffect(() => {
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Pass the abort signal to cancel request if component unmounts
        const data = await getConversations(controller.signal);
        setConversations(data);
      } catch (err) {
        // Ignore abort errors (happens on unmount)
        if (err instanceof ApiError && err.status === 408) return;
        
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Cleanup function to abort pending requests
    return () => controller.abort();
  }, []);

  // 2. Handle File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus('Uploading...');
      
      // The client automatically handles FormData and Content-Type
      const response: DocumentResponse = await uploadDocument(file, 'financial-reports');
      
      setUploadStatus(`Success! File ID: ${response.id}`);
    } catch (err) {
      setUploadStatus('Upload failed');
      handleError(err);
    }
  };

  // 3. Handle Agent Initialization
  const startNewSession = async () => {
    try {
      setIsLoading(true);
      const session = await initializeAgent();
      console.log('Agent ready:', session.agentName);
      // Redirect or update UI state here...
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      await deleteConversation(id);
      // Optimistic UI update
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      handleError(err);
    }
  };

  // Centralized Error Handler
  const handleError = (err: unknown) => {
    if (err instanceof ApiError) {
      // Handle specific status codes
      switch (err.status) {
        case 401:
          setError('Session expired. Please log in again.');
          // redirect('/login');
          break;
        case 403:
          setError('You do not have permission to do that.');
          break;
        case 408:
          setError('Request timed out. Please check your connection.');
          break;
        default:
          setError(err.message); // "An internal server error occurred..."
      }
      
      // Log technical details for debugging
      if (err.details) {
        console.error('API Error Details:', err.details);
      }
    } else {
      setError('An unexpected network error occurred.');
      console.error(err);
    }
  };

  if (isLoading && conversations.length === 0) return <div>Loading dashboard...</div>;

  return (
    <div className="p-4">
      <h1>Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">&times;</button>
        </div>
      )}

      <div className="mb-8 border p-4 rounded">
        <h2>Upload Document</h2>
        <input type="file" onChange={handleFileUpload} />
        <p className="text-sm text-gray-600 mt-2">{uploadStatus}</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2>Recent Conversations</h2>
          <button 
            onClick={startNewSession}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            New Chat
          </button>
        </div>

        <ul className="space-y-2">
          {conversations.map(conv => (
            <li key={conv.id} className="border p-3 rounded flex justify-between">
              <div>
                <h3 className="font-bold">{conv.title}</h3>
                <p className="text-gray-500 text-sm">{conv.preview}</p>
              </div>
              <button 
                onClick={() => handleDelete(conv.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};