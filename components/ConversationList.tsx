'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { listConversations, deleteConversation, continueConversation } from '@/lib/api-client';
import type { ConversationSummary } from '@/lib/types';

/**
 * ConversationList Component
 * 
 * Displays past conversations in a grid layout with:
 * - Date, duration, title, and summary
 * - Continue and Delete actions
 * - Confirmation dialog for delete
 */
export default function ConversationList() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isContinuing, setIsContinuing] = useState<string | null>(null);

  const { connect, clearTranscript, setConnecting } = useAppStore();

  /**
   * Load conversations
   */
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listConversations({ limit: 20 });
      setConversations(response.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /**
   * Handle continue conversation
   */
  const handleContinue = async (conversationId: string) => {
    setIsContinuing(conversationId);
    setError(null);

    try {
      const session = await continueConversation(conversationId);
      
      // Clear transcript and connect
      clearTranscript();
      setConnecting(true);
      connect(session.websocket_url, session.conversation_id, session.session_id);
      
      // Navigate to main page
      router.push('/');
    } catch (err) {
      console.error('Failed to continue conversation:', err);
      setError('Failed to continue conversation');
      setIsContinuing(null);
    }
  };

  /**
   * Handle delete conversation
   */
  const handleDelete = async (conversationId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('Failed to delete conversation');
    } finally {
      setIsDeleting(false);
    }
  };


  /**
   * Format date
   */
  const formatDate = (date: Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadConversations}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
        <p className="text-gray-500 mb-6">
          Start a learning session to see your conversation history here.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Start Learning
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                {conversation.title || 'Learning Session'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span>{formatDate(conversation.startedAt)}</span>
                {conversation.messageCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{conversation.messageCount} messages</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {conversation.summary && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {conversation.summary}
            </p>
          )}

          {/* Topics */}
          {conversation.topics && conversation.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {conversation.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleContinue(conversation.id)}
              disabled={isContinuing === conversation.id}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isContinuing === conversation.id ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Continue
                </>
              )}
            </button>

            {deleteConfirmId === conversation.id ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Delete?</span>
                <button
                  onClick={() => handleDelete(conversation.id)}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirmId(conversation.id)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Load more */}
      <div className="text-center pt-4">
        <button
          onClick={loadConversations}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
