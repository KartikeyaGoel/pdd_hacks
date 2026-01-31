'use client';

import type {
  AgentInitializeResponse,
  DocumentUploadResponse,
  ConversationListResponse,
  ConversationContinueResponse,
  Document,
  ApiResponse,
  PaginatedResponse,
  DocumentFilterParams,
  ConversationFilterParams,
} from './types';

/**
 * API Client
 * 
 * Type-safe fetch wrappers for all API endpoints with automatic
 * error handling and authentication.
 */

const API_BASE = '/api';

/**
 * API Error class for typed error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || errorData.message || 'Request failed',
      response.status,
      errorData.code
    );
  }

  return response.json();
}

// =============================================================================
// Agent API
// =============================================================================

/**
 * Initialize a new agent conversation session
 */
export async function initializeAgent(options?: {
  conversationId?: string;
}): Promise<AgentInitializeResponse> {
  const params = new URLSearchParams();
  if (options?.conversationId) {
    params.set('conversationId', options.conversationId);
  }
  
  const queryString = params.toString();
  const endpoint = `/agent/initialize${queryString ? `?${queryString}` : ''}`;
  
  return fetchApi<AgentInitializeResponse>(endpoint);
}

// =============================================================================
// Document API
// =============================================================================

/**
 * Upload a document to the knowledge base
 */
export async function uploadDocument(
  file: File,
  name: string,
  category?: string
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  if (category) {
    formData.append('category', category);
  }

  const response = await fetch(`${API_BASE}/upload-document`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || 'Upload failed',
      response.status
    );
  }

  return response.json();
}

/**
 * List user's documents
 */
export async function listDocuments(
  params?: DocumentFilterParams
): Promise<PaginatedResponse<Document>> {
  const searchParams = new URLSearchParams();
  
  if (params?.category) searchParams.set('category', params.category);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  
  const queryString = searchParams.toString();
  const endpoint = `/documents${queryString ? `?${queryString}` : ''}`;
  
  return fetchApi<PaginatedResponse<Document>>(endpoint);
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await fetchApi(`/documents/${documentId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// Conversation API
// =============================================================================

/**
 * List user's conversations
 */
export async function listConversations(
  params?: ConversationFilterParams
): Promise<ConversationListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.startDate) searchParams.set('startDate', params.startDate.toISOString());
  if (params?.endDate) searchParams.set('endDate', params.endDate.toISOString());
  
  const queryString = searchParams.toString();
  const endpoint = `/conversations${queryString ? `?${queryString}` : ''}`;
  
  return fetchApi<ConversationListResponse>(endpoint);
}

/**
 * Continue a past conversation
 */
export async function continueConversation(
  conversationId: string
): Promise<ConversationContinueResponse> {
  return fetchApi<ConversationContinueResponse>(
    `/conversations/${conversationId}/continue`,
    { method: 'POST' }
  );
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  await fetchApi(`/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}

/**
 * Get conversation details
 */
export async function getConversation(conversationId: string): Promise<ApiResponse<{
  conversation: {
    id: string;
    title: string | null;
    summary: string | null;
    startedAt: Date;
    endedAt: Date | null;
    duration: number | null;
  };
  messages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
}>> {
  return fetchApi(`/conversations/${conversationId}`);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if user is authenticated
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    return !!session?.user;
  } catch {
    return false;
  }
}

/**
 * Get current user session
 */
export async function getSession(): Promise<{
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
} | null> {
  try {
    const response = await fetch('/api/auth/session');
    return response.json();
  } catch {
    return null;
  }
}
