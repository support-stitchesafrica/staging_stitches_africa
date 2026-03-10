import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AtlasAuthForms } from './AtlasAuthForms';
import * as AtlasAuthContext from '@/contexts/AtlasAuthContext';

// Mock the AtlasAuthContext
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockClearError = vi.fn();

vi.mock('@/contexts/AtlasAuthContext', () => ({
    useAtlasAuth: vi.fn(),
}));

describe('AtlasAuthForms', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();

        // Default mock implementation
        vi.mocked(AtlasAuthContext.useAtlasAuth).mockReturnValue({
            user: null,
            atlasUser: null,
            loading: false,
            error: null,
            login: mockLogin,
            register: mockRegister,
            logout: vi.fn(),
            clearError: mockClearError,
        });
    });

    describe('Tab Switching', () =>
    {
        it('should render login tab by default', () =>
        {
            render(<AtlasAuthForms />);

            expect(screen.getByText('Welcome Back')).toBeInTheDocument();
            expect(screen.getByText('Sign in to access the analytics dashboard')).toBeInTheDocument();
        });

        it('should switch to registration tab when clicked', () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            expect(screen.getByText('Create Atlas Account')).toBeInTheDocument();
            expect(screen.getByText('Register with your STITCHES Africa email')).toBeInTheDocument();
        });

        it('should show full name field in registration mode', () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        });

        it('should not show full name field in login mode', () =>
        {
            render(<AtlasAuthForms />);

            expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
        });

        it('should show confirm password field in registration mode', () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        });

        it('should clear form fields when switching tabs', () =>
        {
            render(<AtlasAuthForms />);

            const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
            fireEvent.change(emailInput, { target: { value: 'test@stitchesafrica.com' } });

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            const loginTab = screen.getByRole('button', { name: /login/i });
            fireEvent.click(loginTab);

            expect(emailInput.value).toBe('');
        });
    });

    describe('Email Domain Validation', () =>
    {
        it('should show error for invalid email domain in registration', () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            const emailInput = screen.getByLabelText(/email address/i);
            fireEvent.change(emailInput, { target: { value: 'test@gmail.com' } });

            expect(screen.getByText(/only @stitchesafrica.com and @stitchesafrica.pro email addresses are allowed/i)).toBeInTheDocument();
        });

        it('should not show error for valid @stitchesafrica.com email', () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            const emailInput = screen.getByLabelText(/email address/i);
            fireEvent.change(emailInput, { target: { value: 'test@stitchesafrica.com' } });

            expect(screen.queryByText(/only @stitchesafrica.com and @stitchesafrica.pro email addresses are allowed/i)).not.toBeInTheDocument();
        });

        it('should not show error for valid @stitchesafrica.pro email', () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            const emailInput = screen.getByLabelText(/email address/i);
            fireEvent.change(emailInput, { target: { value: 'test@stitchesafrica.pro' } });

            expect(screen.queryByText(/only @stitchesafrica.com and @stitchesafrica.pro email addresses are allowed/i)).not.toBeInTheDocument();
        });

        it('should not validate email domain in login mode', () =>
        {
            render(<AtlasAuthForms />);

            const emailInput = screen.getByLabelText(/email address/i);
            fireEvent.change(emailInput, { target: { value: 'test@gmail.com' } });

            expect(screen.queryByText(/only @stitchesafrica.com and @stitchesafrica.pro email addresses are allowed/i)).not.toBeInTheDocument();
        });
    });

    describe('Password Match Validation', () =>
    {
        it('should show error when passwords do not match', () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            const passwordInput = screen.getByLabelText(/^password$/i);
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        });

        it('should not show error when passwords match', () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            const passwordInput = screen.getByLabelText(/^password$/i);
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

            expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
        });
    });

    describe('Error Display', () =>
    {
        it('should display error from context', () =>
        {
            vi.mocked(AtlasAuthContext.useAtlasAuth).mockReturnValue({
                user: null,
                atlasUser: null,
                loading: false,
                error: 'Invalid credentials',
                login: mockLogin,
                register: mockRegister,
                logout: vi.fn(),
                clearError: mockClearError,
            });

            render(<AtlasAuthForms />);

            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });

        it('should not display error when error is null', () =>
        {
            render(<AtlasAuthForms />);

            expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
        });
    });

    describe('Loading States', () =>
    {
        it('should show loading state on submit button', () =>
        {
            vi.mocked(AtlasAuthContext.useAtlasAuth).mockReturnValue({
                user: null,
                atlasUser: null,
                loading: true,
                error: null,
                login: mockLogin,
                register: mockRegister,
                logout: vi.fn(),
                clearError: mockClearError,
            });

            render(<AtlasAuthForms />);

            expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
        });

        it('should disable form inputs when loading', () =>
        {
            vi.mocked(AtlasAuthContext.useAtlasAuth).mockReturnValue({
                user: null,
                atlasUser: null,
                loading: true,
                error: null,
                login: mockLogin,
                register: mockRegister,
                logout: vi.fn(),
                clearError: mockClearError,
            });

            render(<AtlasAuthForms />);

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);

            expect(emailInput).toBeDisabled();
            expect(passwordInput).toBeDisabled();
        });

        it('should disable submit button when loading', () =>
        {
            vi.mocked(AtlasAuthContext.useAtlasAuth).mockReturnValue({
                user: null,
                atlasUser: null,
                loading: true,
                error: null,
                login: mockLogin,
                register: mockRegister,
                logout: vi.fn(),
                clearError: mockClearError,
            });

            render(<AtlasAuthForms />);

            const submitButton = screen.getByRole('button', { name: /signing in\.\.\./i });
            expect(submitButton).toBeDisabled();
        });
    });

    describe('Form Submission', () =>
    {
        it('should call login with correct credentials', async () =>
        {
            render(<AtlasAuthForms />);

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            const submitButton = screen.getByRole('button', { name: /sign in/i });

            fireEvent.change(emailInput, { target: { value: 'test@stitchesafrica.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() =>
            {
                expect(mockLogin).toHaveBeenCalledWith('test@stitchesafrica.com', 'password123');
            });
        });

        it('should call register with correct data', async () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            const fullNameInput = screen.getByLabelText(/full name/i);
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
            const submitButton = screen.getByRole('button', { name: /create account/i });

            fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@stitchesafrica.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() =>
            {
                expect(mockRegister).toHaveBeenCalledWith('john@stitchesafrica.com', 'password123', 'John Doe');
            });
        });

        it('should not submit registration with invalid email domain', async () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            const fullNameInput = screen.getByLabelText(/full name/i);
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
            const submitButton = screen.getByRole('button', { name: /create account/i });

            fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@gmail.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() =>
            {
                expect(mockRegister).not.toHaveBeenCalled();
            });
        });

        it('should not submit registration with mismatched passwords', async () =>
        {
            render(<AtlasAuthForms />);

            const registrationTab = screen.getByRole('button', { name: /registration/i });
            fireEvent.click(registrationTab);

            const fullNameInput = screen.getByLabelText(/full name/i);
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
            const submitButton = screen.getByRole('button', { name: /create account/i });

            fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@stitchesafrica.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
            fireEvent.click(submitButton);

            await waitFor(() =>
            {
                expect(mockRegister).not.toHaveBeenCalled();
            });
        });
    });
});
