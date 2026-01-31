import pdf from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * File Processing Utilities
 * 
 * Handles text extraction from various document formats:
 * - PDF: using pdf-parse
 * - DOCX: using mammoth
 * - TXT/MD: direct read
 * - Images: OCR via Tesseract.js (client-side only)
 */

// Supported file types and their MIME types
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type SupportedMimeType = keyof typeof SUPPORTED_FILE_TYPES;

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  const mimeType = file.type as SupportedMimeType;
  if (!SUPPORTED_FILE_TYPES[mimeType]) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, TXT, MD, PNG, JPG`,
    };
  }

  return { valid: true };
}

/**
 * Extract text from a file based on its type
 */
export async function extractText(file: File): Promise<string> {
  const mimeType = file.type as SupportedMimeType;
  const fileType = SUPPORTED_FILE_TYPES[mimeType];

  if (!fileType) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  switch (fileType) {
    case 'pdf':
      return extractFromPdf(file);
    case 'docx':
      return extractFromDocx(file);
    case 'txt':
    case 'md':
      return extractFromText(file);
    case 'png':
    case 'jpg':
      // OCR is handled client-side due to Tesseract.js requirements
      throw new Error('Image OCR must be processed client-side');
    default:
      throw new Error(`No extractor for file type: ${fileType}`);
  }
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  try {
    const data = await pdf(buffer);
    return data.text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

/**
 * Extract text from plain text files
 */
async function extractFromText(file: File): Promise<string> {
  try {
    const text = await file.text();
    return text.trim();
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to read text file');
  }
}

/**
 * Extract text from buffer (for server-side processing)
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const fileType = SUPPORTED_FILE_TYPES[mimeType as SupportedMimeType];

  if (!fileType) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  switch (fileType) {
    case 'pdf': {
      const data = await pdf(buffer);
      return data.text.trim();
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }
    case 'txt':
    case 'md':
      return buffer.toString('utf-8').trim();
    case 'png':
    case 'jpg':
      throw new Error('Image OCR must be processed client-side');
    default:
      throw new Error(`No extractor for file type: ${fileType}`);
  }
}

/**
 * Get file metadata
 */
export function getFileMetadata(file: File): {
  name: string;
  size: number;
  type: string;
  extension: string;
} {
  const nameParts = file.name.split('.');
  const extension = nameParts.length > 1 ? nameParts.pop()! : '';

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    extension: extension.toLowerCase(),
  };
}

/**
 * Estimate word count from text
 */
export function estimateWordCount(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Chunk text for knowledge base indexing
 */
export function chunkText(
  text: string,
  options: {
    chunkSize?: number;
    overlap?: number;
  } = {}
): string[] {
  const { chunkSize = 512, overlap = 50 } = options;
  
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk);
    }
  }
  
  return chunks;
}
