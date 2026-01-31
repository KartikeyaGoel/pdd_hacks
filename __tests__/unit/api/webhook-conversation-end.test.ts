/**
 * Tests for POST /api/webhook/conversation-end
 */

import { POST } from '@/app/api/webhook/conversation-end/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    conversation: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'conv-123',
        userId: 'demo-user-001',
        title: 'Learning Session',
        metadata: {},
      }),
      create: jest.fn().mockResolvedValue({
        id: 'new-conv-123',
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    conversationMessage: {
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
  },
}));

jest.mock('@/lib/elevenlabs', () => ({
  generateConversationSummary: jest.fn().mockResolvedValue({
    summary: 'Discussed physics concepts including thermodynamics.',
    topics: ['physics', 'thermodynamics'],
  }),
}));

describe('POST /api/webhook/conversation-end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
  });

  it('should process webhook payload successfully', async () => {
    const payload = {
      conversation_id: 'conv-123',
      transcript: [
        { role: 'user', content: 'Tell me about physics', timestamp: 1000 },
        { role: 'assistant', content: 'Physics is...', timestamp: 2000 },
      ],
      duration_seconds: 120,
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/conversation-end', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('topics');
  });

  it('should return 400 for missing conversation_id', async () => {
    const payload = {
      transcript: [],
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/conversation-end', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should generate summary from transcript', async () => {
    const { generateConversationSummary } = require('@/lib/elevenlabs');
    
    const payload = {
      conversation_id: 'conv-123',
      transcript: [
        { role: 'user', content: 'Hello', timestamp: 1000 },
        { role: 'assistant', content: 'Hi!', timestamp: 2000 },
      ],
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/conversation-end', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    await POST(request);

    expect(generateConversationSummary).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Hello' }),
      ])
    );
  });

  it('should store messages in database', async () => {
    const { prisma } = require('@/lib/prisma');
    
    const payload = {
      conversation_id: 'conv-123',
      transcript: [
        { role: 'user', content: 'Message 1', timestamp: 1000 },
        { role: 'assistant', content: 'Message 2', timestamp: 2000 },
      ],
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/conversation-end', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    await POST(request);

    expect(prisma.conversationMessage.createMany).toHaveBeenCalled();
  });

  it('should update conversation with summary and duration', async () => {
    const { prisma } = require('@/lib/prisma');
    
    const payload = {
      conversation_id: 'conv-123',
      transcript: [],
      duration_seconds: 300,
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/conversation-end', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    await POST(request);

    expect(prisma.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          duration: 300,
          endedAt: expect.any(Date),
        }),
      })
    );
  });

  it('should create placeholder conversation if not found with user_id', async () => {
    const { prisma } = require('@/lib/prisma');
    prisma.conversation.findFirst.mockResolvedValueOnce(null);
    
    const payload = {
      conversation_id: 'unknown-conv',
      user_id: 'user-123',
      transcript: [],
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/conversation-end', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    await POST(request);

    expect(prisma.conversation.create).toHaveBeenCalled();
  });
});
