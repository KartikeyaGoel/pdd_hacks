/**
 * Shared TypeScript type definitions for Montessori AI
 */

// =============================================================================
// User Types
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  baselineKnowledge?: Record<string, number>;
  learningPreferences?: LearningPreferences;
}

export interface LearningPreferences {
  pace: 'slow' | 'medium' | 'fast';
  detailLevel: 'basic' | 'intermediate' | 'advanced';
  exampleTypes: string[];
}

// =============================================================================
// Conversation Types
// =============================================================================

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  summary: string | null;
  startedAt: Date;
  endedAt: Date | null;
  duration: number | null;
  metadata: ConversationMetadata | null;
}

export interface ConversationMetadata {
  topics?: string[];
  documentIds?: string[];
  agentSessionId?: string;
  elevenLabsConversationId?: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  audioDuration?: number;
  wordCount?: number;
}

export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

// =============================================================================
// Document Types
// =============================================================================

export interface Document {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  contentType: string;
  size: number | null;
  uploadedAt: Date;
  processedAt: Date | null;
  elevenLabsDocId: string | null;
  metadata: DocumentMetadata | null;
}

export interface DocumentMetadata {
  pageCount?: number;
  wordCount?: number;
  chunkCount?: number;
}

export interface DocumentUpload {
  file: File;
  name: string;
  category?: string;
}

// =============================================================================
// ElevenLabs Types
// =============================================================================

export interface AgentSession {
  websocketUrl: string;
  sessionId: string;
  agentId: string;
  conversationId?: string;
}

export interface KnowledgeBaseDocument {
  id: string;
  name: string;
  status: 'processing' | 'indexed' | 'failed';
  chunkCount?: number;
}

export interface ElevenLabsWebhookPayload {
  conversation_id: string;
  user_id?: string;
  transcript?: TranscriptMessage[];
  duration_seconds?: number;
  event_type: 'conversation.ended' | 'tool.executed';
}

export interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// =============================================================================
// API Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Request/Response Types
// =============================================================================

// Agent Initialize
export interface AgentInitializeResponse {
  websocket_url: string;
  session_id: string;
  agent_id: string;
  conversation_id: string;
}

// Document Upload
export interface DocumentUploadRequest {
  file: File;
  name: string;
  category?: string;
}

export interface DocumentUploadResponse {
  document_id: string;
  status: 'processing' | 'indexed' | 'failed';
  chunk_count?: number;
}

// Conversations
export interface ConversationListResponse {
  conversations: ConversationSummary[];
  total: number;
  hasMore: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  summary: string | null;
  startedAt: Date;
  duration: number | null;
  topics: string[];
  messageCount: number;
}

export interface ConversationContinueResponse {
  websocket_url: string;
  session_id: string;
  context_summary: string;
  conversation_id: string;
}

// Tool Execution
export interface ToolExecutionRequest {
  tool_name: string;
  parameters: Record<string, unknown>;
  conversation_id: string;
}

export interface ToolExecutionResponse {
  result: Record<string, unknown>;
  error?: string;
}

// =============================================================================
// Utility Types
// =============================================================================

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface DocumentFilterParams extends PaginationParams {
  category?: string;
  sortBy?: 'name' | 'uploadedAt' | 'size';
  sortOrder?: SortOrder;
}

export interface ConversationFilterParams extends PaginationParams {
  startDate?: Date;
  endDate?: Date;
}
