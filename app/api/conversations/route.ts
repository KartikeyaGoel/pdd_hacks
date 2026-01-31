import { NextRequest, NextResponse } from 'next/server';
import { getDemoUserId } from '@/lib/demo-user';
import { prisma } from '@/lib/prisma';
import type { ConversationListResponse, ConversationSummary } from '@/lib/types';
import type { JsonValue } from '@prisma/client/runtime/library';

/**
 * GET /api/conversations
 * 
 * Fetches user's conversation history with pagination.
 * 
 * Query params:
 * - limit: Number of results (default 20)
 * - offset: Pagination offset (default 0)
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 */
export async function GET(request: NextRequest) {
  try {
    // Get demo user ID (no auth required for hackathon demo)
    const userId = getDemoUserId();
    const searchParams = request.nextUrl.searchParams;

    // Parse query params
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: {
      userId: string;
      deletedAt: null;
      startedAt?: { gte?: Date; lte?: Date };
    } = {
      userId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) where.startedAt.gte = new Date(startDate);
      if (endDate) where.startedAt.lte = new Date(endDate);
    }

    // Fetch conversations with message count
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          summary: true,
          startedAt: true,
          endedAt: true,
          duration: true,
          metadata: true,
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    // Transform to response format
    type ConversationWithCount = {
      id: string;
      title: string | null;
      summary: string | null;
      startedAt: Date;
      endedAt: Date | null;
      duration: number | null;
      metadata: JsonValue;
      _count: { messages: number };
    };

    const conversationSummaries: ConversationSummary[] = conversations.map((conv: ConversationWithCount) => {
      const metadata = conv.metadata as { topics?: string[] } | null;
      
      return {
        id: conv.id,
        title: conv.title,
        summary: conv.summary,
        startedAt: conv.startedAt,
        duration: conv.duration,
        topics: metadata?.topics || [],
        messageCount: conv._count.messages,
      };
    });

    const response: ConversationListResponse = {
      conversations: conversationSummaries,
      total,
      hasMore: offset + conversations.length < total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Conversations list error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
