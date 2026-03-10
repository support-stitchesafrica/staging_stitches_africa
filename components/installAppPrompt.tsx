"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    MSStream?: any;
  }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | null>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) setPlatform("ios");
    else if (/Android/.test(userAgent)) setPlatform("android");
    else setPlatform("desktop");

    const handler = (e: Event) => {
      e.preventDefault();

      // 🔹 Check if user has already dismissed or installed
      const dismissed = localStorage.getItem("installDismissed");
      if (dismissed === "true") return;

      setDeferredPrompt(e as any);
      setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (platform === "android" && deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setOpen(false);
      localStorage.setItem("installDismissed", "true"); // ✅ Save flag
    } else if (platform === "ios") {
      alert("Tap the Share button in Safari, then 'Add to Home Screen' to install this app.");
      setOpen(false);
      localStorage.setItem("installDismissed", "true"); // ✅ Save flag
    } else {
      alert("Your browser may not support PWA installation. You can bookmark this page.");
      setOpen(false);
      localStorage.setItem("installDismissed", "true"); // ✅ Save flag
    }
  };

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem("installDismissed", "true"); // ✅ Save flag
  };

  if (!platform) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <DialogHeader>
          <DialogTitle>Install StitchesAfrica</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {platform === "android"
            ? "Save StitchesAfrica to your device for quick access."
            : platform === "ios"
            ? "Add StitchesAfrica to your home screen using Safari’s share menu."
            : "Bookmark this page for quick access on desktop."}
        </p>
        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleDismiss}>
            Maybe Later
          </Button>
          <Button onClick={handleInstall}>Install</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
