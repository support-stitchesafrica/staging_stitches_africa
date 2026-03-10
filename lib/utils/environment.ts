/**
 * Environment detection and configuration utilities
 */

export function getEnvironment() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isStaging = hostname.includes('staging') || hostname.includes('dev');
  const isProduction = !isLocal && !isStaging;

  return {
    isLocal,
    isStaging,
    isProduction,
    hostname,
    environment: isLocal ? 'local' : isStaging ? 'staging' : 'production'
  };
}

export function getApiBaseUrl() {
  const env = getEnvironment();
  
  if (env.isLocal) {
    return 'http://localhost:3000';
  }
  
  if (env.isStaging) {
    return 'https://staging.stitchesafrica.com';
  }
  
  return 'https://stitchesafrica.com';
}

export function getStorefrontUrl(handle: string) {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/store/${handle}`;
}

export function debugEnvironment() {
  const env = getEnvironment();
  console.log('Environment Info:', env);
  console.log('API Base URL:', getApiBaseUrl());
  return env;
}