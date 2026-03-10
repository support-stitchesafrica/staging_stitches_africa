// Firebase configuration and initialization with HMR compatibility
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Functions } from 'firebase/functions';

// Service interfaces for structured initialization
interface CoreServices {
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

interface OptionalServices {
  functions?: Functions;
}

interface ServiceError {
  service: string;
  error: string;
  timestamp: Date;
  retryCount: number;
}

interface ServiceStatus {
  core: {
    app: boolean;
    auth: boolean;
    firestore: boolean;
    storage: boolean;
  };
  optional: {
    functions: boolean;
  };
  initializationTime: Date;
  errors: ServiceError[];
}

// Environment variable validation with better error handling
const validateFirebaseConfig = () => {
  // Only validate when we actually need Firebase (in browser environment)
  if (typeof window !== 'undefined') {
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      const errorMessage = `Missing required Firebase environment variables: ${missingVars.join(', ')}`;
      console.warn('Firebase Configuration Warning:', errorMessage);
      console.warn('Please check your .env.local file and ensure all Firebase environment variables are set.');
      // Don't throw error during validation - let it fail gracefully when actually used
      return false;
    }
  }
  return true;
};

// Firebase configuration with error handling
const getFirebaseConfig = () => {
  try {
    // Get config values first
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Only validate in browser environment and when actually needed
    if (typeof window !== 'undefined') {
      const isValid = validateFirebaseConfig();
      if (!isValid) {
        console.warn('Firebase configuration is invalid, but continuing with available values');
      }
      
      // Only validate values in browser environment
      const missingValues = Object.entries(config).filter(([, value]) => !value);
      if (missingValues.length > 0) {
        console.warn(`Firebase config values are undefined: ${missingValues.map(([key]) => key).join(', ')}`);
        // Don't throw error - let Firebase initialization handle it
      }
    }

    return config as {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
    };
  } catch (error) {
    console.error('Failed to get Firebase configuration:', error);
    throw error;
  }
};

// Global Firebase instances cache for HMR compatibility
let firebaseCache: {
  app?: FirebaseApp;
  auth?: Auth;
  db?: Firestore;
  storage?: FirebaseStorage;
  functions?: Functions;
} = {};

// Service status tracking
let serviceStatus: ServiceStatus = {
  core: {
    app: false,
    auth: false,
    firestore: false,
    storage: false,
  },
  optional: {
    functions: false,
  },
  initializationTime: new Date(),
  errors: [],
};

// HMR-safe Firebase app initialization with dynamic imports
const initializeFirebaseApp = async (): Promise<FirebaseApp> => {
  try {
    // Use module loading wrapper to avoid HMR issues
    const { loadFirebaseModule } = await import('./utils/module-helpers');
    const { initializeApp, getApps, getApp } = await loadFirebaseModule('firebase/app', 'firebase_app');
    
    // Check if Firebase app is already initialized to prevent duplicate initialization
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log('Firebase app already initialized, reusing existing instance');
      return getApp(); // Return existing app instance
    }

    // Initialize new Firebase app
    const firebaseConfig = getFirebaseConfig();
    const app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
    return app;
  } catch (error) {
    console.error('Firebase app initialization failed:', error);
    throw new Error(`Firebase initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Core Firebase services initialization - these are required for app functionality
const initializeCoreServices = async (app: FirebaseApp): Promise<CoreServices> => {
  const { loadFirebaseModule } = await import('./utils/module-helpers');
  const coreServices = {} as CoreServices;
  
  // Reset core service status
  serviceStatus.core.auth = false;
  serviceStatus.core.firestore = false;
  serviceStatus.core.storage = false;

  try {
    const { getAuth } = await loadFirebaseModule('firebase/auth', 'firebase_auth_service');
    coreServices.auth = getAuth(app);
    serviceStatus.core.auth = true;
    console.log('Firebase Auth initialized successfully');
  } catch (error) {
    const serviceError: ServiceError = {
      service: 'auth',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      retryCount: 0,
    };
    serviceStatus.errors.push(serviceError);
    console.error('Failed to initialize Firebase Auth:', error);
    throw new Error(`Firebase Auth initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    const { getFirestore } = await loadFirebaseModule('firebase/firestore', 'firebase_firestore_service');
    coreServices.db = getFirestore(app);
    serviceStatus.core.firestore = true;
    console.log('Firestore initialized successfully');
  } catch (error) {
    const serviceError: ServiceError = {
      service: 'firestore',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      retryCount: 0,
    };
    serviceStatus.errors.push(serviceError);
    console.error('Failed to initialize Firestore:', error);
    throw new Error(`Firestore initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    const { getStorage } = await loadFirebaseModule('firebase/storage', 'firebase_storage_service');
    coreServices.storage = getStorage(app);
    serviceStatus.core.storage = true;
    console.log('Firebase Storage initialized successfully');
  } catch (error) {
    const serviceError: ServiceError = {
      service: 'storage',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      retryCount: 0,
    };
    serviceStatus.errors.push(serviceError);
    console.error('Failed to initialize Firebase Storage:', error);
    throw new Error(`Firebase Storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return coreServices;
};

// Optional Firebase services initialization - these can fail without blocking core functionality
const initializeOptionalServices = async (app: FirebaseApp): Promise<OptionalServices> => {
  const optionalServices: OptionalServices = {};
  
  // Reset optional service status
  serviceStatus.optional.functions = false;

  // Firebase Functions initialization - non-blocking
  try {
    const { loadFirebaseFunctions } = await import('./utils/module-helpers');
    const functionsModule = await loadFirebaseFunctions('firebase_functions_service');
    
    if (functionsModule) {
      const { getFunctions } = functionsModule;
      optionalServices.functions = getFunctions(app);
      serviceStatus.optional.functions = true;
      console.log('Firebase Functions initialized successfully');
    } else {
      console.warn('Firebase Functions is not available - continuing without Functions service');
      if (process.env.NODE_ENV === 'development') {
        console.warn('This is expected if Functions module failed to load due to HMR or configuration issues.');
      }
    }
  } catch (error) {
    const serviceError: ServiceError = {
      service: 'functions',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      retryCount: 0,
    };
    serviceStatus.errors.push(serviceError);
    console.warn('Failed to initialize Firebase Functions (non-critical):', error);
    if (process.env.NODE_ENV === 'development') {
      console.warn('Firebase Functions will be unavailable. This is common in development environments with HMR.');
    }
  }

  return optionalServices;
};

// Combined service initialization with graceful continuation
const initializeFirebaseServices = async (app: FirebaseApp) => {
  // Initialize core services first - these must succeed
  const coreServices = await initializeCoreServices(app);
  
  // Initialize optional services - these can fail gracefully
  const optionalServices = await initializeOptionalServices(app);
  
  // Update initialization timestamp
  serviceStatus.initializationTime = new Date();
  
  return {
    auth: coreServices.auth,
    db: coreServices.db,
    storage: coreServices.storage,
    functions: optionalServices.functions || null,
  };
};

// Lazy initialization function with better error handling and service status tracking
const initializeFirebase = async () => {
  // Check if core services are initialized (Functions is optional)
  if (firebaseCache.app && firebaseCache.auth && firebaseCache.db && firebaseCache.storage) {
    return firebaseCache;
  }

  try {
    // Check if we're in the right environment for Firebase initialization
    if (typeof window === 'undefined') {
      // In server-side environment, we can still initialize Firebase for server usage
      // This is common in Next.js API routes
      console.warn('Firebase initialization in server environment - this is expected for API routes');
    }

    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      throw new Error('Firebase environment variables not loaded. Please check your .env.local file.');
    }

    const app = await initializeFirebaseApp();
    serviceStatus.core.app = true;
    
    const services = await initializeFirebaseServices(app);
    
    firebaseCache = {
      app,
      auth: services.auth!,
      db: services.db!,
      storage: services.storage!,
      functions: services.functions || undefined, // Functions is optional
    };

    // Log service initialization summary
    const coreServicesCount = Object.values(serviceStatus.core).filter(Boolean).length;
    const optionalServicesCount = Object.values(serviceStatus.optional).filter(Boolean).length;
    const totalErrors = serviceStatus.errors.length;
    
    console.log(`Firebase initialization complete: ${coreServicesCount}/4 core services, ${optionalServicesCount}/1 optional services`);
    if (totalErrors > 0) {
      console.warn(`${totalErrors} service initialization errors occurred (check service status for details)`);
    }

    return firebaseCache;
  } catch (error) {
    console.error('Critical Firebase initialization error:', error);
    
    // In development, provide helpful debugging information
    if (process.env.NODE_ENV === 'development') {
      console.error('Firebase services are not available. Debugging info:');
      console.error('- Environment:', process.env.NODE_ENV);
      console.error('- Window available:', typeof window !== 'undefined');
      console.error('- API Key available:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
      console.error('- Service Status:', serviceStatus);
      console.error('Please check your .env.local file and ensure all Firebase environment variables are set.');
    }
    
    throw error;
  }
};

// Getter functions that handle lazy initialization with retry logic
export const getFirebaseApp = async (): Promise<FirebaseApp> => {
  try {
    const firebase = await initializeFirebase();
    return firebase.app!;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get Firebase App:', errorMessage);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('🔧 Firebase App is required for all Firebase services to work.');
      console.error('   Note: Optional services like Functions may fail independently without affecting the app.');
    }
    
    throw new Error(`Firebase App is not available: ${errorMessage}`);
  }
};

export const getFirebaseAuth = async (): Promise<Auth> => {
  try {
    const firebase = await initializeFirebase();
    return firebase.auth!;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get Firebase Auth:', errorMessage);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('🔧 Firebase Auth is a core service and must be available for the application to work.');
      console.error('   Note: Firebase Auth works independently of optional services like Functions.');
    }
    
    throw new Error(`Firebase Auth is not available: ${errorMessage}`);
  }
};

export const getFirebaseDb = async (): Promise<Firestore> => {
  try {
    const firebase = await initializeFirebase();
    return firebase.db!;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get Firestore:', errorMessage);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('🔧 Firestore is a core service and must be available for the application to work.');
      console.error('   Note: Firestore works independently of optional services like Functions.');
    }
    
    throw new Error(`Firestore is not available: ${errorMessage}`);
  }
};

export const getFirebaseStorage = async (): Promise<FirebaseStorage> => {
  try {
    const firebase = await initializeFirebase();
    return firebase.storage!;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get Firebase Storage:', errorMessage);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('🔧 Firebase Storage is a core service and must be available for the application to work.');
      console.error('   Note: Firebase Storage works independently of optional services like Functions.');
    }
    
    throw new Error(`Firebase Storage is not available: ${errorMessage}`);
  }
};

export const getFirebaseFunctions = async (): Promise<Functions | null> => {
  try {
    const firebase = await initializeFirebase();
    if (!firebase.functions) {
      // Distinguish between configuration and loading issues
      const functionsStatus = serviceStatus.optional.functions;
      const functionsError = serviceStatus.errors.find(err => err.service === 'functions');
      
      if (process.env.NODE_ENV === 'development') {
        if (functionsError) {
          // Loading issue - module failed to load
          console.warn('⚠️  Firebase Functions service is unavailable due to loading failure:', functionsError.error);
          console.warn('   This is common in development environments with HMR (Hot Module Replacement).');
          console.warn('   The application will continue to work without Functions service.');
        } else {
          // Configuration issue - service not configured or disabled
          console.warn('⚠️  Firebase Functions service is not configured or disabled.');
          console.warn('   If you need Functions, ensure the firebase/functions module is available.');
        }
      }
      return null;
    }
    return firebase.functions;
  } catch (error) {
    // Distinguish between different types of Firebase initialization errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('environment variables') || errorMessage.includes('configuration')) {
      // Configuration error
      console.warn('Firebase Functions unavailable due to configuration issue:', errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔧 Configuration Help: Check your .env.local file for Firebase environment variables.');
      }
    } else if (errorMessage.includes('browser environment') || errorMessage.includes('window')) {
      // Environment error (SSR/build time)
      console.warn('Firebase Functions unavailable in current environment (SSR/build)');
    } else {
      // General loading error
      console.warn('Firebase Functions unavailable due to loading error:', errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔄 This may be temporary. Try refreshing the page or restarting the development server.');
      }
    }
    
    return null;
  }
};

/**
 * Get Firebase Functions wrapper with availability checking and fallback support
 * This is the recommended way to interact with Firebase Functions
 */
export const getFirebaseFunctionsWrapper = async () => {
  const { getFirebaseFunctionsWrapper } = await import('./firebase-functions-wrapper');
  return getFirebaseFunctionsWrapper();
};

// Synchronous getters for backward compatibility - initialized lazily
export let auth: Auth | undefined;
export let db: Firestore | undefined;
export let storage: FirebaseStorage | undefined;
export let functions: Functions | undefined;
export let app: FirebaseApp | undefined;

// Initialize Firebase lazily when first accessed
const initFirebaseSync = async () => {
  try {
    // Only initialize if we're in a browser environment and env vars are available
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      const firebase = await initializeFirebase();
      auth = firebase.auth!;
      db = firebase.db!;
      storage = firebase.storage!;
      functions = firebase.functions;
      app = firebase.app!;
      console.log('Firebase initialized synchronously for backward compatibility');
    } else {
      console.log('Skipping Firebase initialization - not in browser environment or env vars not available');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase synchronously:', error);
    // Don't throw error during module load - let it fail gracefully
  }
};

// Initialize sync compatibility layer when needed
if (typeof window !== 'undefined') {
  initFirebaseSync().catch(() => {
    // Ignore errors during sync initialization
  });
}

// Don't initialize on module load - wait for first access
// This prevents Firebase validation errors during build/SSR

export default firebaseCache.app;

// Utility function to check if Firebase is properly initialized
export const isFirebaseInitialized = async (): Promise<boolean> => {
  try {
    const { loadFirebaseModule } = await import('./utils/module-helpers');
    const { getApps } = await loadFirebaseModule('firebase/app', 'firebase_app_status');
    
    // Core services required: app, auth, db, storage. Functions is optional.
    const hasApp = getApps().length > 0 && serviceStatus.core.app;
    const hasCoreServices = serviceStatus.core.auth && 
                           serviceStatus.core.firestore && 
                           serviceStatus.core.storage;
    
    return hasApp && hasCoreServices;
  } catch (error) {
    console.error('Error checking Firebase initialization status:', error);
    return false;
  }
};

// Utility function to get Firebase initialization status with detailed service tracking
export const getFirebaseStatus = async () => {
  try {
    const { loadFirebaseModule, isFirebaseFunctionsAvailable } = await import('./utils/module-helpers');
    const { getApps } = await loadFirebaseModule('firebase/app', 'firebase_app_status_check');
    
    // Check Functions availability separately
    const functionsAvailability = await isFirebaseFunctionsAvailable();
    
    return {
      isInitialized: await isFirebaseInitialized(),
      appCount: getApps().length,
      core: {
        app: serviceStatus.core.app,
        auth: serviceStatus.core.auth,
        firestore: serviceStatus.core.firestore,
        storage: serviceStatus.core.storage,
      },
      optional: {
        functions: serviceStatus.optional.functions,
      },
      cache: {
        hasAuth: !!firebaseCache.auth,
        hasDb: !!firebaseCache.db,
        hasStorage: !!firebaseCache.storage,
        hasFunctions: !!firebaseCache.functions,
      },
      functionsAvailability: {
        available: functionsAvailability.available,
        reason: functionsAvailability.reason,
      },
      initializationTime: serviceStatus.initializationTime,
      errors: serviceStatus.errors,
      errorCount: serviceStatus.errors.length,
    };
  } catch (error) {
    console.error('Error getting Firebase status:', error);
    return {
      isInitialized: false,
      appCount: 0,
      core: {
        app: false,
        auth: false,
        firestore: false,
        storage: false,
      },
      optional: {
        functions: false,
      },
      cache: {
        hasAuth: false,
        hasDb: false,
        hasStorage: false,
        hasFunctions: false,
      },
      functionsAvailability: {
        available: false,
        reason: 'Status check failed',
      },
      initializationTime: serviceStatus.initializationTime,
      errors: serviceStatus.errors,
      errorCount: serviceStatus.errors.length,
    };
  }
};

// Export service status for external access
export const getServiceStatus = (): ServiceStatus => {
  return { ...serviceStatus };
};

// Check if a specific service is available
export const isServiceAvailable = (serviceName: keyof ServiceStatus['core'] | keyof ServiceStatus['optional']): boolean => {
  if (serviceName in serviceStatus.core) {
    return serviceStatus.core[serviceName as keyof ServiceStatus['core']];
  }
  if (serviceName in serviceStatus.optional) {
    return serviceStatus.optional[serviceName as keyof ServiceStatus['optional']];
  }
  return false;
};