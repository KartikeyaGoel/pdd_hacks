'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { initializeAgent } from '@/lib/api-client';
import { getMicrophoneStream, stopAllStreams, resumeAudioContext } from '@/lib/audio-utils';

/**
 * Waveform Bar Heights for animation
 * These create a dynamic audio visualization effect
 */
const WAVEFORM_PATTERNS = {
  idle: [20, 28, 24, 28, 20],
  listening: [24, 32, 28, 32, 24],
  speaking: [
    [16, 40, 32, 48, 24],
    [24, 48, 40, 32, 36],
    [32, 24, 48, 40, 28],
    [40, 32, 24, 48, 32],
    [28, 40, 36, 24, 40],
  ],
};

/**
 * VoiceInterface Component
 * 
 * Main conversation UI with:
 * - Animated waveform button with state-based colors
 * - Glow effects that pulse with activity
 * - Dark mode styling throughout
 * - Live transcript display
 */
export default function VoiceInterface() {
  const [textInputMode, setTextInputMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [speakingFrame, setSpeakingFrame] = useState(0);
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

  // Animate waveform when agent is speaking
  useEffect(() => {
    if (isAgentSpeaking) {
      const interval = setInterval(() => {
        setSpeakingFrame((prev) => (prev + 1) % WAVEFORM_PATTERNS.speaking.length);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setSpeakingFrame(0);
    }
  }, [isAgentSpeaking]);

  /**
   * Get current waveform heights based on state
   */
  const getWaveformHeights = () => {
    if (isConnecting) return WAVEFORM_PATTERNS.idle;
    if (isAgentSpeaking) return WAVEFORM_PATTERNS.speaking[speakingFrame];
    if (isConversationActive) return WAVEFORM_PATTERNS.listening;
    return WAVEFORM_PATTERNS.idle;
  };

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

      // Get microphone access first
      await getMicrophoneStream();

      // Initialize agent session
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

  const waveformHeights = getWaveformHeights();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-primary mb-3">
          <span className="text-gradient">Montessori</span>
        </h1>
        <p className="text-lg text-text-secondary">Your AI Learning Coach</p>
      </div>

      {/* Main Waveform Button */}
      <div className="mb-8 relative">
        {/* Main button */}
        <button
          onClick={isConversationActive ? handleStop : handleStart}
          disabled={isConnecting}
          className={`
            relative w-40 h-40 rounded-full flex items-center justify-center
            ${isConnecting 
              ? 'bg-surface-elevated cursor-wait border-2 border-text-muted/30' 
              : isConversationActive 
                ? isAgentSpeaking
                  ? 'bg-coral/10 border-2 border-coral/50'
                  : 'bg-mint/10 border-2 border-mint/50'
                : 'bg-surface-elevated border-2 border-mint/30 hover:border-mint/50'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isConnecting ? (
            /* Connecting spinner */
            <div className="relative">
              <svg className="animate-spin w-12 h-12 text-mint" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : isConversationActive ? (
            /* Waveform visualization */
            <div className="flex items-center justify-center gap-1.5">
              {waveformHeights.map((height, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-full ${isAgentSpeaking ? 'bg-coral' : 'bg-mint'}`}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
          ) : (
            /* Idle state - waveform preview */
            <div className="flex items-center justify-center gap-1.5">
              {waveformHeights.map((height, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full bg-mint/60"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
          )}
        </button>
      </div>

      {/* Status indicator */}
      <div className="mb-8 h-8 flex items-center justify-center">
        {isConnecting && (
          <p className="text-text-secondary flex items-center gap-2">
            <span className="w-2 h-2 bg-mint rounded-full" />
            Connecting...
          </p>
        )}
        {isConversationActive && isAgentSpeaking && (
          <p className="text-coral font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-coral rounded-full" />
            Coach is speaking...
          </p>
        )}
        {isConversationActive && !isAgentSpeaking && (
          <p className="text-mint font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-mint rounded-full" />
            Listening...
          </p>
        )}
        {!isConversationActive && !isConnecting && (
          <p className="text-text-muted">Tap to start learning</p>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-coral/10 border border-coral/30 rounded-xl text-coral max-w-md">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Secondary Controls */}
      {isConversationActive && (
        <div className="flex gap-3 mb-8">
          <button
            onClick={toggleMute}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
              ${isMuted 
                ? 'bg-coral/20 text-coral border border-coral/30' 
                : 'bg-surface-elevated text-text-primary border border-white/10 hover:bg-white/10'
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
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
              ${textInputMode 
                ? 'bg-mint/20 text-mint border border-mint/30' 
                : 'bg-surface-elevated text-text-primary border border-white/10 hover:bg-white/10'
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coral/20 text-coral border border-coral/30 font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
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
              className="input-field flex-1"
              autoFocus
            />
            <button
              onClick={handleSendText}
              disabled={!textInput.trim()}
              className="px-6 py-3 bg-mint text-background rounded-xl font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="w-full max-w-2xl bg-surface rounded-2xl p-6 max-h-80 overflow-y-auto border border-white/10">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
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
                      ? 'bg-mint/20 text-text-primary rounded-br-md border border-mint/20'
                      : 'bg-surface-elevated text-text-primary rounded-bl-md border border-white/10'
                    }
                  `}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1.5 ${message.role === 'user' ? 'text-mint/60' : 'text-text-muted'}`}>
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
        <div className="mt-8 text-center text-text-secondary max-w-md">
          <p className="mb-3">Press the button to start learning.</p>
          <p className="text-sm text-text-muted">
            Upload your study materials first, then ask questions about them
            or explore any topic you want to learn about.
          </p>
        </div>
      )}
    </div>
  );
}
