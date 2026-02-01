'use client';

/**
 * Audio Utilities for ElevenLabs Agent Integration
 * 
 * This module handles:
 * 1. Capturing microphone input with echo cancellation
 * 2. Playing back TTS audio responses using Web Audio API
 * 3. Managing resource cleanup to prevent memory leaks
 */

// Track active resources for cleanup
let activeMediaStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let activeSourceNodes: AudioBufferSourceNode[] = [];

/**
 * Custom error class for Audio related issues to help UI components handle specific failures.
 */
export class AudioError extends Error {
  constructor(message: string, public code: 'PERMISSION_DENIED' | 'NO_DEVICE' | 'unsupported' | 'playback_error' | 'unknown') {
    super(message);
    this.name = 'AudioError';
  }
}

/**
 * Requests access to the user's microphone with optimal settings for speech.
 * 
 * @returns {Promise<MediaStream>} The raw media stream from the microphone
 * @throws {AudioError} If permission is denied or no device is found
 */
export async function getMicrophoneStream(): Promise<MediaStream> {
  if (typeof window === 'undefined' || !navigator.mediaDevices) {
    throw new AudioError('Audio capture is not supported in this environment', 'unsupported');
  }

  // Stop any existing stream before starting a new one
  if (activeMediaStream) {
    stopAllStreams();
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Request a standard sample rate, though the browser usually handles this
        sampleRate: 44100, 
        channelCount: 1
      }
    });

    activeMediaStream = stream;
    return stream;

  } catch (error: any) {
    console.error('Error accessing microphone:', error);

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new AudioError('Microphone permission denied. Please allow access to continue.', 'PERMISSION_DENIED');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      throw new AudioError('No microphone found. Please check your input devices.', 'NO_DEVICE');
    } else {
      throw new AudioError(`Could not access microphone: ${error.message}`, 'unknown');
    }
  }
}

/**
 * Initializes or retrieves the shared AudioContext.
 * Browsers require user interaction before an AudioContext can run.
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  
  // Resume context if it was suspended (common browser policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(err => console.warn('Failed to resume audio context:', err));
  }
  
  return audioContext;
}

/**
 * Decodes and plays an audio buffer (e.g., MP3, PCM) received from the agent.
 * 
 * @param {ArrayBuffer} audioData - The raw binary audio data
 * @returns {Promise<void>} Resolves when playback starts (not when it finishes)
 */
export async function playAudio(audioData: ArrayBuffer): Promise<void> {
  try {
    const ctx = getAudioContext();
    
    // Decode the audio data (works for MP3, WAV, etc.)
    // Note: decodeAudioData detaches the array buffer, so we copy it if needed elsewhere
    const decodedBuffer = await ctx.decodeAudioData(audioData.slice(0));
    
    const source = ctx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(ctx.destination);
    
    // Track the source node for cleanup
    activeSourceNodes.push(source);
    
    // Remove from tracking when playback finishes naturally
    source.onended = () => {
      activeSourceNodes = activeSourceNodes.filter(n => n !== source);
    };

    source.start(0);
    
  } catch (error) {
    console.error('Error playing audio:', error);
    throw new AudioError('Failed to decode or play audio data', 'playback_error');
  }
}

/**
 * Stops all active microphone streams and halts any currently playing audio.
 * Should be called when the conversation ends or the component unmounts.
 */
export function stopAllStreams(): void {
  // 1. Stop Microphone Input
  if (activeMediaStream) {
    activeMediaStream.getTracks().forEach(track => {
      track.stop();
    });
    activeMediaStream = null;
  }

  // 2. Stop all currently playing audio sources
  activeSourceNodes.forEach(source => {
    try {
      source.stop();
    } catch (e) {
      // Ignore errors if source already stopped
    }
  });
  activeSourceNodes = [];

  // 3. Suspend or Close AudioContext
  // We generally suspend rather than close so we can reuse it, 
  // but closing ensures full resource release.
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().then(() => {
      audioContext = null;
    }).catch(console.error);
  } else {
    audioContext = null;
  }
}

/**
 * Helper to check if the browser supports necessary audio APIs
 */
export function isAudioSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia && 
    (window.AudioContext || (window as any).webkitAudioContext)
  );
}