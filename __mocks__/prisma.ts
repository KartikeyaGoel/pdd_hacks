/**
 * Mock Prisma Client for testing
 */

export const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  conversation: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  conversationMessage: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
  },
  document: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Reset all mocks between tests
export function resetPrismaMocks() {
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as jest.Mock).mockReset();
        }
      });
    }
  });
}

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient,
  default: mockPrismaClient,
}));

export default mockPrismaClient;
