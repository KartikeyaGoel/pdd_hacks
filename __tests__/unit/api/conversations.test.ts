/**
 * Tests for GET /api/conversations
 */

import { NextRequest } from 'next/server';

// Mock Prisma - must be defined before import
const mockFindMany = jest.fn();
const mockCount = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    conversation: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

// Import after mock is set up
import { GET } from '@/app/api/conversations/route';

// Mock data
const mockConversations = [
  {
    id: 'conv-1',
    title: 'Physics Lesson',
    summary: 'Discussed thermodynamics',
    startedAt: new Date('2024-01-15'),
    endedAt: new Date('2024-01-15'),
    duration: 1800,
    metadata: { topics: ['physics', 'thermodynamics'] },
    _count: { messages: 10 },
  },
  {
    id: 'conv-2',
    title: 'Math Session',
    summary: 'Reviewed calculus',
    startedAt: new Date('2024-01-14'),
    endedAt: new Date('2024-01-14'),
    duration: 1200,
    metadata: { topics: ['math'] },
    _count: { messages: 5 },
  },
];

describe('GET /api/conversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue(mockConversations);
    mockCount.mockResolvedValue(2);
  });

  it('should return paginated conversation list', async () => {
    const request = new NextRequest('http://localhost:3000/api/conversations');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('conversations');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('hasMore');
    expect(data.conversations).toHaveLength(2);
  });

  it('should include conversation summaries', async () => {
    const request = new NextRequest('http://localhost:3000/api/conversations');
    
    const response = await GET(request);
    const data = await response.json();

    const conv = data.conversations[0];
    expect(conv).toHaveProperty('id');
    expect(conv).toHaveProperty('title');
    expect(conv).toHaveProperty('summary');
    expect(conv).toHaveProperty('startedAt');
    expect(conv).toHaveProperty('duration');
    expect(conv).toHaveProperty('topics');
    expect(conv).toHaveProperty('messageCount');
  });

  it('should respect limit and offset parameters', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/conversations?limit=5&offset=10'
    );
    
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        skip: 10,
      })
    );
  });

  it('should filter by date range', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/conversations?startDate=2024-01-01&endDate=2024-01-31'
    );
    
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startedAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it('should exclude soft-deleted conversations', async () => {
    const request = new NextRequest('http://localhost:3000/api/conversations');
    
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
        }),
      })
    );
  });

  it('should cap limit at 100', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/conversations?limit=500'
    );
    
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    );
  });
});
