/**
 * Tests for GET /api/documents
 */

import { NextRequest } from 'next/server';

// Mock Prisma - must be defined before import
const mockFindMany = jest.fn();
const mockCount = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

// Import after mock is set up
import { GET } from '@/app/api/documents/route';

// Mock documents
const mockDocuments = [
  {
    id: 'doc-1',
    name: 'Physics Textbook.pdf',
    category: 'study-materials',
    contentType: 'application/pdf',
    size: 1024000,
    uploadedAt: new Date('2024-01-15'),
    processedAt: new Date('2024-01-15'),
    elevenLabsDocId: 'el-doc-1',
    metadata: { chunkCount: 50 },
  },
  {
    id: 'doc-2',
    name: 'Notes.txt',
    category: 'notes',
    contentType: 'text/plain',
    size: 5000,
    uploadedAt: new Date('2024-01-14'),
    processedAt: new Date('2024-01-14'),
    elevenLabsDocId: 'el-doc-2',
    metadata: { chunkCount: 5 },
  },
];

describe('GET /api/documents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue(mockDocuments);
    mockCount.mockResolvedValue(2);
  });

  it('should return paginated document list', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('limit');
    expect(data).toHaveProperty('offset');
    expect(data).toHaveProperty('hasMore');
    expect(data.items).toHaveLength(2);
  });

  it('should include document metadata', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents');
    
    const response = await GET(request);
    const data = await response.json();

    const doc = data.items[0];
    expect(doc).toHaveProperty('id');
    expect(doc).toHaveProperty('name');
    expect(doc).toHaveProperty('category');
    expect(doc).toHaveProperty('contentType');
    expect(doc).toHaveProperty('size');
    expect(doc).toHaveProperty('uploadedAt');
  });

  it('should filter by category', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/documents?category=study-materials'
    );
    
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'study-materials',
        }),
      })
    );
  });

  it('should support sorting by name', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/documents?sortBy=name&sortOrder=asc'
    );
    
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      })
    );
  });

  it('should support sorting by uploadedAt', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/documents?sortBy=uploadedAt&sortOrder=desc'
    );
    
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { uploadedAt: 'desc' },
      })
    );
  });

  it('should support sorting by size', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/documents?sortBy=size&sortOrder=desc'
    );
    
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { size: 'desc' },
      })
    );
  });

  it('should exclude soft-deleted documents', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents');
    
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
        }),
      })
    );
  });

  it('should respect limit and offset', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/documents?limit=10&offset=20'
    );
    
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20,
      })
    );
  });
});
