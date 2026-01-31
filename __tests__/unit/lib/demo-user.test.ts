import { DEMO_USER, getDemoUser, getDemoUserId } from '@/lib/demo-user';

describe('demo-user', () => {
  describe('DEMO_USER', () => {
    it('should have a valid id', () => {
      expect(DEMO_USER.id).toBe('demo-user-001');
    });

    it('should have a valid email', () => {
      expect(DEMO_USER.email).toBe('demo@montessori.ai');
    });

    it('should have a name', () => {
      expect(DEMO_USER.name).toBe('Demo User');
    });

    it('should have all required user fields', () => {
      expect(DEMO_USER).toHaveProperty('id');
      expect(DEMO_USER).toHaveProperty('email');
      expect(DEMO_USER).toHaveProperty('name');
      expect(DEMO_USER).toHaveProperty('image');
      expect(DEMO_USER).toHaveProperty('emailVerified');
      expect(DEMO_USER).toHaveProperty('createdAt');
      expect(DEMO_USER).toHaveProperty('updatedAt');
    });
  });

  describe('getDemoUser', () => {
    it('should return the demo user object', () => {
      const user = getDemoUser();
      expect(user).toEqual(DEMO_USER);
    });

    it('should return consistent user on multiple calls', () => {
      const user1 = getDemoUser();
      const user2 = getDemoUser();
      expect(user1).toEqual(user2);
    });
  });

  describe('getDemoUserId', () => {
    it('should return the demo user id', () => {
      const userId = getDemoUserId();
      expect(userId).toBe('demo-user-001');
    });

    it('should return a string', () => {
      const userId = getDemoUserId();
      expect(typeof userId).toBe('string');
    });
  });
});
