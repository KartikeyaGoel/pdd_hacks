// Jest setup file
// Runs before each test file

// Set up environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/montessori_test';
process.env.ELEVENLABS_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

// Mock console.error to reduce noise in tests (optional)
// const originalError = console.error;
// console.error = (...args) => {
//   if (args[0]?.includes?.('Warning:')) return;
//   originalError.apply(console, args);
// };

// Global test timeout
jest.setTimeout(10000);
