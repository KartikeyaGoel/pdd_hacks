import { NextRequest, NextResponse } from 'next/server';
import { getDemoUserId } from '@/lib/demo-user';
import { prisma } from '@/lib/prisma';
import type { PaginatedResponse, Document } from '@/lib/types';
import type { JsonValue } from '@prisma/client/runtime/library';

/**
 * GET /api/documents
 * 
 * Fetches user's uploaded documents with optional filtering and pagination.
 * 
 * Query params:
 * - category: Filter by category
 * - sortBy: Sort field (name, uploadedAt, size)
 * - sortOrder: asc or desc
 * - limit: Number of results (default 20)
 * - offset: Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Get demo user ID (no auth required for hackathon demo)
    const userId = getDemoUserId();
    const searchParams = request.nextUrl.searchParams;

    // Parse query params
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'uploadedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where = {
      userId,
      deletedAt: null,
      ...(category && { category }),
    };

    // Build order by
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (['name', 'uploadedAt', 'size'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.uploadedAt = 'desc';
    }

    // Fetch documents
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          category: true,
          contentType: true,
          size: true,
          uploadedAt: true,
          processedAt: true,
          elevenLabsDocId: true,
          metadata: true,
        },
      }),
      prisma.document.count({ where }),
    ]);

    type DocumentRow = {
      id: string;
      name: string;
      category: string | null;
      contentType: string;
      size: number | null;
      uploadedAt: Date;
      processedAt: Date | null;
      elevenLabsDocId: string | null;
      metadata: JsonValue;
    };

    const response: PaginatedResponse<Document> = {
      items: documents.map((doc: DocumentRow) => ({
        ...doc,
        userId,
        content: null, // Don't include content in list
        deletedAt: null,
        metadata: doc.metadata as Document['metadata'],
      })),
      total,
      limit,
      offset,
      hasMore: offset + documents.length < total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Documents list error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
