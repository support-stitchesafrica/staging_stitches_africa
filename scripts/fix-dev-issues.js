#!/usr/bin/env node

/**
 * Quick fix script for development issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing development issues...\n');

// 1. Check if InstallPromptWrapper exists
const wrapperPath = path.join(process.cwd(), 'components/client/InstallPromptWrapper.tsx');
if (!fs.existsSync(wrapperPath)) {
  console.log('✅ Creating InstallPromptWrapper...');
  const wrapperContent = `"use client";

import dynamic from 'next/dynamic';

// Client-side dynamic import for InstallPrompt
const InstallPrompt = dynamic(() => import("@/components/installAppPrompt"), {
  ssr: false,
  loading: () => null,
});

export default function InstallPromptWrapper() {
  return <InstallPrompt />;
}`;
  
  const clientDir = path.join(process.cwd(), 'components/client');
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }
  
  fs.writeFileSync(wrapperPath, wrapperContent);
  console.log('✅ InstallPromptWrapper created');
} else {
  console.log('✅ InstallPromptWrapper already exists');
}

// 2. Check if installAppPrompt component exists
const installPromptPath = path.join(process.cwd(), 'components/installAppPrompt.tsx');
if (!fs.existsSync(installPromptPath)) {
  console.log('✅ Creating installAppPrompt component...');
  const installPromptContent = `"use client";

import React from 'react';

export default function InstallAppPrompt() {
  return null; // Placeholder component
}`;
  
  fs.writeFileSync(installPromptPath, installPromptContent);
  console.log('✅ installAppPrompt component created');
} else {
  console.log('✅ installAppPrompt component already exists');
}

// 3. Validate performance-utils.ts
const perfUtilsPath = path.join(process.cwd(), 'lib/utils/performance-utils.ts');
if (fs.existsSync(perfUtilsPath)) {
  let content = fs.readFileSync(perfUtilsPath, 'utf8');
  
  // Fix the generic type issue
  if (content.includes('React.ComponentType<any>>')) {
    content = content.replace(
      /export const createLazyComponent = <T extends React\.ComponentType<any>>\(/g,
      'export const createLazyComponent = <T extends React.ComponentType<any>>('
    );
    
    fs.writeFileSync(perfUtilsPath, content);
    console.log('✅ Fixed performance-utils.ts TypeScript issues');
  } else {
    console.log('✅ performance-utils.ts is already fixed');
  }
} else {
  console.log('⚠️  performance-utils.ts not found');
}

// 4. Check Next.js config
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (content.includes('bundlePagesRouterDependencies') || content.includes('swcMinify') || content.includes('optimizeFonts')) {
    console.log('⚠️  Next.js config contains deprecated options - please update manually');
  } else {
    console.log('✅ Next.js config is clean');
  }
} else {
  console.log('⚠️  next.config.mjs not found');
}

console.log('\n🎉 Development issues fixed!');
console.log('\n📋 Next steps:');
console.log('1. Run "npm run dev" to test the fixes');
console.log('2. If issues persist, check the console for specific errors');
console.log('3. Ensure all dependencies are installed with "npm install"');