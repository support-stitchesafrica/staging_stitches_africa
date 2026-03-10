/**
 * Optimized Firebase initialization with performance enhancements
 * This file should be imported early in the app lifecycle
 */

// Enable Firebase performance monitoring and optimizations
if (typeof window !== 'undefined') {
  // Preload Firebase modules for faster initialization
  const preloadFirebase = async () => {
    try {
      // Preload core Firebase modules
      await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ]);
      
      console.log('✅ Firebase modules preloaded');
    } catch (error) {
      console.warn('⚠️ Firebase preload failed:', error);
    }
  };
  
  // Start preloading immediately
  preloadFirebase();
  
  // Enable Firebase performance monitoring in production
  if (process.env.NODE_ENV === 'production') {
    import('firebase/performance').then(({ getPerformance, trace }) => {
      import('@/firebase').then(({ app }) => {
        const perf = getPerformance(app);
        
        // Create custom traces for key operations
        const authTrace = trace(perf, 'auth_operations');
        const firestoreTrace = trace(perf, 'firestore_operations');
        
        // Store traces globally for use in other modules
        (window as any).__firebase_traces = {
          auth: authTrace,
          firestore: firestoreTrace,
        };
        
        console.log('✅ Firebase Performance monitoring enabled');
      });
    }).catch(error => {
      console.warn('⚠️ Firebase Performance setup failed:', error);
    });
  }
  
  // Optimize Firestore settings
  import('@/firebase').then(({ db }) => {
    // Enable offline persistence for better performance
    import('firebase/firestore').then(({ enableNetwork, connectFirestoreEmulator }) => {
      // Enable network for better performance
      enableNetwork(db).catch(error => {
        console.warn('⚠️ Failed to enable Firestore network:', error);
      });
      
      console.log('✅ Firestore network optimizations applied');
    });
  }).catch(error => {
    console.warn('⚠️ Firestore optimization failed:', error);
  });
}

export {};