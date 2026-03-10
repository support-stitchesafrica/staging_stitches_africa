import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VvipShopperCard } from '../VvipShopperCard';
import { VvipShopper, VvipRole } from '@/types/vvip';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 days ago'),
}));

describe('VvipShopperCard', () => {
  const mockShopper: VvipShopper = {
    userId: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    country: 'Nigeria',
    isVvip: true,
    vvip_created_by: 'admin-456',
    vvip_created_at: {
      toDate: () => new Date('2024-01-01'),
      seconds: 1704067200,
    } as any,
    createdByName: 'Admin User',
  };

  const mockOnViewProfile = vi.fn();
  const mockOnRevokeVvip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render shopper information correctly', () => {
      render(
        <VvipShopperCard
          shopper={mockShopper}
          userRole="super_admin"
          onViewProfile={mockOnViewProfile}
          onRevokeVvip={mockOnRevokeVvip}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Nigeria')).toBeInTheDocument();
      expect(screen.getByText('VVIP')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('2 days ago')).toBeInTheDocument();
    });

    it('should render without creator name when not provided', () => {
      const shopperWithoutCreator = { ...mockShopper, createdByName: undefined };
      
      render(
        <VvipShopperCard
          shopper={shopperWithoutCreator}
          userRole="super_admin"
          onViewProfile={mockOnViewProfile}
          onRevokeVvip={mockOnRevokeVvip}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Created by:')).not.toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should show action buttons for super_admin', () => {
      render(
        <VvipShopperCard
          shopper={mockShopper}
          userRole="super_admin"
          onViewProfile={mockOnViewProfile}
          onRevokeVvip={mockOnRevokeVvip}
        />
      );

      expect(screen.getByText('View Profile')).toBeInTheDocument();
      expect(screen.getByText('Revoke VVIP')).toBeInTheDocument();
    });

    it('should show action buttons for bdm', () => {
      render(
        <VvipShopperCard
          shopper={mockShopper}
          userRole="bdm"
          onViewProfile={mockOnViewProfile}
          onRevokeVvip={mockOnRevokeVvip}
        />
      );

      expect(screen.getByText('View Profile')).toBeInTheDocument();
      expect(screen.getByText('Revoke VVIP')).toBeInTheDocument();
    });

    it('should hide action buttons for team_lead', () => {
      render(
        <VvipShopperCard
          shopper={mockShopper}
          userRole="team_lead"
          onViewProfile={mockOnViewProfile}
          onRevokeVvip={mockOnRevokeVvip}
        />
      );

      expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Revoke VVIP')).not.toBeInTheDocument();
    });

    it('should show read-only indicator for team_member', () => {
      render(
        <VvipShopperCard
          shopper={mockShopper}
          userRole="team_member"
          onViewProfile={mockOnViewProfile}
          onRevokeVvip={mockOnRevokeVvip}
        />
      );

      expect(screen.getByText('Read-only access')).toBeInTheDocument();
      expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Revoke VVIP')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onViewProfile when View Profile button is clicked', () => {
      render(
        <VvipShopperCard
          shopper={mockShopper}
          userRole="super_admin"
          onViewProfile={mockOnViewProfile}
          onRevokeVvip={mockOnRevokeVvip}
        />
      );

      fireEvent.click(screen.getByText('View Profile'));
      expect(mockOnViewProfile).toHaveBeenCalledWith('user-123');
    });

    it('should call onRevokeVvip when Revoke VVIP button is clicked', () => {
      render(
        <VvipShopperCard
          shopper={mockShopper}
          userRole="super_admin"
          onViewProfile={mockOnViewProfile}
          onRevokeVvip={mockOnRevokeVvip}
        />
      );

      fireEvent.click(screen.getByText('Revoke VVIP'));
      expect(mockOnRevokeVvip).toHaveBeenCalledWith('user-123');
    });

    it('should not render buttons when callbacks are not provided', () => {
      render(
        <VvipShopperCard
          shopper={mockShopper}
          userRole="super_admin"
        />
      );

      expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Revoke VVIP')).not.toBeInTheDocument();
    });
  });

  describe('Date Handling', () => {
    it('should handle Firestore Timestamp format', () => {
      const shopperWithTimestamp = {
        ...mockShopper,
        vvip_created_at: {
          seconds: 1704067200,
          toDate: undefined,
        } as any,
      };

      render(
        <VvipShopperCard
          shopper={shopperWithTimestamp}
          userRole="super_admin"
          onViewProfile={mockOnViewProfile}
          onRevokeVvip={mockOnRevokeVvip}
        />
      );

      expect(screen.getByText('2 days ago')).toBeInTheDocument();
    });

    it('should handle regular Date objects', () => {
      const shopperWithDate = {
        ...mockShopper,
        vvip_created_at: new Date('2024-01-01') as any,
      };

      render(
        <VvipShopperCard
          shopper={shopperWithDate}
          userRole="super_admin"
          onViewProfile={mockOnViewProfile}
          onRevokeVvip={mockOnRevokeVvip}
        />
      );

      expect(screen.getByText('2 days ago')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should render with minimal data', () => {
      const minimalShopper: VvipShopper = {
        userId: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        country: 'Nigeria',
        isVvip: true,
        vvip_created_by: 'admin-456',
        vvip_created_at: new Date() as any,
      };

      render(
        <VvipShopperCard
          shopper={minimalShopper}
          userRole="team_member"
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });
  });
});