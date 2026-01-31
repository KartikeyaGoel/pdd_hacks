import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateConversationSummary } from '@/lib/elevenlabs';
import type { ElevenLabsWebhookPayload } from '@/lib/types';

/**
 * POST /api/webhook/conversation-end
 * 
 * Handles conversation completion webhook from ElevenLabs.
 * Generates summary, extracts topics, and updates the conversation record.
 */
export async function POST(request: NextRequest) {
  try {
    // Validate webhook (in production, verify signature)
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.WEBHOOK_SECRET || process.env.ELEVENLABS_API_KEY;
    
    if (apiKey !== expectedKey) {
      console.warn('Invalid webhook signature');
      // In production, return 401. For development, continue.
    }

    // Parse webhook payload
    const payload: ElevenLabsWebhookPayload = await request.json();

    const {
      conversation_id,
      user_id,
      transcript,
      duration_seconds,
    } = payload;

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'Missing conversation_id' },
        { status: 400 }
      );
    }

    // Find conversation by ElevenLabs session ID or our conversation ID
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { id: conversation_id },
          { 
            metadata: {
              path: ['agentSessionId'],
              equals: conversation_id,
            },
          },
        ],
      },
    });

    if (!conversation) {
      console.warn(`Conversation not found: ${conversation_id}`);
      // Create a placeholder if not found (edge case)
      if (user_id) {
        conversation = await prisma.conversation.create({
          data: {
            userId: user_id,
            title: 'Learning Session',
            metadata: {
              agentSessionId: conversation_id,
              createdFromWebhook: true,
            },
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Conversation not found and no user_id provided' },
          { status: 404 }
        );
      }
    }

    // Generate summary from transcript
    let summary = '';
    let topics: string[] = [];

    if (transcript && transcript.length > 0) {
      const summaryResult = await generateConversationSummary(
        transcript.map(m => ({ role: m.role, content: m.content }))
      );
      summary = summaryResult.summary;
      topics = summaryResult.topics;

      // Store messages
      const messageData = transcript.map((msg, index) => ({
        conversationId: conversation!.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(Date.now() - (transcript.length - index) * 1000),
        metadata: {},
      }));

      await prisma.conversationMessage.createMany({
        data: messageData,
      });
    }

    // Extract title from first user message or summary
    let title = conversation.title;
    if (!title || title === 'New Learning Session') {
      if (transcript && transcript.length > 0) {
        const firstUserMessage = transcript.find(m => m.role === 'user');
        if (firstUserMessage) {
          // Use first 50 chars of first user message as title
          title = firstUserMessage.content.substring(0, 50);
          if (firstUserMessage.content.length > 50) {
            title += '...';
          }
        }
      }
    }

    // Update conversation with summary and metadata
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        title,
        summary,
        endedAt: new Date(),
        duration: duration_seconds || null,
        metadata: {
          ...(conversation.metadata as object || {}),
          topics,
          messageCount: transcript?.length || 0,
        },
      },
    });

    // Log for debugging
    console.log(`Conversation ended: ${conversation.id}`);
    console.log(`Summary: ${summary}`);
    console.log(`Topics: ${topics.join(', ')}`);

    return NextResponse.json({
      success: true,
      conversation_id: conversation.id,
      summary,
      topics,
    });
  } catch (error) {
    console.error('Webhook conversation-end error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
