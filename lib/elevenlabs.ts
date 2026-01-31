import type { AgentSession, KnowledgeBaseDocument } from './types';

/**
 * ElevenLabs Client Wrapper
 * 
 * Provides type-safe interface to ElevenLabs Conversational AI platform.
 * Uses direct REST API calls for compatibility.
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || 'montessori-coach-v1';
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';


/**
 * Create an agent session for voice conversation
 */
export async function createAgentSession(
  userId: string,
  systemPrompt: string,
  options?: {
    knowledgeBaseId?: string;
    voiceId?: string;
    conversationContext?: string;
  }
): Promise<AgentSession> {
  const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      agent_id: ELEVENLABS_AGENT_ID,
      agent_config: {
        prompt: {
          prompt: systemPrompt,
        },
        first_message: options?.conversationContext
          ? `Welcome back! ${options.conversationContext}`
          : "Hello! I'm your AI learning coach. What would you like to learn about today?",
        language: 'en',
      },
      custom_metadata: {
        user_id: userId,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('ElevenLabs session creation failed:', error);
    throw new Error(`Failed to create agent session: ${response.status}`);
  }

  const data = await response.json();

  return {
    websocketUrl: data.signed_url || data.websocket_url,
    sessionId: data.conversation_id || data.session_id,
    agentId: ELEVENLABS_AGENT_ID,
  };
}

/**
 * Upload a document to ElevenLabs Knowledge Base
 */
export async function uploadToKnowledgeBase(
  userId: string,
  document: {
    name: string;
    content: string;
    category?: string;
  }
): Promise<KnowledgeBaseDocument> {
  const response = await fetch(`${ELEVENLABS_API_BASE}/convai/knowledge-base/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      name: document.name,
      text: document.content,
      metadata: {
        user_id: userId,
        category: document.category || 'general',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Knowledge base upload failed:', error);
    throw new Error(`Failed to upload document: ${response.status}`);
  }

  const data = await response.json();

  return {
    id: data.document_id || data.id,
    name: document.name,
    status: data.status || 'processing',
    chunkCount: data.chunk_count,
  };
}

/**
 * Delete a document from Knowledge Base
 */
export async function deleteFromKnowledgeBase(documentId: string): Promise<void> {
  const response = await fetch(
    `${ELEVENLABS_API_BASE}/convai/knowledge-base/documents/${documentId}`,
    {
      method: 'DELETE',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Knowledge base deletion failed:', error);
    throw new Error(`Failed to delete document: ${response.status}`);
  }
}

/**
 * Get conversation history/transcript
 */
export async function getConversationHistory(conversationId: string): Promise<{
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  duration: number;
}> {
  const response = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`,
    {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch conversation:', error);
    throw new Error(`Failed to get conversation: ${response.status}`);
  }

  const data = await response.json();

  return {
    messages: data.transcript || [],
    duration: data.duration_seconds || 0,
  };
}

/**
 * Generate a conversation summary using ElevenLabs/LLM
 */
export async function generateConversationSummary(
  transcript: Array<{ role: string; content: string }>
): Promise<{ summary: string; topics: string[] }> {
  // For now, generate a simple summary
  // In production, this would call an LLM API with the full transcript
  const summary = transcript.length > 0
    ? `Discussed: ${transcript[0].content.substring(0, 100)}...`
    : 'Empty conversation';

  // Extract basic topics from content
  const allContent = transcript.map((m) => m.content).join(' ').toLowerCase();
  const topicKeywords = ['physics', 'math', 'chemistry', 'biology', 'history', 
    'programming', 'machine learning', 'ai', 'science', 'literature'];
  const topics = topicKeywords.filter((topic) => allContent.includes(topic));

  return {
    summary,
    topics: topics.length > 0 ? topics : ['general'],
  };
}

/**
 * Build system prompt for the AI coach
 */
export function buildSystemPrompt(options: {
  userName?: string;
  knowledgeLevel?: string;
  learningStyle?: string;
  previousContext?: string;
  documentContext?: string;
}): string {
  const {
    userName = 'learner',
    knowledgeLevel = 'intermediate',
    learningStyle = 'balanced',
    previousContext,
    documentContext,
  } = options;

  let prompt = `You are Montessori, an AI academic coach designed for commuters who want to learn during their travel time.

Your core traits:
- Patient and encouraging teaching style
- Adaptive explanations based on the learner's responses
- Focus on understanding over memorization
- Use analogies and real-world examples
- Keep responses concise for audio consumption (under 60 seconds when spoken)

Student Profile:
- Name: ${userName}
- Knowledge Level: ${knowledgeLevel}
- Preferred Learning Style: ${learningStyle}

Teaching Guidelines:
1. Start with a brief overview of the topic
2. Use the Socratic method - ask questions to check understanding
3. If the student seems confused, simplify and use more examples
4. Celebrate progress and correct errors gently
5. Summarize key points periodically`;

  if (previousContext) {
    prompt += `\n\nPrevious Session Context:\n${previousContext}`;
  }

  if (documentContext) {
    prompt += `\n\nRelevant Knowledge from User's Documents:\n${documentContext}`;
  }

  return prompt;
}
