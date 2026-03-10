/**
 * VVIP Navigation Visibility Property Test
 * 
 * Feature: vvip-shopper-program, Property 29: Navigation Includes Role-Appropriate Items
 * Validates: Requirements 10.7
 * 
 * This test verifies that the Marketing Dashboard navigation includes
 * role-appropriate VVIP items based on user permissions.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { MarketingSidebar } from '@/components/marketing/MarketingSidebar';

// Test data generators
const userRoleArbitrary = fc.constantFrom(
  'super_admin',
  'bdm', 
  'team_lead',
  'team_member',
  'none'
);

const userDataArbitrary = fc.record({
  userRole: userRoleArbitrary,
  userName: fc.string({ minLength: 1, maxLength: 50 }),
  userEmail: fc.emailAddress(),
  userId: fc.uuid(),
  currentPath: fc.constantFrom(
    '/marketing',
    '/marketing/vvip',
    '/marketing/vvip/create',
    '/marketing/vvip/shoppers',
    '/marketing/vvip/orders',
    '/marketing/vendors',
    '/marketing/team'
  ),
});

// Expected VVIP navigation items based on role permissions
const getExpectedVvipNavItems = (role: string) => {
  const baseItems = [
    'VVIP Overview', // All roles can view overview
    'VVIP Shoppers', // All roles can view shoppers list
    'VVIP Orders'    // All roles can view orders
  ];

  // Only roles that can create VVIP should see Create VVIP
  if (['super_admin', 'bdm', 'team_lead'].includes(role)) {
    return [...baseItems, 'Create VVIP'];
  }

  return baseItems;
};

// Mock Next.js router
const mockRouter = {
  push: () => {},
  pathname: '/marketing',
};

// Mock usePathname and useRouter
vi.mock('next/navigation', () => ({
  usePathname: () => mockRouter.pathname,
  useRouter: () => mockRouter,
}));

describe('Feature: vvip-shopper-program, Property 29: Navigation Includes Role-Appropriate Items', () => {
  it('should include VVIP Overview for any marketing role', async () => {
    await fc.assert(
      fc.asyncProperty(
        userDataArbitrary.filter(data => data.userRole !== 'none'),
        async (userData) => {
          // Execute: Render sidebar with user role
          render(
            <MarketingSidebar
              userRole={userData.userRole}
              userName={userData.userName}
              userEmail={userData.userEmail}
              userId={userData.userId}
              currentPath={userData.currentPath}
            />
          );
          
          // Verify: VVIP Overview is visible for all marketing roles
          const vvipOverview = screen.getByText('VVIP Overview');
          expect(vvipOverview).toBeInTheDocument();
          
          // Verify: Link has correct href
          const vvipOverviewLink = vvipOverview.closest('a');
          expect(vvipOverviewLink).toHaveAttribute('href', '/marketing/vvip');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should include Create VVIP only for authorized roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        userDataArbitrary.filter(data => data.userRole !== 'none'),
        async (userData) => {
          // Execute: Render sidebar with user role
          render(
            <MarketingSidebar
              userRole={userData.userRole}
              userName={userData.userName}
              userEmail={userData.userEmail}
              userId={userData.userId}
              currentPath={userData.currentPath}
            />
          );
          
          // Verify: Create VVIP visibility based on role
          const authorizedRoles = ['super_admin', 'bdm', 'team_lead'];
          const createVvipElement = screen.queryByText('Create VVIP');
          
          if (authorizedRoles.includes(userData.userRole)) {
            // Should be visible for authorized roles
            expect(createVvipElement).toBeInTheDocument();
            
            // Verify: Link has correct href
            const createVvipLink = createVvipElement!.closest('a');
            expect(createVvipLink).toHaveAttribute('href', '/marketing/vvip/create');
          } else {
            // Should not be visible for team_member
            expect(createVvipElement).not.toBeInTheDocument();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should include all expected VVIP items for any marketing role', async () => {
    await fc.assert(
      fc.asyncProperty(
        userDataArbitrary.filter(data => data.userRole !== 'none'),
        async (userData) => {
          // Execute: Render sidebar with user role
          render(
            <MarketingSidebar
              userRole={userData.userRole}
              userName={userData.userName}
              userEmail={userData.userEmail}
              userId={userData.userId}
              currentPath={userData.currentPath}
            />
          );
          
          // Verify: All expected VVIP items are present
          const expectedItems = getExpectedVvipNavItems(userData.userRole);
          
          for (const expectedItem of expectedItems) {
            const element = screen.getByText(expectedItem);
            expect(element).toBeInTheDocument();
            
            // Verify: Each item is a clickable link
            const link = element.closest('a');
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href');
          }
          
          // Verify: No unexpected VVIP items are present
          const allVvipItems = ['VVIP Overview', 'Create VVIP', 'VVIP Shoppers', 'VVIP Orders'];
          const unexpectedItems = allVvipItems.filter(item => !expectedItems.includes(item));
          
          for (const unexpectedItem of unexpectedItems) {
            expect(screen.queryByText(unexpectedItem)).not.toBeInTheDocument();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should exclude VVIP navigation for non-marketing users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userName: fc.string({ minLength: 1, maxLength: 50 }),
          userEmail: fc.emailAddress(),
          userId: fc.uuid(),
          currentPath: fc.constantFrom('/marketing', '/marketing/dashboard'),
        }),
        async (userData) => {
          // Execute: Render sidebar with no role (non-marketing user)
          render(
            <MarketingSidebar
              userRole="none"
              userName={userData.userName}
              userEmail={userData.userEmail}
              userId={userData.userId}
              currentPath={userData.currentPath}
            />
          );
          
          // Verify: No VVIP navigation items are visible
          expect(screen.queryByText('VVIP Overview')).not.toBeInTheDocument();
          expect(screen.queryByText('Create VVIP')).not.toBeInTheDocument();
          expect(screen.queryByText('VVIP Shoppers')).not.toBeInTheDocument();
          expect(screen.queryByText('VVIP Orders')).not.toBeInTheDocument();
        }
      ),
      { numRuns: 20 }
    );
  });
});