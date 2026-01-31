'use client';

/**
 * Audio Utilities for Browser
 * 
 * Handles microphone access, audio playback, and stream management
 * for the voice conversation interface.
 */

// Store active streams for cleanup
let activeStreams: MediaStream[] = [];
let audioContext: AudioContext | null = null;

/**
 * Get AudioContext singleton
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Request microphone access and return MediaStream
 */
export async function getMicrophoneStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
      },
    });
    
    activeStreams.push(stream);
    return stream;
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone access denied. Please grant permission to use the microphone.');
      }
      if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone.');
      }
    }
    throw new Error('Failed to access microphone');
  }
}

/**
 * Play audio from ArrayBuffer
 */
export async function playAudioBuffer(buffer: ArrayBuffer): Promise<void> {
  const context = getAudioContext();
  
  try {
    const audioBuffer = await context.decodeAudioData(buffer);
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.start();
    
    return new Promise((resolve) => {
      source.onended = () => resolve();
    });
  } catch (error) {
    console.error('Failed to play audio:', error);
    throw new Error('Failed to play audio');
  }
}

/**
 * Play audio from Blob
 */
export async function playAudioBlob(blob: Blob): Promise<void> {
  const buffer = await blob.arrayBuffer();
  return playAudioBuffer(buffer);
}

/**
 * Play audio from URL
 */
export async function playAudioUrl(url: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    
    audio.oncanplaythrough = () => {
      audio.play();
      resolve(audio);
    };
    
    audio.onerror = () => {
      reject(new Error('Failed to load audio'));
    };
  });
}

/**
 * Stop a specific stream
 */
export function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
  activeStreams = activeStreams.filter((s) => s !== stream);
}

/**
 * Stop all active streams
 */
export function stopAllStreams(): void {
  activeStreams.forEach((stream) => {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  });
  activeStreams = [];
}

/**
 * Check if microphone permission is granted
 */
export async function checkMicrophonePermission(): Promise<PermissionState> {
  try {
    const result = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    });
    return result.state;
  } catch {
    // Fallback for browsers that don't support permission query
    return 'prompt';
  }
}

/**
 * Create audio visualizer data from MediaStream
 */
export function createAudioAnalyzer(stream: MediaStream): {
  analyser: AnalyserNode;
  getFrequencyData: () => Uint8Array;
  getVolume: () => number;
} {
  const context = getAudioContext();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  
  analyser.fftSize = 256;
  source.connect(analyser);
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  return {
    analyser,
    getFrequencyData: () => {
      analyser.getByteFrequencyData(dataArray);
      return dataArray;
    },
    getVolume: () => {
      analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      return sum / bufferLength;
    },
  };
}

/**
 * Convert audio blob to base64
 */
export async function audioToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Create MediaRecorder for recording audio
 */
export function createMediaRecorder(
  stream: MediaStream,
  onDataAvailable: (blob: Blob) => void
): MediaRecorder {
  const mimeType = MediaRecorder.isTypeSupported('audio/webm')
    ? 'audio/webm'
    : 'audio/mp4';
    
  const recorder = new MediaRecorder(stream, {
    mimeType,
    audioBitsPerSecond: 128000,
  });
  
  const chunks: Blob[] = [];
  
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };
  
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mimeType });
    onDataAvailable(blob);
  };
  
  return recorder;
}

/**
 * Resume AudioContext if suspended (required for some browsers)
 */
export async function resumeAudioContext(): Promise<void> {
  const context = getAudioContext();
  if (context.state === 'suspended') {
    await context.resume();
  }
}
