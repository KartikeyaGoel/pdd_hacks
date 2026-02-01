import { NextRequest, NextResponse } from 'next/server';
import { getDemoUser, ensureDemoUserExists } from '@/lib/demo-user';
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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET:entry',message:'Agent initialize route called',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  try {
    // Get demo user (no auth required for hackathon demo)
    const user = getDemoUser();
    const userId = user.id;

    // Ensure the demo user exists in the database
    await ensureDemoUserExists();

    // Fetch user's recent documents for context
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:prisma.document.findMany:before',message:'About to fetch documents from DB',data:{userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    let recentDocuments;
    try {
      recentDocuments = await prisma.document.findMany({
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:prisma.document.findMany:after',message:'Documents fetched successfully',data:{count:recentDocuments.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (dbError) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:prisma.document.findMany:error',message:'Database query failed',data:{error:String(dbError)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw dbError;
    }

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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:createAgentSession:before',message:'About to create ElevenLabs session',data:{userId,hasContext:!!previousContext},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    let agentSession;
    try {
      agentSession = await createAgentSession(userId, systemPrompt, {
        conversationContext: previousContext,
      });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:createAgentSession:after',message:'ElevenLabs session created',data:{sessionId:agentSession.sessionId,agentId:agentSession.agentId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (elevenlabsError) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:createAgentSession:error',message:'ElevenLabs session creation failed',data:{error:String(elevenlabsError)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw elevenlabsError;
    }

    // Create conversation record in database
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:prisma.conversation.create:before',message:'About to create conversation record',data:{userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    let conversation;
    try {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: 'New Learning Session',
          metadata: {
            agentSessionId: agentSession.sessionId,
            documentIds: recentDocuments.map((d: { name: string }) => d.name),
          },
        },
      });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:prisma.conversation.create:after',message:'Conversation record created',data:{conversationId:conversation.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (dbError) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:prisma.conversation.create:error',message:'Failed to create conversation record',data:{error:String(dbError)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw dbError;
    }

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
