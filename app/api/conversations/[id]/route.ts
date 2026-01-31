import { NextRequest, NextResponse } from 'next/server';
import { getDemoUserId } from '@/lib/demo-user';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/conversations/[id]
 * 
 * Fetches a specific conversation with its messages.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get demo user ID (no auth required for hackathon demo)
    const userId = getDemoUserId();
    const conversationId = params.id;

    // Fetch conversation with messages
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId,
        deletedAt: null,
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            timestamp: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          summary: conversation.summary,
          startedAt: conversation.startedAt,
          endedAt: conversation.endedAt,
          duration: conversation.duration,
        },
        messages: conversation.messages,
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]
 * 
 * Soft deletes a conversation.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get demo user ID (no auth required for hackathon demo)
    const userId = getDemoUserId();
    const conversationId = params.id;

    // Verify ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this conversation' },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
