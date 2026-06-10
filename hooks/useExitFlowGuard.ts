'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
  /** Called when the user confirms exit from a browser-back intercept */
  onConfirmExit?: () => void;
};

/**
 * Intercepts browser back (popstate) and optional in-app exit actions while a flow is in progress.
 */
export function useExitFlowGuard(enabled: boolean, options?: Options) {
  const [open, setOpen] = useState(false);
  const allowExitRef = useRef(false);
  const pendingExitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || allowExitRef.current) return;

    const pushGuardState = () => {
      window.history.pushState({ exitFlowGuard: true }, '', window.location.href);
    };

    pushGuardState();

    const onPopState = () => {
      if (allowExitRef.current) return;
      pendingExitRef.current = () => {
        allowExitRef.current = true;
        if (options?.onConfirmExit) {
          options.onConfirmExit();
        } else {
          window.history.back();
        }
      };
      setOpen(true);
      pushGuardState();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [enabled]);

  const requestExit = useCallback(
    (action: () => void) => {
      if (!enabled || allowExitRef.current) {
        action();
        return;
      }
      pendingExitRef.current = action;
      setOpen(true);
    },
    [enabled],
  );

  const confirmExit = useCallback(() => {
    allowExitRef.current = true;
    setOpen(false);
    const action = pendingExitRef.current;
    pendingExitRef.current = null;
    if (action) {
      action();
    } else {
      window.history.back();
    }
  }, []);

  const cancelExit = useCallback(() => {
    setOpen(false);
    pendingExitRef.current = null;
  }, []);

  const markExitingFlow = useCallback(() => {
    allowExitRef.current = true;
  }, []);

  return {
    exitDialogOpen: open,
    setExitDialogOpen: setOpen,
    requestExit,
    confirmExit,
    cancelExit,
    markExitingFlow,
  };
}
