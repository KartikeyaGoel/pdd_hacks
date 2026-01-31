/**
 * Tests for GET /api/agent/initialize
 */

import { GET } from '@/app/api/agent/initialize/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    conversation: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'conv-123',
        userId: 'demo-user-001',
        title: 'New Learning Session',
      }),
    },
  },
}));

jest.mock('@/lib/elevenlabs', () => ({
  createAgentSession: jest.fn().mockResolvedValue({
    websocketUrl: 'wss://mock.elevenlabs.io/session',
    sessionId: 'session-123',
    agentId: 'agent-123',
  }),
  buildSystemPrompt: jest.fn().mockReturnValue('Mock system prompt'),
}));

describe('GET /api/agent/initialize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return WebSocket URL and session info', async () => {
    const request = new NextRequest('http://localhost:3000/api/agent/initialize');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('websocket_url');
    expect(data).toHaveProperty('session_id');
    expect(data).toHaveProperty('agent_id');
    expect(data).toHaveProperty('conversation_id');
  });

  it('should create a conversation record', async () => {
    const { prisma } = require('@/lib/prisma');
    const request = new NextRequest('http://localhost:3000/api/agent/initialize');
    
    await GET(request);

    expect(prisma.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'demo-user-001',
          title: 'New Learning Session',
        }),
      })
    );
  });

  it('should fetch user documents for context', async () => {
    const { prisma } = require('@/lib/prisma');
    const request = new NextRequest('http://localhost:3000/api/agent/initialize');
    
    await GET(request);

    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'demo-user-001',
          deletedAt: null,
        }),
      })
    );
  });

  it('should include documents in system prompt when available', async () => {
    const { prisma } = require('@/lib/prisma');
    const { buildSystemPrompt } = require('@/lib/elevenlabs');
    
    prisma.document.findMany.mockResolvedValueOnce([
      { name: 'Physics.pdf', category: 'study-materials' },
      { name: 'Notes.txt', category: 'notes' },
    ]);

    const request = new NextRequest('http://localhost:3000/api/agent/initialize');
    await GET(request);

    expect(buildSystemPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        documentContext: expect.stringContaining('Physics.pdf'),
      })
    );
  });

  it('should load previous conversation context when conversationId provided', async () => {
    const { prisma } = require('@/lib/prisma');
    const { buildSystemPrompt } = require('@/lib/elevenlabs');
    
    prisma.conversation.findUnique.mockResolvedValueOnce({
      summary: 'We discussed thermodynamics',
      title: 'Physics Session',
    });

    const request = new NextRequest(
      'http://localhost:3000/api/agent/initialize?conversationId=prev-conv-123'
    );
    await GET(request);

    expect(buildSystemPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        previousContext: expect.stringContaining('thermodynamics'),
      })
    );
  });
});
