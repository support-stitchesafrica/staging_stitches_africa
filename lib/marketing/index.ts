/**
 * Marketing Dashboard Library Exports
 * Centralized exports for all marketing dashboard functionality
 */

// Domain Validation
export {
  DomainValidator,
  isValidCompanyEmail,
  validateDomainOrThrow,
  type DomainValidationResult
} from './domain-validator';

// Domain Middleware
export {
  validateDomainMiddleware,
  withDomainValidation,
  validateDomainForFirebase,
  expressDomainMiddleware,
  createDomainErrorResponse,
  validateDomainForAPI,
  type DomainMiddlewareOptions
} from './domain-middleware';

// Domain Error Handling
export {
  DomainValidationError,
  DomainErrorFactory,
  handleDomainError,
  logDomainError,
  getUserFriendlyErrorMessage,
  isDomainValidationError,
  extractDomainErrorInfo,
  DomainErrorCode,
  type DomainError
} from './domain-errors';

// Authentication Middleware
export {
  authenticateRequest,
  withAuth,
  requireRole,
  requirePermissions,
  hasRole,
  hasPermission,
  type AuthenticatedUser,
  type AuthContext,
  type UserPermissions,
  type AuthMiddlewareOptions
} from './auth-middleware';

// Session Management
export {
  SessionManager,
  validateSessionMiddleware,
  withSession,
  getMarketingUserFromSession,
  type SessionInfo,
  type SessionValidationResult
} from './session-manager';

// API Route Helpers
export {
  createProtectedRoute,
  createPublicRoute,
  ProtectedRoutes,
  ApiUtils,
  withCors,
  handleOptions,
  RouteExamples,
  type ApiRouteOptions,
  type ApiHandler,
  type PublicApiHandler
} from './api-helpers';

// Invitation Service
export {
  InvitationService,
  invitationUtils,
  InvitationError,
  InvitationErrorCodes,
  type Invitation,
  type CreateInvitationData,
  type InvitationValidationResult,
  type AcceptInvitationData
} from './invitation-service';

// User Service
export {
  UserService,
  RoleValidator,
  UserProfileValidator,
  userUtils,
  type User,
  type UserRole,
  type CreateUserData,
  type UpdateUserData,
  type UserFilters
} from './user-service';

// Super Admin Service
export {
  SuperAdminService,
  superAdminUtils,
  type SuperAdminSetupData,
  type CompanyWorkspace
} from './super-admin-service';

// Team Service
export {
  TeamService,
  teamUtils,
  type Team,
  type CreateTeamData,
  type UpdateTeamData,
  type TeamMember,
  type TeamWithMembers
} from './team-service';

// Team Assignment Service
export {
  TeamAssignmentService,
  TeamManagementUtils,
  teamAssignmentUtils,
  type VendorAssignment,
  type CreateVendorAssignmentData,
  type VendorTransferData
} from './team-assignment-service';

// Vendor Assignment Service
export {
  VendorAssignmentService,
  assignmentUtils,
  type CreateAssignmentData,
  type UpdateAssignmentData,
  type AssignmentFilters
} from './vendor-assignment-service';

// Tailor Storyboard Service
export * from './tailor-storyboard-service';

// Analytics Service
export {
  AnalyticsService,
  analyticsUtils,
  type VendorPerformanceMetrics,
  type TeamPerformanceMetrics,
  type OrganizationAnalytics,
  type VendorInsights
} from './analytics-service';

// Analytics Persistence Service
export {
  AnalyticsPersistenceService,
  type PersistedAnalytics
} from './analytics-persistence-service';

// Analytics Persistence Service (Client-side only)
export {
  AnalyticsPersistenceServiceClient,
  type PersistedAnalytics as PersistedAnalyticsClient
} from './analytics-persistence-service-client';

// Analytics Hook
export {
  useAnalytics,
  type AnalyticsData,
  type UseAnalyticsOptions,
  type UseAnalyticsResult
} from './useAnalytics';

// Activity Log Service
export {
  ActivityLogService,
  activityLogUtils,
  type ActivityLog,
  type ActivityAction,
  type EntityType,
  type CreateActivityLogData,
  type ActivityLogFilters,
  type ActivityLogSearchOptions,
  type ActivityLogStats
} from './activity-log-service';

// Export Service
export {
  ExportService,
  type ExportFormat,
  type ExportOptions
} from './export-service';

// Report Scheduler Service
export {
  ReportSchedulerService,
  type ScheduledReport
} from './report-scheduler-service';

// Input Validation
export {
  InputValidator,
  FormValidator,
  validationUtils,
  type ValidationResult,
  type FieldValidationRule
} from './input-validator';

// Password Validation and Security
export {
  PasswordValidator,
  SecureTokenGenerator,
  SessionTimeoutManager,
  passwordUtils,
  tokenUtils,
  sessionTimeoutUtils,
  type PasswordValidationResult,
  type PasswordRequirements
} from './password-validator';

// Security Middleware
export {
  SecurityMiddleware,
  withSecurity,
  validateField,
  sanitize,
  rateLimiter,
  type SecurityOptions
} from './security-middleware';

// Types
export {
  type MarketingRole,
  type MarketingUser,
  type Notification,
  type NotificationPreferences,
  type AssignmentStatus,
  type VendorAssignment as VendorAssignmentType
} from './types';