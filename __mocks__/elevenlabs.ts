/**
 * Mock ElevenLabs client for testing
 */

export const mockCreateAgentSession = jest.fn().mockResolvedValue({
  websocketUrl: 'wss://mock.elevenlabs.io/session/abc123',
  sessionId: 'mock-session-id-123',
  agentId: 'mock-agent-id',
});

export const mockUploadToKnowledgeBase = jest.fn().mockResolvedValue({
  id: 'mock-doc-id-456',
  name: 'test-document.pdf',
  status: 'indexed' as const,
  chunkCount: 5,
});

export const mockDeleteFromKnowledgeBase = jest.fn().mockResolvedValue(undefined);

export const mockGetConversationHistory = jest.fn().mockResolvedValue({
  messages: [
    { role: 'user', content: 'Hello', timestamp: 1000 },
    { role: 'assistant', content: 'Hi there!', timestamp: 2000 },
  ],
  duration: 60,
});

export const mockGenerateConversationSummary = jest.fn().mockResolvedValue({
  summary: 'Mock conversation summary about learning topics.',
  topics: ['learning', 'education'],
});

export const mockBuildSystemPrompt = jest.fn().mockReturnValue(
  'You are Montessori, an AI academic coach...'
);

// Reset all mocks between tests
export function resetElevenLabsMocks() {
  mockCreateAgentSession.mockReset().mockResolvedValue({
    websocketUrl: 'wss://mock.elevenlabs.io/session/abc123',
    sessionId: 'mock-session-id-123',
    agentId: 'mock-agent-id',
  });
  mockUploadToKnowledgeBase.mockReset().mockResolvedValue({
    id: 'mock-doc-id-456',
    name: 'test-document.pdf',
    status: 'indexed' as const,
    chunkCount: 5,
  });
  mockDeleteFromKnowledgeBase.mockReset().mockResolvedValue(undefined);
  mockGetConversationHistory.mockReset().mockResolvedValue({
    messages: [],
    duration: 0,
  });
  mockGenerateConversationSummary.mockReset().mockResolvedValue({
    summary: 'Mock summary',
    topics: ['general'],
  });
  mockBuildSystemPrompt.mockReset().mockReturnValue('Mock prompt');
}

// Mock the elevenlabs module
jest.mock('@/lib/elevenlabs', () => ({
  createAgentSession: mockCreateAgentSession,
  uploadToKnowledgeBase: mockUploadToKnowledgeBase,
  deleteFromKnowledgeBase: mockDeleteFromKnowledgeBase,
  getConversationHistory: mockGetConversationHistory,
  generateConversationSummary: mockGenerateConversationSummary,
  buildSystemPrompt: mockBuildSystemPrompt,
}));
