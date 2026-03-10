const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');

describe('Backoffice Firestore Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-backoffice-rules',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  describe('backoffice_users collection', () => {
    test('should allow superadmin to read all users', async () => {
      const superadminContext = testEnv.authenticatedContext('superadmin-uid', {
        uid: 'superadmin-uid',
        email: 'superadmin@test.com'
      });

      // Create superadmin user document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('backoffice_users').doc('superadmin-uid').set({
          uid: 'superadmin-uid',
          email: 'superadmin@test.com',
          role: 'superadmin',
          isActive: true,
          permissions: {
            analytics: { read: true, write: true, delete: true },
            promotions: { read: true, write: true, delete: true },
            collections: { read: true, write: true, delete: true },
            marketing: { read: true, write: true, delete: true },
            admin: { read: true, write: true, delete: true }
          },
          departments: ['analytics', 'promotions', 'collections', 'marketing', 'admin']
        });

        await context.firestore().collection('backoffice_users').doc('other-user').set({
          uid: 'other-user',
          email: 'other@test.com',
          role: 'viewer',
          isActive: true,
          permissions: {
            analytics: { read: true, write: false, delete: false }
          },
          departments: ['analytics']
        });
      });

      // Test superadmin can read other users
      await assertSucceeds(
        superadminContext.firestore().collection('backoffice_users').doc('other-user').get()
      );
    });

    test('should allow users to read their own document', async () => {
      const userContext = testEnv.authenticatedContext('user-uid', {
        uid: 'user-uid',
        email: 'user@test.com'
      });

      // Create user document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('backoffice_users').doc('user-uid').set({
          uid: 'user-uid',
          email: 'user@test.com',
          role: 'viewer',
          isActive: true,
          permissions: {
            analytics: { read: true, write: false, delete: false }
          },
          departments: ['analytics']
        });
      });

      // Test user can read their own document
      await assertSucceeds(
        userContext.firestore().collection('backoffice_users').doc('user-uid').get()
      );
    });

    test('should deny users from reading other users documents', async () => {
      const userContext = testEnv.authenticatedContext('user-uid', {
        uid: 'user-uid',
        email: 'user@test.com'
      });

      // Create user documents
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('backoffice_users').doc('user-uid').set({
          uid: 'user-uid',
          email: 'user@test.com',
          role: 'viewer',
          isActive: true,
          permissions: {
            analytics: { read: true, write: false, delete: false }
          },
          departments: ['analytics']
        });

        await context.firestore().collection('backoffice_users').doc('other-user').set({
          uid: 'other-user',
          email: 'other@test.com',
          role: 'editor',
          isActive: true,
          permissions: {
            promotions: { read: true, write: true, delete: false }
          },
          departments: ['promotions']
        });
      });

      // Test user cannot read other user's document
      await assertFails(
        userContext.firestore().collection('backoffice_users').doc('other-user').get()
      );
    });

    test('should deny unauthenticated access', async () => {
      const unauthenticatedContext = testEnv.unauthenticatedContext();

      await assertFails(
        unauthenticatedContext.firestore().collection('backoffice_users').doc('any-user').get()
      );
    });
  });

  describe('backoffice_invitations collection', () => {
    test('should allow superadmin to manage invitations', async () => {
      const superadminContext = testEnv.authenticatedContext('superadmin-uid', {
        uid: 'superadmin-uid',
        email: 'superadmin@test.com'
      });

      // Create superadmin user document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('backoffice_users').doc('superadmin-uid').set({
          uid: 'superadmin-uid',
          email: 'superadmin@test.com',
          role: 'superadmin',
          isActive: true,
          permissions: {
            analytics: { read: true, write: true, delete: true }
          },
          departments: ['analytics']
        });
      });

      const invitationData = {
        email: 'newuser@test.com',
        role: 'editor',
        departments: ['promotions'],
        token: 'test-token',
        status: 'pending',
        invitedBy: 'superadmin-uid',
        invitedByName: 'Super Admin',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      // Test superadmin can create invitation
      await assertSucceeds(
        superadminContext.firestore().collection('backoffice_invitations').add(invitationData)
      );
    });

    test('should deny non-superadmin from creating invitations', async () => {
      const editorContext = testEnv.authenticatedContext('editor-uid', {
        uid: 'editor-uid',
        email: 'editor@test.com'
      });

      // Create editor user document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('backoffice_users').doc('editor-uid').set({
          uid: 'editor-uid',
          email: 'editor@test.com',
          role: 'editor',
          isActive: true,
          permissions: {
            promotions: { read: true, write: true, delete: false }
          },
          departments: ['promotions']
        });
      });

      const invitationData = {
        email: 'newuser@test.com',
        role: 'viewer',
        departments: ['analytics'],
        token: 'test-token',
        status: 'pending',
        invitedBy: 'editor-uid',
        invitedByName: 'Editor',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      // Test editor cannot create invitation
      await assertFails(
        editorContext.firestore().collection('backoffice_invitations').add(invitationData)
      );
    });
  });

  describe('analytics collections', () => {
    test('should allow users with analytics read permission to read website_hits', async () => {
      const analystContext = testEnv.authenticatedContext('analyst-uid', {
        uid: 'analyst-uid',
        email: 'analyst@test.com'
      });

      // Create analyst user document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('backoffice_users').doc('analyst-uid').set({
          uid: 'analyst-uid',
          email: 'analyst@test.com',
          role: 'brand_lead',
          isActive: true,
          permissions: {
            analytics: { read: true, write: true, delete: false }
          },
          departments: ['analytics']
        });

        await context.firestore().collection('website_hits').doc('hit-1').set({
          url: '/test',
          timestamp: new Date(),
          userId: 'test-user'
        });
      });

      // Test analyst can read website hits
      await assertSucceeds(
        analystContext.firestore().collection('website_hits').doc('hit-1').get()
      );
    });

    test('should deny users without analytics permission from reading website_hits', async () => {
      const marketingContext = testEnv.authenticatedContext('marketing-uid', {
        uid: 'marketing-uid',
        email: 'marketing@test.com'
      });

      // Create marketing user document without analytics permission
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('backoffice_users').doc('marketing-uid').set({
          uid: 'marketing-uid',
          email: 'marketing@test.com',
          role: 'marketing_member',
          isActive: true,
          permissions: {
            marketing: { read: true, write: true, delete: false }
          },
          departments: ['marketing']
        });

        await context.firestore().collection('website_hits').doc('hit-1').set({
          url: '/test',
          timestamp: new Date(),
          userId: 'test-user'
        });
      });

      // Test marketing user cannot read website hits
      await assertFails(
        marketingContext.firestore().collection('website_hits').doc('hit-1').get()
      );
    });
  });
});