import { NextRequest, NextResponse } from 'next/server';
import { getDemoUser } from '@/lib/demo-user';
import { prisma } from '@/lib/prisma';
import { createAgentSession, buildSystemPrompt } from '@/lib/elevenlabs';
import type { AgentInitializeResponse } from '@/lib/types';

/**
 * GET /api/agent/initialize
 * 
 * Creates a new ElevenLabs agent session with personalized system prompt.
 * Returns WebSocket URL for real-time voice conversation.
 */
export async function GET(request: NextRequest) {
  try {
    // Get demo user (no auth required for hackathon demo)
    const user = getDemoUser();
    const userId = user.id;

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

    // Build document context for system prompt
    const documentContext = recentDocuments.length > 0
      ? `User has uploaded the following materials:\n${recentDocuments.map((d: { name: string; category: string | null }) => `- ${d.name} (${d.category || 'uncategorized'})`).join('\n')}`
      : undefined;

    // Check for conversation to continue (from query param)
    const searchParams = request.nextUrl.searchParams;
    const continueConversationId = searchParams.get('conversationId');
    let previousContext: string | undefined;

    if (continueConversationId) {
      const prevConversation = await prisma.conversation.findUnique({
        where: { id: continueConversationId, userId },
        select: { summary: true, title: true },
      });
      
      if (prevConversation?.summary) {
        previousContext = `Previously discussed: ${prevConversation.title || 'Learning session'}. ${prevConversation.summary}`;
      }
    }

    // Build personalized system prompt
    const systemPrompt = buildSystemPrompt({
      userName: user.name || 'learner',
      knowledgeLevel: 'intermediate', // Could be stored in user profile
      learningStyle: 'balanced', // Could be stored in user profile
      previousContext,
      documentContext,
    });

    // Create ElevenLabs agent session
    const agentSession = await createAgentSession(userId, systemPrompt, {
      conversationContext: previousContext,
    });

    // Create conversation record in database
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: 'New Learning Session',
        metadata: {
          agentSessionId: agentSession.sessionId,
          documentIds: recentDocuments.map((d: { name: string }) => d.name),
        },
      },
    });

    // Build response
    const response: AgentInitializeResponse = {
      websocket_url: agentSession.websocketUrl,
      session_id: agentSession.sessionId,
      agent_id: agentSession.agentId,
      conversation_id: conversation.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Agent initialization error:', error);
    
    return NextResponse.json(
      { error: 'Failed to initialize agent session' },
      { status: 500 }
    );
  }
}
