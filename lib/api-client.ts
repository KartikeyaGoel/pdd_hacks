/**
 * lib/api-client.ts
 * 
 * A typed fetch wrapper for backend API communication.
 * Handles authentication via NextAuth cookies, error parsing, timeouts,
 * and provides type-safe methods for all application endpoints.
 */

// --- Types & Interfaces ---

export interface DocumentResponse {
  id: string;
  filename: string;
  category: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
}

export interface AgentSessionResponse {
  sessionId: string;
  agentName: string;
  initialMessage: string;
  status: 'active' | 'idle';
}

export interface Conversation {
  id: string;
  title: string;
  lastMessageAt: string;
  preview: string;
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(status: number, message: string, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// --- Configuration ---

const DEFAULT_TIMEOUT_MS = 30000;

interface RequestOptions extends RequestInit {
  timeout?: number;
}

// --- Core Fetch Wrapper ---

/**
 * Internal wrapper around fetch to handle configuration, timeouts, and error parsing.
 */
async function client<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  // Setup AbortController for timeout handling
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  // Allow passing an external signal to cancel requests manually
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  const config: RequestInit = {
    ...fetchOptions,
    signal: controller.signal,
    // 'include' ensures NextAuth session cookies are sent with the request
    credentials: 'include', 
    headers: {
      // Only set Content-Type if body is NOT FormData (browser sets boundary automatically)
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(endpoint, config);
    clearTimeout(id);

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Attempt to parse JSON
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      // Construct a descriptive error based on status code
      let errorMessage = data.message || response.statusText;
      
      if (response.status === 401) {
        errorMessage = 'Authentication required. Please log in.';
      } else if (response.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (response.status === 500) {
        errorMessage = 'An internal server error occurred. Please try again later.';
      }

      throw new ApiError(response.status, errorMessage, data.code, data.details);
    }

    return data as T;
  } catch (error: unknown) {
    clearTimeout(id);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, `Request timed out after ${timeout}ms`);
    }

    // Handle network errors (offline, DNS issues, etc.)
    const message = error instanceof Error ? error.message : 'Network error occurred';
    throw new ApiError(0, message);
  }
}

// --- API Methods ---

/**
 * Uploads a document file with a specific category.
 * Uses FormData for multipart/form-data transmission.
 */
export async function uploadDocument(
  file: File, 
  category: string,
  signal?: AbortSignal
): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  return client<DocumentResponse>('/api/upload-document', {
    method: 'POST',
    body: formData,
    signal,
    // Extended timeout for large file uploads
    timeout: 60000, 
  });
}

/**
 * Initializes a new agent session.
 */
export async function initializeAgent(signal?: AbortSignal): Promise<AgentSessionResponse> {
  return client<AgentSessionResponse>('/api/agent/initialize', {
    method: 'GET',
    signal,
  });
}

/**
 * Retrieves a list of past conversations.
 */
export async function getConversations(signal?: AbortSignal): Promise<Conversation[]> {
  return client<Conversation[]>('/api/conversations', {
    method: 'GET',
    signal,
  });
}

/**
 * Resumes an existing conversation by ID.
 */
export async function continueConversation(
  id: string, 
  signal?: AbortSignal
): Promise<AgentSessionResponse> {
  return client<AgentSessionResponse>(`/api/conversations/${id}/continue`, {
    method: 'POST',
    signal,
  });
}

/**
 * Deletes a conversation by ID.
 */
export async function deleteConversation(
  id: string, 
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  return client<{ success: boolean }>(`/api/conversations/${id}`, {
    method: 'DELETE',
    signal,
  });
}