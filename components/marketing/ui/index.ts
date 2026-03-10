/**
 * Marketing UI Components Library
 * Centralized exports for all reusable marketing UI components
 */

// Form Components
export { FormField } from './FormField';
export { ResponsiveForm, FormSection, FormRow } from './ResponsiveForm';

// Table Components
export { DataTable } from './DataTable';
export type { Column } from './DataTable';
export { ResponsiveTable } from './ResponsiveTable';

// Modal Components
export { Modal, ConfirmModal } from './Modal';

// Dashboard Components
export { DashboardWidget, StatCard } from './DashboardWidget';
export {
  ResponsiveDashboard,
  DashboardHeader,
  DashboardStatsGrid,
  DashboardContentGrid,
  DashboardSection,
} from './ResponsiveDashboard';

// Layout Components
export { ResponsiveContainer, ResponsiveGrid, ResponsiveStack } from './ResponsiveContainer';
export { MobileMenu } from './MobileMenu';

// State Components
export {
  LoadingSpinner,
  LoadingOverlay,
  TableSkeleton,
  CardSkeleton,
  DashboardSkeleton,
  FormSkeleton,
} from './LoadingState';
export { EmptyState } from './EmptyState';
export { ErrorState } from './ErrorState';

// Badge Components
export { StatusBadge, RoleBadge } from './StatusBadge';
