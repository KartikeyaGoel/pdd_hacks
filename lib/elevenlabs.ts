import type { AgentSession, KnowledgeBaseDocument } from './types';

/**
 * ElevenLabs Client Wrapper
 * 
 * Provides type-safe interface to ElevenLabs Conversational AI platform.
 * Uses direct REST API calls for compatibility.
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// Validate agent ID is configured
if (!ELEVENLABS_AGENT_ID) {
  console.warn('⚠️ ELEVENLABS_AGENT_ID is not set in environment variables. You must create an agent in the ElevenLabs dashboard and add its ID to your .env file.');
}


/**
 * Create an agent session for voice conversation
 * Uses the ElevenLabs get-signed-url endpoint to obtain a WebSocket URL
 */
export async function createAgentSession(
  userId: string,
  systemPrompt: string,
  options?: {
    knowledgeBaseId?: string;
    voiceId?: string;
    conversationContext?: string;
  }
): Promise<AgentSession> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:createAgentSession:config',message:'ElevenLabs config',data:{agentId:ELEVENLABS_AGENT_ID,apiKeyPresent:!!ELEVENLABS_API_KEY,apiKeyLength:ELEVENLABS_API_KEY?.length||0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
  // #endregion

  // Check if agent ID is configured
  if (!ELEVENLABS_AGENT_ID) {
    throw new Error('ELEVENLABS_AGENT_ID is not configured. Please create an agent in the ElevenLabs dashboard (https://elevenlabs.io/app/conversational-ai) and add its ID to your .env file.');
  }

  // Build the URL with query parameters
  const url = new URL(`${ELEVENLABS_API_BASE}/convai/conversation/get-signed-url`);
  url.searchParams.set('agent_id', ELEVENLABS_AGENT_ID);

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:createAgentSession:request',message:'Sending request to ElevenLabs',data:{url:url.toString(),agentId:ELEVENLABS_AGENT_ID},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
  });

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:createAgentSession:response',message:'Received response from ElevenLabs',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (!response.ok) {
    const error = await response.text();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:createAgentSession:error',message:'ElevenLabs API error',data:{status:response.status,errorBody:error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C,D'})}).catch(()=>{});
    // #endregion
    console.error('ElevenLabs session creation failed:', error);
    throw new Error(`Failed to create agent session: ${response.status}`);
  }

  const data = await response.json();

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:createAgentSession:success',message:'ElevenLabs session created successfully',data:{hasSignedUrl:!!data.signed_url},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Generate a unique session ID since get-signed-url doesn't return one
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    websocketUrl: data.signed_url,
    sessionId: sessionId,
    agentId: ELEVENLABS_AGENT_ID,
  };
}

/**
 * Upload a document to ElevenLabs Knowledge Base
 */
export async function uploadToKnowledgeBase(
  userId: string,
  document: {
    name: string;
    content: string;
    category?: string;
  }
): Promise<KnowledgeBaseDocument> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:entry',message:'Starting upload to knowledge base',data:{userId,docName:document.name,contentLength:document.content?.length,category:document.category,apiKeyPresent:!!ELEVENLABS_API_KEY},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3,H4'})}).catch(()=>{});
  // #endregion

  // Create a text file from the content for multipart upload
  const fileContent = new Blob([document.content], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', fileContent, `${document.name}.txt`);
  formData.append('name', document.name);

  const uploadUrl = `${ELEVENLABS_API_BASE}/convai/knowledge-base/file`;
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:request',message:'Sending multipart request',data:{url:uploadUrl,fileName:`${document.name}.txt`,blobSize:fileContent.size},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3,H4'})}).catch(()=>{});
  // #endregion

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      // Note: Don't set Content-Type for FormData - browser sets it with boundary
    },
    body: formData,
  });

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:response',message:'Received response from ElevenLabs',data:{status:response.status,ok:response.ok,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3,H4'})}).catch(()=>{});
  // #endregion

  if (!response.ok) {
    const error = await response.text();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:error',message:'Knowledge base upload failed',data:{status:response.status,errorBody:error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3,H4'})}).catch(()=>{});
    // #endregion
    console.error('Knowledge base upload failed:', error);
    throw new Error(`Failed to upload document: ${response.status}`);
  }

  const data = await response.json();
  const documentId = data.id || data.document_id;
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:uploadSuccess',message:'Document uploaded, now triggering RAG indexing',data:{documentId,responseData:data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H8'})}).catch(()=>{});
  // #endregion

  // Step 2: Trigger RAG indexing for the document (required for large documents)
  const ragIndexUrl = `${ELEVENLABS_API_BASE}/convai/knowledge-base/${documentId}/rag-index`;
  const ragIndexResponse = await fetch(ragIndexUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      model: 'e5_mistral_7b_instruct',
    }),
  });

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:ragIndex',message:'RAG index response',data:{status:ragIndexResponse.status,ok:ragIndexResponse.ok},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H8'})}).catch(()=>{});
  // #endregion

  if (!ragIndexResponse.ok) {
    const error = await ragIndexResponse.text();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:ragIndexError',message:'RAG index failed',data:{status:ragIndexResponse.status,errorBody:error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H8'})}).catch(()=>{});
    // #endregion
    console.error('Failed to trigger RAG indexing:', error);
    // Continue anyway - RAG indexing may not be required for all documents
  } else {
    let ragData = await ragIndexResponse.json();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:ragIndexTriggered',message:'RAG indexing triggered, polling for completion',data:{status:ragData.status,progress:ragData.progress_percentage},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H8'})}).catch(()=>{});
    // #endregion
    console.log('RAG indexing triggered:', ragData.status);

    // Poll until RAG indexing completes (max 60 seconds with 3s intervals)
    const maxAttempts = 20;
    let attempts = 0;
    while (ragData.status !== 'succeeded' && ragData.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      attempts++;
      
      // Check status again
      const statusResponse = await fetch(ragIndexUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          model: 'e5_mistral_7b_instruct',
        }),
      });
      
      if (statusResponse.ok) {
        ragData = await statusResponse.json();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:ragIndexPoll',message:'RAG indexing status poll',data:{attempt:attempts,status:ragData.status,progress:ragData.progress_percentage},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H8'})}).catch(()=>{});
        // #endregion
        console.log(`RAG indexing poll ${attempts}:`, ragData.status, ragData.progress_percentage + '%');
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:ragIndexComplete',message:'RAG indexing polling complete',data:{finalStatus:ragData.status,attempts},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H8'})}).catch(()=>{});
    // #endregion
    
    if (ragData.status === 'failed') {
      console.error('RAG indexing failed');
    } else if (ragData.status !== 'succeeded') {
      console.log('RAG indexing still in progress after polling, continuing anyway...');
    }
  }

  // Step 3: Get current agent config to preserve existing knowledge base
  if (!ELEVENLABS_AGENT_ID) {
    throw new Error('ELEVENLABS_AGENT_ID is not configured');
  }

  const agentResponse = await fetch(`${ELEVENLABS_API_BASE}/convai/agents/${ELEVENLABS_AGENT_ID}`, {
    method: 'GET',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
  });

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:getAgent',message:'Fetched current agent config',data:{status:agentResponse.status,ok:agentResponse.ok},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5,H6'})}).catch(()=>{});
  // #endregion

  if (!agentResponse.ok) {
    const error = await agentResponse.text();
    console.error('Failed to get agent config:', error);
    throw new Error(`Failed to get agent config: ${agentResponse.status}`);
  }

  const agentData = await agentResponse.json();
  
  // Get existing knowledge base documents or empty array
  const existingKnowledgeBase = agentData?.conversation_config?.agent?.prompt?.knowledge_base || [];
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:existingKB',message:'Existing knowledge base',data:{existingCount:existingKnowledgeBase.length,existingIds:existingKnowledgeBase.map((d: {id?: string}) => d.id)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5,H6'})}).catch(()=>{});
  // #endregion

  // Add new document to knowledge base array with RAG mode (auto) for large documents
  const newKnowledgeBase = [
    ...existingKnowledgeBase,
    {
      type: 'file',
      name: document.name,
      id: documentId,
      usage_mode: 'auto',  // Use RAG mode - retrieves relevant chunks instead of full document in prompt
    },
  ];

  // Step 3: Update agent with new knowledge base AND enable RAG
  const updatePayload = {
    conversation_config: {
      agent: {
        prompt: {
          knowledge_base: newKnowledgeBase,
          // Enable RAG for large document support
          rag: {
            enabled: true,
            embedding_model: 'e5_mistral_7b_instruct',
            max_documents_length: 10000,
          },
        },
      },
    },
  };

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:updatePayload',message:'Agent update payload',data:{knowledgeBaseCount:newKnowledgeBase.length,ragEnabled:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H7'})}).catch(()=>{});
  // #endregion

  const updateResponse = await fetch(`${ELEVENLABS_API_BASE}/convai/agents/${ELEVENLABS_AGENT_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify(updatePayload),
  });

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:updateAgent',message:'Agent update response',data:{status:updateResponse.status,ok:updateResponse.ok},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5,H6'})}).catch(()=>{});
  // #endregion

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:updateAgentError',message:'Failed to update agent',data:{status:updateResponse.status,errorBody:error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5,H6'})}).catch(()=>{});
    // #endregion
    console.error('Failed to update agent knowledge base:', error);
    throw new Error(`Failed to link document to agent: ${updateResponse.status}`);
  }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c4452172-2c85-4856-92e7-66180298ded7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'elevenlabs.ts:uploadToKnowledgeBase:complete',message:'Document successfully linked to agent',data:{documentId,newKnowledgeBaseCount:newKnowledgeBase.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5,H6'})}).catch(()=>{});
  // #endregion

  return {
    id: documentId,
    name: document.name,
    status: 'processing',
    chunkCount: data.chunk_count,
  };
}

/**
 * Delete a document from Knowledge Base
 */
export async function deleteFromKnowledgeBase(documentId: string): Promise<void> {
  const response = await fetch(
    `${ELEVENLABS_API_BASE}/convai/knowledge-base/documents/${documentId}`,
    {
      method: 'DELETE',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Knowledge base deletion failed:', error);
    throw new Error(`Failed to delete document: ${response.status}`);
  }
}

/**
 * Get conversation history/transcript
 */
export async function getConversationHistory(conversationId: string): Promise<{
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  duration: number;
}> {
  const response = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`,
    {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch conversation:', error);
    throw new Error(`Failed to get conversation: ${response.status}`);
  }

  const data = await response.json();

  return {
    messages: data.transcript || [],
    duration: data.duration_seconds || 0,
  };
}

/**
 * Generate a conversation summary using ElevenLabs/LLM
 */
export async function generateConversationSummary(
  transcript: Array<{ role: string; content: string }>
): Promise<{ summary: string; topics: string[] }> {
  // For now, generate a simple summary
  // In production, this would call an LLM API with the full transcript
  const summary = transcript.length > 0
    ? `Discussed: ${transcript[0].content.substring(0, 100)}...`
    : 'Empty conversation';

  // Extract basic topics from content
  const allContent = transcript.map((m) => m.content).join(' ').toLowerCase();
  const topicKeywords = ['physics', 'math', 'chemistry', 'biology', 'history', 
    'programming', 'machine learning', 'ai', 'science', 'literature'];
  const topics = topicKeywords.filter((topic) => allContent.includes(topic));

  return {
    summary,
    topics: topics.length > 0 ? topics : ['general'],
  };
}

/**
 * Build system prompt for the AI coach
 */
export function buildSystemPrompt(options: {
  userName?: string;
  knowledgeLevel?: string;
  learningStyle?: string;
  previousContext?: string;
  documentContext?: string;
}): string {
  const {
    userName = 'learner',
    knowledgeLevel = 'intermediate',
    learningStyle = 'balanced',
    previousContext,
    documentContext,
  } = options;

  let prompt = `You are Montessori, an AI academic coach designed for commuters who want to learn during their travel time.

Your core traits:
- Patient and encouraging teaching style
- Adaptive explanations based on the learner's responses
- Focus on understanding over memorization
- Use analogies and real-world examples
- Keep responses concise for audio consumption (under 60 seconds when spoken)

Student Profile:
- Name: ${userName}
- Knowledge Level: ${knowledgeLevel}
- Preferred Learning Style: ${learningStyle}

Teaching Guidelines:
1. Start with a brief overview of the topic
2. Use the Socratic method - ask questions to check understanding
3. If the student seems confused, simplify and use more examples
4. Celebrate progress and correct errors gently
5. Summarize key points periodically`;

  if (previousContext) {
    prompt += `\n\nPrevious Session Context:\n${previousContext}`;
  }

  if (documentContext) {
    prompt += `\n\nRelevant Knowledge from User's Documents:\n${documentContext}`;
  }

  return prompt;
}
