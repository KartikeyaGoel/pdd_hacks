/**
 * Example usage of the Audio Utilities module.
 * 
 * This example demonstrates:
 * 1. Starting a microphone stream when a user clicks "Start".
 * 2. Simulating receiving audio data (e.g., from a WebSocket) and playing it.
 * 3. Handling errors like permission denial.
 * 4. Cleaning up resources when the component unmounts or the user clicks "Stop".
 */

import React, { useState, useEffect, useRef } from 'react';
// Adjust the import path based on where you saved the module
import { 
  getMicrophoneStream, 
  playAudio, 
  stopAllStreams, 
  AudioError 
} from './lib/audio-utils';

export default function VoiceAgentInterface() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Ref to hold the WebSocket connection (simulated here)
  const socketRef = useRef<WebSocket | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const handleStartConversation = async () => {
    setErrorMessage(null);
    setStatus('Requesting microphone access...');

    try {
      // 1. Get the microphone stream
      const stream = await getMicrophoneStream();
      
      setIsListening(true);
      setStatus('Listening...');

      // 2. Initialize WebSocket (Simulated)
      // In a real app, you would send the stream data to your backend here
      // e.g., using a MediaRecorder or AudioWorklet
      console.log('Microphone stream active:', stream.id);
      
      // Simulate receiving an audio response after 2 seconds
      setTimeout(() => {
        simulateIncomingAudio();
      }, 2000);

    } catch (error) {
      setIsListening(false);
      setStatus('Error');
      
      if (error instanceof AudioError) {
        if (error.code === 'PERMISSION_DENIED') {
          setErrorMessage('Please allow microphone access to use the voice agent.');
        } else if (error.code === 'NO_DEVICE') {
          setErrorMessage('No microphone detected.');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    }
  };

  const handleStopConversation = () => {
    // 3. Clean up all audio resources
    stopAllStreams();
    setIsListening(false);
    setStatus('Stopped');
  };

  // Helper to simulate fetching an audio file and playing it
  const simulateIncomingAudio = async () => {
    try {
      setStatus('Agent speaking...');
      
      // Fetch a sample audio file (e.g., a short beep or speech sample)
      // In a real app, this ArrayBuffer comes from your WebSocket message
      const response = await fetch('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      const arrayBuffer = await response.arrayBuffer();

      // 4. Play the audio buffer
      await playAudio(arrayBuffer);
      
      // Reset status after a short delay (simulating end of speech)
      setTimeout(() => setStatus('Listening...'), 1000);
      
    } catch (err) {
      console.error('Failed to play simulation audio', err);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Voice Agent</h2>
      
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <p className="font-mono text-sm">Status: {status}</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-4">
        {!isListening ? (
          <button
            onClick={handleStartConversation}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Conversation
          </button>
        ) : (
          <button
            onClick={handleStopConversation}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Stop Conversation
          </button>
        )}
      </div>
    </div>
  );
}