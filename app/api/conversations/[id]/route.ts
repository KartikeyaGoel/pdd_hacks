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
 * PATCH /api/conversations/[id]
 * 
 * Updates conversation metadata (title, duration, summary).
 * Called when a conversation ends to save session info.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getDemoUserId();
    const conversationId = params.id;

    // Parse request body
    const body = await request.json();
    const { title, duration, summary, messages } = body;

    // Verify ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, startedAt: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to update this conversation' },
        { status: 403 }
      );
    }

    // Store messages if provided
    if (messages && Array.isArray(messages) && messages.length > 0) {
      const messageData = messages.map((msg: { role: string; content: string; timestamp: string }, index: number) => ({
        conversationId,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        metadata: {},
      }));

      await prisma.conversationMessage.createMany({
        data: messageData,
        skipDuplicates: true,
      });
    }

    // Update conversation
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(title && { title }),
        ...(duration !== undefined && { duration }),
        ...(summary && { summary }),
        endedAt: new Date(),
        metadata: {
          messageCount: messages?.length || 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: updated.id,
        title: updated.title,
        duration: updated.duration,
      },
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to update conversation' },
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
