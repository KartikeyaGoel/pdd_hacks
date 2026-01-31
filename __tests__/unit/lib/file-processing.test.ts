import {
  validateFile,
  extractTextFromBuffer,
  getFileMetadata,
  estimateWordCount,
  chunkText,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/file-processing';

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({
    text: 'Extracted PDF text content for testing purposes.',
  });
});

// Mock mammoth
jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({
    value: 'Extracted DOCX text content for testing purposes.',
  }),
}));

describe('file-processing', () => {
  describe('SUPPORTED_FILE_TYPES', () => {
    it('should support PDF files', () => {
      expect(SUPPORTED_FILE_TYPES['application/pdf']).toBe('pdf');
    });

    it('should support DOCX files', () => {
      expect(
        SUPPORTED_FILE_TYPES[
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      ).toBe('docx');
    });

    it('should support TXT files', () => {
      expect(SUPPORTED_FILE_TYPES['text/plain']).toBe('txt');
    });

    it('should support MD files', () => {
      expect(SUPPORTED_FILE_TYPES['text/markdown']).toBe('md');
    });

    it('should support PNG images', () => {
      expect(SUPPORTED_FILE_TYPES['image/png']).toBe('png');
    });

    it('should support JPEG images', () => {
      expect(SUPPORTED_FILE_TYPES['image/jpeg']).toBe('jpg');
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('should be 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe('validateFile', () => {
    it('should accept valid PDF file', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject oversized files', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1 });
      
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('size');
    });

    it('should reject unsupported file types', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported');
    });
  });

  describe('extractTextFromBuffer', () => {
    it('should extract text from PDF buffer', async () => {
      const buffer = Buffer.from('PDF content');
      const text = await extractTextFromBuffer(buffer, 'application/pdf');
      expect(text).toContain('Extracted PDF text');
    });

    it('should extract text from DOCX buffer', async () => {
      const buffer = Buffer.from('DOCX content');
      const text = await extractTextFromBuffer(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(text).toContain('Extracted DOCX text');
    });

    it('should extract text from TXT buffer', async () => {
      const textContent = 'Plain text content for testing';
      const buffer = Buffer.from(textContent);
      const text = await extractTextFromBuffer(buffer, 'text/plain');
      expect(text).toBe(textContent);
    });

    it('should throw for image files', async () => {
      const buffer = Buffer.from('image data');
      await expect(
        extractTextFromBuffer(buffer, 'image/png')
      ).rejects.toThrow('OCR');
    });

    it('should throw for unsupported file types', async () => {
      const buffer = Buffer.from('data');
      await expect(
        extractTextFromBuffer(buffer, 'application/x-unknown')
      ).rejects.toThrow('Unsupported');
    });
  });

  describe('estimateWordCount', () => {
    it('should count words correctly', () => {
      const text = 'This is a test sentence with seven words.';
      const count = estimateWordCount(text);
      expect(count).toBe(8);
    });

    it('should handle empty string', () => {
      const count = estimateWordCount('');
      expect(count).toBe(0);
    });

    it('should handle multiple spaces', () => {
      const text = 'Word1    Word2     Word3';
      const count = estimateWordCount(text);
      expect(count).toBe(3);
    });
  });

  describe('chunkText', () => {
    it('should split text into chunks', () => {
      const words = Array(100).fill('word').join(' ');
      const chunks = chunkText(words, { chunkSize: 50, overlap: 10 });
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should use default options', () => {
      const words = Array(1000).fill('word').join(' ');
      const chunks = chunkText(words);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should handle short text', () => {
      const text = 'Short text';
      const chunks = chunkText(text);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(text);
    });
  });
});
