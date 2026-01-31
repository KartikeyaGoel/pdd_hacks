/**
 * Mock file processing for testing
 */

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

export const mockValidateFile = jest.fn().mockReturnValue({ valid: true });

export const mockExtractText = jest.fn().mockResolvedValue(
  'This is extracted text from the document. It contains sample content for testing purposes.'
);

export const mockExtractTextFromBuffer = jest.fn().mockResolvedValue(
  'This is extracted text from buffer. Sample content for testing.'
);

export const mockGetFileMetadata = jest.fn().mockReturnValue({
  name: 'test-file.pdf',
  size: 1024,
  type: 'application/pdf',
  extension: 'pdf',
});

export const mockEstimateWordCount = jest.fn().mockReturnValue(50);

export const mockChunkText = jest.fn().mockReturnValue([
  'Chunk 1 content...',
  'Chunk 2 content...',
  'Chunk 3 content...',
]);

// Reset all mocks between tests
export function resetFileProcessingMocks() {
  mockValidateFile.mockReset().mockReturnValue({ valid: true });
  mockExtractText.mockReset().mockResolvedValue('Extracted text');
  mockExtractTextFromBuffer.mockReset().mockResolvedValue('Extracted text from buffer');
  mockGetFileMetadata.mockReset().mockReturnValue({
    name: 'test.pdf',
    size: 1024,
    type: 'application/pdf',
    extension: 'pdf',
  });
  mockEstimateWordCount.mockReset().mockReturnValue(50);
  mockChunkText.mockReset().mockReturnValue(['Chunk 1', 'Chunk 2']);
}

// Mock the file-processing module
jest.mock('@/lib/file-processing', () => ({
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
  validateFile: mockValidateFile,
  extractText: mockExtractText,
  extractTextFromBuffer: mockExtractTextFromBuffer,
  getFileMetadata: mockGetFileMetadata,
  estimateWordCount: mockEstimateWordCount,
  chunkText: mockChunkText,
}));
