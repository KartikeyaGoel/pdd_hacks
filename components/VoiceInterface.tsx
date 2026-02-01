'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { initializeAgent } from '@/lib/api-client';
import { stopAllStreams, resumeAudioContext } from '@/lib/audio-utils';

/**
 * VoiceInterface Component
 * 
 * Main conversation UI with:
 * - Large play/pause button
 * - Pulsing animation when agent speaks
 * - Mute, text input, and stop controls
 * - Live transcript display
 */
export default function VoiceInterface() {
  const [textInputMode, setTextInputMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const {
    isConversationActive,
    isMuted,
    isAgentSpeaking,
    isConnecting,
    transcript,
    conversation,
    connect,
    disconnect,
    toggleMute,
    addMessage,
    clearTranscript,
    setConnecting,
  } = useAppStore();

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Sync mute state with ElevenLabs conversation
  useEffect(() => {
    if (conversation) {
      conversation.setMicMuted(isMuted);
    }
  }, [isMuted, conversation]);

  /**
   * Start a new conversation
   */
  const handleStart = useCallback(async () => {
    setError(null);
    setConnecting(true);
    clearTranscript();

    try {
      // Resume audio context (required for some browsers)
      await resumeAudioContext();

      // Initialize agent session (microphone access is handled by the SDK)
      const session = await initializeAgent();

      // Connect using ElevenLabs SDK (handles audio streaming automatically)
      await connect(session.websocket_url, session.conversation_id, session.session_id);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      setConnecting(false);
    }
  }, [connect, clearTranscript, setConnecting]);

  /**
   * Stop the current conversation
   */
  const handleStop = useCallback(async () => {
    stopAllStreams();
    await disconnect();
    setTextInputMode(false);
    setTextInput('');
  }, [disconnect]);

  /**
   * Send a text message
   */
  const handleSendText = useCallback(() => {
    if (!textInput.trim() || !conversation) return;

    // Add user message to transcript
    addMessage({ role: 'user', content: textInput });

    // Send using ElevenLabs SDK
    conversation.sendUserMessage(textInput);

    setTextInput('');
  }, [textInput, conversation, addMessage]);

  /**
   * Handle text input key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Montessori</h1>
        <p className="text-lg text-gray-600">Your AI Learning Coach</p>
      </div>

      {/* Main Control Button */}
      <div className="mb-8">
        <button
          onClick={isConversationActive ? handleStop : handleStart}
          disabled={isConnecting}
          className={`
            w-32 h-32 rounded-full flex items-center justify-center
            text-white text-4xl font-bold
            transition-all duration-300
            ${isConnecting 
              ? 'bg-gray-400 cursor-wait' 
              : isConversationActive 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-purple-600 hover:bg-purple-700'
            }
            ${isAgentSpeaking ? 'animate-pulse shadow-lg shadow-purple-500/50' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isConnecting ? (
            <svg className="animate-spin w-12 h-12" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : isConversationActive ? (
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-12 h-12 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Status indicator */}
      <div className="mb-8 h-6">
        {isConnecting && (
          <p className="text-gray-500 animate-pulse">Connecting...</p>
        )}
        {isConversationActive && isAgentSpeaking && (
          <p className="text-purple-600 font-medium">Coach is speaking...</p>
        )}
        {isConversationActive && !isAgentSpeaking && (
          <p className="text-green-600 font-medium">Listening...</p>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-md">
          {error}
        </div>
      )}

      {/* Secondary Controls */}
      {isConversationActive && (
        <div className="flex gap-4 mb-8">
          <button
            onClick={toggleMute}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg
              transition-all duration-200
              ${isMuted 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {isMuted ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                Unmute
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Mute
              </>
            )}
          </button>

          <button
            onClick={() => setTextInputMode(!textInputMode)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg
              transition-all duration-200
              ${textInputMode 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Type
          </button>

          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop
          </button>
        </div>
      )}

      {/* Text Input */}
      {textInputMode && isConversationActive && (
        <div className="w-full max-w-lg mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleSendText}
              disabled={!textInput.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="w-full max-w-2xl bg-gray-50 rounded-xl p-6 max-h-80 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Conversation
          </h3>
          <div className="space-y-4">
            {transcript.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] px-4 py-3 rounded-2xl
                    ${message.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                    }
                  `}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-purple-200' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Instructions when not active */}
      {!isConversationActive && !isConnecting && transcript.length === 0 && (
        <div className="mt-8 text-center text-gray-500 max-w-md">
          <p className="mb-2">Press the play button to start learning.</p>
          <p className="text-sm">
            Upload your study materials first, then ask questions about them
            or explore any topic you want to learn about.
          </p>
        </div>
      )}
    </div>
  );
}
