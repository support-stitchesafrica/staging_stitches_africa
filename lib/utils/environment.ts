/**
 * Environment detection and configuration utilities
 */
import { getAppBaseUrl, getAppEnv, type AppEnv } from '@/lib/env';

export function getEnvironment() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const appEnv = getAppEnv();
  const isLocal =
    appEnv === 'local' ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1');
  const isStaging = appEnv === 'staging' || hostname.includes('staging');
  const isProduction = appEnv === 'production' && !isLocal && !isStaging;

  return {
    isLocal,
    isStaging,
    isProduction,
    hostname,
    environment: appEnv satisfies AppEnv,
  };
}

export function getApiBaseUrl() {
  return getAppBaseUrl();
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