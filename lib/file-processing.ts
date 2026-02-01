import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

// Types
export type ValidationResult = {
  valid: boolean;
  error?: string;
};

/**
 * Validates a file based on size and MIME type.
 * @param file The File object to validate
 * @returns ValidationResult object indicating success or failure reason
 */
export function validateFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, TXT, MD, PNG, JPG.`,
    };
  }

  return { valid: true };
}

/**
 * Main entry point to extract text from various file formats.
 * Routes to specific handlers based on MIME type.
 * @param file The File object to process
 * @returns Promise resolving to the extracted and cleaned text string
 */
export async function extractText(file: File): Promise<string> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = '';

    switch (file.type) {
      case 'application/pdf':
        rawText = await processPdf(buffer);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        rawText = await processDocx(buffer);
        break;
      case 'text/plain':
      case 'text/markdown':
        rawText = processTextFile(buffer);
        break;
      case 'image/png':
      case 'image/jpeg':
      case 'image/jpg':
        rawText = await processImage(buffer);
        break;
      default:
        // This should be caught by validateFile, but as a safety net:
        throw new Error(`Unhandled file type: ${file.type}`);
    }

    return cleanText(rawText);
  } catch (error) {
    console.error(`Error processing file ${file.name}:`, error);
    throw new Error(`Failed to extract text from ${file.name}: ${(error as Error).message}`);
  }
}

// --- Format Specific Handlers ---

async function processPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('PDF parsing failed. The file might be corrupted or password protected.');
  }
}

async function processDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (result.messages.length > 0) {
      console.warn('Mammoth warnings:', result.messages);
    }
    return result.value;
  } catch (error) {
    throw new Error('DOCX parsing failed. Ensure the file is a valid Word document.');
  }
}

function processTextFile(buffer: Buffer): string {
  try {
    // Assuming UTF-8 encoding for text and markdown files
    return buffer.toString('utf-8');
  } catch (error) {
    throw new Error('Text decoding failed.');
  }
}

async function processImage(buffer: Buffer): Promise<string> {
  try {
    const worker = await createWorker('eng');
    const ret = await worker.recognize(buffer);
    await worker.terminate();
    return ret.data.text;
  } catch (error) {
    throw new Error('OCR processing failed. Ensure the image is clear and contains readable text.');
  }
}

// --- Utilities ---

/**
 * Normalizes text for knowledge base indexing.
 * - Removes excessive whitespace
 * - Normalizes line breaks
 * - Trims output
 */
function cleanText(text: string): string {
  if (!text) return '';
  
  return text
    // Replace multiple spaces/tabs with a single space
    .replace(/[ \t]+/g, ' ')
    // Replace multiple newlines with a double newline (paragraph break)
    .replace(/\n\s*\n/g, '\n\n')
    // Remove control characters except newlines
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
    .trim();
}