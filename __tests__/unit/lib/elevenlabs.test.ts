import {
  createAgentSession,
  uploadToKnowledgeBase,
  deleteFromKnowledgeBase,
  getConversationHistory,
  generateConversationSummary,
  buildSystemPrompt,
} from '@/lib/elevenlabs';

// Mock global fetch
global.fetch = jest.fn();

describe('elevenlabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
  });

  describe('createAgentSession', () => {
    it('should create an agent session successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          signed_url: 'wss://api.elevenlabs.io/session/123',
          conversation_id: 'session-123',
        }),
      });

      const result = await createAgentSession('user-123', 'System prompt');

      expect(result).toHaveProperty('websocketUrl');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('agentId');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(
        createAgentSession('user-123', 'System prompt')
      ).rejects.toThrow('Failed to create agent session');
    });
  });

  describe('uploadToKnowledgeBase', () => {
    it('should upload document successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          document_id: 'doc-123',
          status: 'indexed',
          chunk_count: 5,
        }),
      });

      const result = await uploadToKnowledgeBase('user-123', {
        name: 'test.pdf',
        content: 'Document content',
        category: 'study-materials',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error on upload failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      await expect(
        uploadToKnowledgeBase('user-123', {
          name: 'test.pdf',
          content: 'Content',
        })
      ).rejects.toThrow('Failed to upload document');
    });
  });

  describe('deleteFromKnowledgeBase', () => {
    it('should delete document successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await expect(
        deleteFromKnowledgeBase('doc-123')
      ).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error on delete failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      await expect(
        deleteFromKnowledgeBase('doc-123')
      ).rejects.toThrow('Failed to delete document');
    });
  });

  describe('getConversationHistory', () => {
    it('should fetch conversation history', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transcript: [
            { role: 'user', content: 'Hello', timestamp: 1000 },
            { role: 'assistant', content: 'Hi!', timestamp: 2000 },
          ],
          duration_seconds: 120,
        }),
      });

      const result = await getConversationHistory('conv-123');

      expect(result.messages).toHaveLength(2);
      expect(result.duration).toBe(120);
    });

    it('should throw error on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      await expect(
        getConversationHistory('conv-123')
      ).rejects.toThrow('Failed to get conversation');
    });
  });

  describe('generateConversationSummary', () => {
    it('should generate summary from transcript', async () => {
      const transcript = [
        { role: 'user', content: 'Tell me about physics and thermodynamics' },
        { role: 'assistant', content: 'Physics is the study of matter and energy...' },
      ];

      const result = await generateConversationSummary(transcript);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('topics');
      expect(Array.isArray(result.topics)).toBe(true);
    });

    it('should handle empty transcript', async () => {
      const result = await generateConversationSummary([]);

      expect(result.summary).toBe('Empty conversation');
      expect(result.topics).toContain('general');
    });

    it('should extract topics from content', async () => {
      const transcript = [
        { role: 'user', content: 'I want to learn about machine learning and ai' },
      ];

      const result = await generateConversationSummary(transcript);

      expect(result.topics).toContain('machine learning');
      expect(result.topics).toContain('ai');
    });
  });

  describe('buildSystemPrompt', () => {
    it('should include user name', () => {
      const prompt = buildSystemPrompt({ userName: 'John' });
      expect(prompt).toContain('John');
    });

    it('should include knowledge level', () => {
      const prompt = buildSystemPrompt({
        userName: 'Test',
        knowledgeLevel: 'advanced',
      });
      expect(prompt).toContain('advanced');
    });

    it('should include learning style', () => {
      const prompt = buildSystemPrompt({
        userName: 'Test',
        learningStyle: 'visual',
      });
      expect(prompt).toContain('visual');
    });

    it('should include previous context when provided', () => {
      const prompt = buildSystemPrompt({
        userName: 'Test',
        previousContext: 'Previously discussed thermodynamics',
      });
      expect(prompt).toContain('thermodynamics');
    });

    it('should include document context when provided', () => {
      const prompt = buildSystemPrompt({
        userName: 'Test',
        documentContext: 'User has uploaded Physics textbook',
      });
      expect(prompt).toContain('Physics textbook');
    });

    it('should contain Montessori teaching persona', () => {
      const prompt = buildSystemPrompt({ userName: 'Test' });
      expect(prompt).toContain('Montessori');
      expect(prompt).toContain('coach');
    });
  });
});
