/**
 * Example Usage of ElevenLabs Integration Module
 * 
 * This example demonstrates how to use the ElevenLabs wrapper in a typical
 * server-side context (e.g., a Next.js API route or Node.js service).
 * 
 * It covers:
 * 1. Starting a conversational AI session
 * 2. Uploading knowledge base documents
 * 3. Retrieving conversation history
 * 4. Handling errors gracefully
 */

import { 
  createAgentSession, 
  uploadToKnowledgeBase, 
  getConversationHistory,
  getConversationDetails,
  ElevenLabsError,
  type DocumentInput
} from './lib/elevenlabs'; // Adjust path to where you saved the module

// Mock user and agent IDs for demonstration
const MOCK_USER_ID = 'user_12345';
const AGENT_ID = 'eleven_turbo_v2_agent_id'; 

async function main() {
  console.log('--- ElevenLabs Integration Demo ---\n');

  try {
    // 1. Start a Conversational Session
    // This is typically called when the frontend requests to start a voice chat.
    console.log('1. Creating Agent Session...');
    
    const session = await createAgentSession(MOCK_USER_ID, AGENT_ID);
    
    console.log('✅ Session Created:');
    console.log(`   Session ID: ${session.session_id}`);
    console.log(`   WebSocket URL: ${session.websocket_url.substring(0, 50)}...`); // Truncated for display
    console.log('   (Send this URL to the frontend to connect via WebSocket)\n');


    // 2. Upload a Document to Knowledge Base
    // This allows the agent to answer questions based on specific text.
    console.log('2. Uploading Document to Knowledge Base...');
    
    const docInput: DocumentInput = {
      name: 'Product Manual v1.0',
      category: 'technical_docs',
      content: `
        The SuperWidget 3000 has three modes: Eco, Turbo, and Sleep.
        To reset the device, hold the power button for 10 seconds.
        Battery life is approximately 24 hours on Eco mode.
      `
    };

    const docResult = await uploadToKnowledgeBase(MOCK_USER_ID, docInput);
    
    console.log('✅ Document Uploaded:');
    console.log(`   Document ID: ${docResult.document_id}`);
    console.log(`   Status: ${docResult.status}\n`);


    // 3. Retrieve Conversation History
    // Fetch past interactions for this user/agent combo.
    console.log('3. Fetching Conversation History...');
    
    const history = await getConversationHistory(MOCK_USER_ID, AGENT_ID);
    
    console.log(`✅ Found ${history.length} conversations.`);
    
    if (history.length > 0) {
      const lastConv = history[0];
      console.log(`   Latest Conversation ID: ${lastConv.conversation_id}`);
      console.log(`   Duration: ${lastConv.duration_secs}s`);
      console.log(`   Status: ${lastConv.status}`);

      // 4. Get Full Transcript for the latest conversation
      console.log('\n4. Fetching Full Transcript...');
      const details = await getConversationDetails(lastConv.conversation_id);
      
      if (details.transcript && details.transcript.length > 0) {
        console.log('   Transcript Snippet:');
        details.transcript.slice(0, 3).forEach(entry => {
          console.log(`     [${entry.role}]: ${entry.message}`);
        });
      } else {
        console.log('   No transcript available yet.');
      }
    } else {
      console.log('   No history found (this is expected for a fresh agent).');
    }

  } catch (error) {
    // Robust Error Handling
    if (error instanceof ElevenLabsError) {
      console.error('❌ ElevenLabs Integration Error:', error.message);
      if (error.originalError) {
        console.error('   Original API Error:', error.originalError);
      }
    } else {
      console.error('❌ Unexpected System Error:', error);
    }
  }
}

// Run the example
// Ensure ELEVENLABS_API_KEY is set in your environment before running
if (process.env.ELEVENLABS_API_KEY) {
  main();
} else {
  console.error('Please set ELEVENLABS_API_KEY environment variable to run this example.');
}