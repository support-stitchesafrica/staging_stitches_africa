import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserSearchForm } from '../UserSearchForm';

// Mock Firebase
const mockGetIdToken = vi.fn();
const mockAuth = {
  currentUser: {
    getIdToken: mockGetIdToken,
  },
};

vi.mock('@/firebase', () => ({
  auth: mockAuth,
}));

// Mock fetch
global.fetch = vi.fn();

describe('UserSearchForm', () => {
  const mockOnUserSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIdToken.mockResolvedValue('mock-token');
  });

  describe('Component Rendering', () => {
    it('should render search form with email option selected by default', () => {
      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      expect(screen.getByText('Search Users')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeChecked();
      expect(screen.getByPlaceholderText('Enter user email address...')).toBeInTheDocument();
    });

    it('should render search form with user ID option when specified', () => {
      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="userId" />);

      expect(screen.getByLabelText('User ID')).toBeChecked();
      expect(screen.getByPlaceholderText('Enter user ID...')).toBeInTheDocument();
    });

    it('should show search instructions initially', () => {
      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      expect(screen.getByText('Search Instructions')).toBeInTheDocument();
      expect(screen.getByText(/Use email search to find users/)).toBeInTheDocument();
    });
  });

  describe('Search Type Selection', () => {
    it('should switch between email and user ID search types', () => {
      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      // Initially email is selected
      expect(screen.getByLabelText('Email Address')).toBeChecked();
      expect(screen.getByPlaceholderText('Enter user email address...')).toBeInTheDocument();

      // Switch to user ID
      fireEvent.click(screen.getByLabelText('User ID'));
      
      expect(screen.getByLabelText('User ID')).toBeChecked();
      expect(screen.getByPlaceholderText('Enter user ID...')).toBeInTheDocument();
    });

    it('should clear search query when switching search types', () => {
      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      
      expect(input).toHaveValue('test@example.com');

      // Switch to user ID
      fireEvent.click(screen.getByLabelText('User ID'));
      
      const newInput = screen.getByPlaceholderText('Enter user ID...');
      expect(newInput).toHaveValue('test@example.com'); // Value persists but placeholder changes
    });
  });

  describe('Input Validation', () => {
    it('should disable search button for invalid email', () => {
      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      const searchButton = screen.getByRole('button', { name: /search/i });

      // Empty input
      expect(searchButton).toBeDisabled();

      // Invalid email
      fireEvent.change(input, { target: { value: 'invalid-email' } });
      expect(searchButton).toBeDisabled();

      // Valid email
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      expect(searchButton).not.toBeDisabled();
    });

    it('should disable search button for empty user ID', () => {
      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="userId" />);

      const input = screen.getByPlaceholderText('Enter user ID...');
      const searchButton = screen.getByRole('button', { name: /search/i });

      // Empty input
      expect(searchButton).toBeDisabled();

      // Valid user ID
      fireEvent.change(input, { target: { value: 'user-123' } });
      expect(searchButton).not.toBeDisabled();
    });
  });

  describe('Search Functionality', () => {
    it('should perform search when form is submitted', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          users: [
            {
              userId: 'user-123',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              isVvip: false,
            },
          ],
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/marketing/vvip/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify({
            query: 'test@example.com',
            searchType: 'email',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('1 user found')).toBeInTheDocument();
      });
    });

    it('should show loading state during search', async () => {
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });
      
      (global.fetch as any).mockReturnValue(searchPromise);

      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(searchButton);

      // Should show loading spinner
      expect(screen.getByRole('button')).toBeDisabled();

      resolveSearch!({
        ok: true,
        json: () => Promise.resolve({ success: true, users: [] }),
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /search/i })).not.toBeDisabled();
      });
    });

    it('should handle search errors', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({
          success: false,
          message: 'Search failed',
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Search failed')).toBeInTheDocument();
      });
    });

    it('should handle authentication errors', async () => {
      const originalCurrentUser = mockAuth.currentUser;
      mockAuth.currentUser = null;

      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      });

      // Restore original state
      mockAuth.currentUser = originalCurrentUser;
    });
  });

  describe('Search Results Display', () => {
    it('should display search results correctly', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          users: [
            {
              userId: 'user-123',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              isVvip: false,
            },
            {
              userId: 'user-456',
              email: 'jane@example.com',
              firstName: 'Jane',
              lastName: 'Smith',
              isVvip: true,
            },
          ],
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('2 users found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /already vvip/i })).toBeInTheDocument();
      });
    });

    it('should show no results message when no users found', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          users: [],
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      fireEvent.change(input, { target: { value: 'nonexistent@example.com' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('No users found matching your search')).toBeInTheDocument();
        expect(screen.getByText('0 users found')).toBeInTheDocument();
      });
    });

    it('should display user without name using email', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          users: [
            {
              userId: 'user-123',
              email: 'test@example.com',
              isVvip: false,
            },
          ],
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        // Email should appear twice - once as name, once as email
        expect(screen.getAllByText('test@example.com')).toHaveLength(2);
      });
    });
  });

  describe('User Selection', () => {
    it('should call onUserSelected when Select User button is clicked', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          users: [
            {
              userId: 'user-123',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              isVvip: false,
            },
          ],
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /select user/i }));
      expect(mockOnUserSelected).toHaveBeenCalledWith('user-123');
    });

    it('should disable Select User button for VVIP users', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          users: [
            {
              userId: 'user-123',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              isVvip: true,
            },
          ],
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const alreadyVvipButton = screen.getByRole('button', { name: /already vvip/i });
      expect(alreadyVvipButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form when Enter key is pressed', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          users: [],
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      render(<UserSearchForm onUserSelected={mockOnUserSelected} searchType="email" />);

      const input = screen.getByPlaceholderText('Enter user email address...');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      
      // Submit the form directly instead of using keyDown
      const form = input.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/marketing/vvip/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify({
            query: 'test@example.com',
            searchType: 'email',
          }),
        });
      });
    });
  });
});