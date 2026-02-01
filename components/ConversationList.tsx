'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { listConversations, deleteConversation, continueConversation } from '@/lib/api-client';
import type { ConversationSummary } from '@/lib/types';

/**
 * ConversationList Component
 * 
 * Modern dark-themed conversation history with:
 * - Glassmorphism card design
 * - Hover glow effects
 * - Animated transitions
 * - Accent-colored topic pills
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
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-surface-elevated border-t-mint animate-spin" />
          <p className="text-text-muted">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-coral/10 border border-coral/30 rounded-xl text-coral mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
        <div>
          <button
            onClick={loadConversations}
            className="text-mint hover:text-mint/80 font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="p-6 rounded-full bg-surface-elevated inline-block mb-6">
          <svg
            className="w-12 h-12 text-text-muted"
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
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">No conversations yet</h3>
        <p className="text-text-secondary mb-8 max-w-sm mx-auto">
          Start a learning session to see your conversation history here.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-mint text-background rounded-xl font-medium hover:brightness-110"
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
          className="bg-surface rounded-2xl border border-white/10 p-6 hover:border-white/20 group"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-text-primary">
                {conversation.title || 'Learning Session'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatDate(conversation.startedAt)}</span>
                {conversation.messageCount > 0 && (
                  <>
                    <span className="text-text-muted/50">·</span>
                    <span>{conversation.messageCount} messages</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {conversation.summary && (
            <p className="text-text-secondary text-sm mb-4 line-clamp-2 leading-relaxed">
              {conversation.summary}
            </p>
          )}

          {/* Topics */}
          {conversation.topics && conversation.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {conversation.topics.map((topic, topicIndex) => (
                <span
                  key={topicIndex}
                  className="px-3 py-1 bg-mint/10 text-mint text-xs font-medium rounded-full border border-mint/20"
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
              className="flex items-center gap-2 px-5 py-2.5 bg-mint text-background rounded-xl font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span className="text-sm text-text-secondary">Delete?</span>
                <button
                  onClick={() => handleDelete(conversation.id)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-coral text-white text-sm font-medium rounded-lg hover:brightness-110 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-surface-elevated text-text-primary text-sm font-medium rounded-lg hover:bg-white/10 border border-white/10"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirmId(conversation.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-text-muted hover:text-coral hover:bg-coral/10 rounded-xl"
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

      {/* Refresh button */}
      <div className="text-center pt-6">
        <button
          onClick={loadConversations}
          className="inline-flex items-center gap-2 text-mint hover:text-mint/80 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
}
