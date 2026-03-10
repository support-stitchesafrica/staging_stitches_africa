"use client";

import dynamic from 'next/dynamic';

// Client-side dynamic import for InstallPrompt
const InstallPrompt = dynamic(() => import("@/components/installAppPrompt"), {
  ssr: false,
  loading: () => null,
});

export default function InstallPromptWrapper() {
  return <InstallPrompt />;
}