import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VvipOrderCard } from '../VvipOrderCard';
import { VvipOrder } from '@/types/vvip';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 days ago'),
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM dd, yyyy') return 'Jan 01, 2024';
    if (formatStr === 'MMM dd, yyyy HH:mm') return 'Jan 01, 2024 10:00';
    return 'Jan 01, 2024';
  }),
}));

describe('VvipOrderCard', () => {
  const mockOrder: VvipOrder = {
    orderId: 'order-123456789',
    userId: 'user-123',
    payment_method: 'manual_transfer',
    isVvip: true,
    payment_status: 'pending_verification',
    payment_proof_url: 'https://example.com/proof.jpg',
    amount_paid: 15000,
    payment_reference: 'REF123456',
    payment_date: {
      toDate: () => new Date('2024-01-01'),
      seconds: 1704067200,
    } as any,
    order_status: 'pending',
    admin_note: 'Test admin note',
    created_at: {
      toDate: () => new Date('2024-01-01'),
      seconds: 1704067200,
    } as any,
    user_name: 'John Doe',
    user_email: 'john.doe@example.com',
    total: 15000,
  };

  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();
  const mockOnViewProof = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render order information correctly', () => {
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByText('Order #23456789')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('$15,000')).toBeInTheDocument();
      expect(screen.getByText('REF123456')).toBeInTheDocument();
      expect(screen.getAllByText('Jan 01, 2024')[0]).toBeInTheDocument();
    });

    it('should render with user email when name is not available', () => {
      const orderWithoutName = { ...mockOrder, user_name: undefined };
      
      render(
        <VvipOrderCard
          order={orderWithoutName}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('should render without payment reference when not provided', () => {
      const orderWithoutRef = { ...mockOrder, payment_reference: undefined };
      
      render(
        <VvipOrderCard
          order={orderWithoutRef}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.queryByText('Reference:')).not.toBeInTheDocument();
    });
  });

  describe('Payment Status Display', () => {
    it('should show pending verification status correctly', () => {
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByText('pending verification')).toBeInTheDocument();
    });

    it('should show approved status correctly', () => {
      const approvedOrder = { ...mockOrder, payment_status: 'approved' as const };
      
      render(
        <VvipOrderCard
          order={approvedOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByText('approved')).toBeInTheDocument();
    });

    it('should show rejected status correctly', () => {
      const rejectedOrder = { ...mockOrder, payment_status: 'rejected' as const };
      
      render(
        <VvipOrderCard
          order={rejectedOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByText('rejected')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should show action buttons for super_admin with pending verification', () => {
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByText('Approve Payment')).toBeInTheDocument();
      expect(screen.getByText('Reject Payment')).toBeInTheDocument();
    });

    it('should show action buttons for bdm with pending verification', () => {
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="bdm"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByText('Approve Payment')).toBeInTheDocument();
      expect(screen.getByText('Reject Payment')).toBeInTheDocument();
    });

    it('should hide action buttons for team_lead', () => {
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="team_lead"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.queryByText('Approve Payment')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject Payment')).not.toBeInTheDocument();
    });

    it('should show read-only indicator for team_member', () => {
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="team_member"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByText('Read-only access')).toBeInTheDocument();
      expect(screen.queryByText('Approve Payment')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject Payment')).not.toBeInTheDocument();
    });

    it('should hide action buttons for approved orders', () => {
      const approvedOrder = { ...mockOrder, payment_status: 'approved' as const };
      
      render(
        <VvipOrderCard
          order={approvedOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.queryByText('Approve Payment')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject Payment')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onApprove when Approve Payment button is clicked', async () => {
      mockOnApprove.mockResolvedValue(undefined);
      
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      fireEvent.click(screen.getByText('Approve Payment'));
      
      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalledWith('order-123456789', 'Test admin note');
      });
    });

    it('should call onReject when Reject Payment button is clicked', async () => {
      mockOnReject.mockResolvedValue(undefined);
      
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      fireEvent.click(screen.getByText('Reject Payment'));
      
      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalledWith('order-123456789', 'Test admin note');
      });
    });

    it('should call onViewProof when View Proof button is clicked', () => {
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      fireEvent.click(screen.getByText('View Proof'));
      expect(mockOnViewProof).toHaveBeenCalledWith('https://example.com/proof.jpg');
    });

    it('should disable reject button when admin note is empty', () => {
      const orderWithoutNote = { ...mockOrder, admin_note: undefined };
      
      render(
        <VvipOrderCard
          order={orderWithoutNote}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      const rejectButton = screen.getByText('Reject Payment');
      expect(rejectButton).toBeDisabled();
    });

    it('should update admin note when textarea is changed', () => {
      const orderWithoutNote = { ...mockOrder, admin_note: undefined };
      
      render(
        <VvipOrderCard
          order={orderWithoutNote}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      const textarea = screen.getByPlaceholderText('Add a note about this payment verification...');
      fireEvent.change(textarea, { target: { value: 'New admin note' } });
      
      expect(textarea).toHaveValue('New admin note');
    });
  });

  describe('Admin Note Display', () => {
    it('should show editable admin note for authorized users', () => {
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByDisplayValue('Test admin note')).toBeInTheDocument();
    });

    it('should show read-only admin note for unauthorized users', () => {
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="team_member"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByText('Test admin note')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Test admin note')).not.toBeInTheDocument();
    });
  });

  describe('Verification Info Display', () => {
    it('should show verification info when available', () => {
      const verifiedOrder = {
        ...mockOrder,
        payment_verified_by: 'admin@example.com',
        payment_verified_at: {
          toDate: () => new Date('2024-01-01T10:00:00Z'),
          seconds: 1704067200,
        } as any,
      };
      
      render(
        <VvipOrderCard
          order={verifiedOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getByText(/Verified by admin@example.com on/)).toBeInTheDocument();
    });

    it('should not show verification info when not available', () => {
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.queryByText(/Verified by/)).not.toBeInTheDocument();
    });
  });

  describe('Date Handling', () => {
    it('should handle Firestore Timestamp format', () => {
      const orderWithTimestamp = {
        ...mockOrder,
        created_at: {
          seconds: 1704067200,
          toDate: undefined,
        } as any,
      };

      render(
        <VvipOrderCard
          order={orderWithTimestamp}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      expect(screen.getAllByText('Jan 01, 2024')[0]).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during approval', async () => {
      let resolveApprove: () => void;
      const approvePromise = new Promise<void>((resolve) => {
        resolveApprove = resolve;
      });
      mockOnApprove.mockReturnValue(approvePromise);
      
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      fireEvent.click(screen.getByText('Approve Payment'));
      
      expect(screen.getByText('Approving...')).toBeInTheDocument();
      
      resolveApprove!();
      await waitFor(() => {
        expect(screen.queryByText('Approving...')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during rejection', async () => {
      let resolveReject: () => void;
      const rejectPromise = new Promise<void>((resolve) => {
        resolveReject = resolve;
      });
      mockOnReject.mockReturnValue(rejectPromise);
      
      render(
        <VvipOrderCard
          order={mockOrder}
          userRole="super_admin"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onViewProof={mockOnViewProof}
        />
      );

      fireEvent.click(screen.getByText('Reject Payment'));
      
      expect(screen.getByText('Rejecting...')).toBeInTheDocument();
      
      resolveReject!();
      await waitFor(() => {
        expect(screen.queryByText('Rejecting...')).not.toBeInTheDocument();
      });
    });
  });
});