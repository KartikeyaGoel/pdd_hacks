import { NextRequest, NextResponse } from 'next/server';
import { getDemoUserId, getDemoUser } from '@/lib/demo-user';
import { prisma } from '@/lib/prisma';
import { createAgentSession, buildSystemPrompt } from '@/lib/elevenlabs';
import type { ConversationContinueResponse } from '@/lib/types';

/**
 * POST /api/conversations/[id]/continue
 * 
 * Resumes a past conversation with full context.
 * Creates a new agent session with the previous conversation's context.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get demo user (no auth required for hackathon demo)
    const userId = getDemoUserId();
    const demoUser = getDemoUser();
    const conversationId = params.id;

    // Fetch the conversation with messages
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId,
        deletedAt: null,
      },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 10, // Get last 10 messages for context
          select: {
            role: true,
            content: true,
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

    // Fetch user's recent documents for context
    const recentDocuments = await prisma.document.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        name: true,
        category: true,
      },
      orderBy: { uploadedAt: 'desc' },
      take: 5,
    });

    // Build document context
    const documentContext = recentDocuments.length > 0
      ? `User has uploaded the following materials:\n${recentDocuments.map((d: { name: string; category: string | null }) => `- ${d.name} (${d.category || 'uncategorized'})`).join('\n')}`
      : undefined;

    // Build previous context from conversation
    let previousContext = '';
    
    if (conversation.summary) {
      previousContext = `Previous session summary: ${conversation.summary}`;
    }
    
    // Add recent messages for more context
    if (conversation.messages.length > 0) {
      const recentMessages = conversation.messages
        .reverse()
        .map((m: { role: string; content: string }) => `${m.role}: ${m.content.substring(0, 200)}`)
        .join('\n');
      previousContext += `\n\nRecent conversation:\n${recentMessages}`;
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      userName: demoUser.name || 'learner',
      knowledgeLevel: 'intermediate',
      learningStyle: 'balanced',
      previousContext,
      documentContext,
    });

    // Create new agent session
    const agentSession = await createAgentSession(userId, systemPrompt, {
      conversationContext: `We're continuing our previous discussion about: ${conversation.title || 'your learning session'}`,
    });

    // Create new conversation record (continuation)
    const newConversation = await prisma.conversation.create({
      data: {
        userId,
        title: conversation.title ? `Continued: ${conversation.title}` : 'Continued Learning Session',
        metadata: {
          agentSessionId: agentSession.sessionId,
          continuedFrom: conversationId,
        },
      },
    });

    const response: ConversationContinueResponse = {
      websocket_url: agentSession.websocketUrl,
      session_id: agentSession.sessionId,
      context_summary: conversation.summary || 'Previous learning session',
      conversation_id: newConversation.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Continue conversation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to continue conversation' },
      { status: 500 }
    );
  }
}
