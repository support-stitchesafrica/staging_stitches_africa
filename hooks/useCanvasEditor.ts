'use client';

import { useState, useCallback } from 'react';
import { CanvasState, CanvasElement } from '@/types/collections';

interface UseCanvasEditorOptions {
  initialState?: CanvasState;
  maxHistorySize?: number;
}

interface UseCanvasEditorReturn {
  canvasState: CanvasState;
  selectedElement: string | null;
  history: CanvasState[];
  historyIndex: number;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  setCanvasState: (state: CanvasState) => void;
  setSelectedElement: (elementId: string | null) => void;
  addToHistory: (state: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  markClean: () => void;
  markDirty: () => void;
  addElement: (element: CanvasElement) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  duplicateElement: (elementId: string) => void;
  clearCanvas: () => void;
}

const DEFAULT_CANVAS_STATE: CanvasState = {
  elements: [],
  backgroundColor: '#ffffff',
  dimensions: { width: 1200, height: 800 },
};

export function useCanvasEditor(
  options: UseCanvasEditorOptions = {}
): UseCanvasEditorReturn {
  const { initialState = DEFAULT_CANVAS_STATE, maxHistorySize = 50 } = options;

  const [canvasState, setCanvasState] = useState<CanvasState>(initialState);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [history, setHistory] = useState<CanvasState[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  // Add state to history
  const addToHistory = useCallback(
    (state: CanvasState) => {
      setHistory((prev) => {
        // Remove any states after current index (when undoing then making new changes)
        const newHistory = prev.slice(0, historyIndex + 1);
        
        // Add new state
        newHistory.push(state);
        
        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
          setHistoryIndex(maxHistorySize - 1);
        } else {
          setHistoryIndex(newHistory.length - 1);
        }
        
        return newHistory;
      });
      
      setCanvasState(state);
      setIsDirty(true);
    },
    [historyIndex, maxHistorySize]
  );

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCanvasState(history[newIndex]);
      setIsDirty(true);
    }
  }, [historyIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCanvasState(history[newIndex]);
      setIsDirty(true);
    }
  }, [historyIndex, history]);

  // Mark as clean (after save)
  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  // Mark as dirty (after change)
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // Add element
  const addElement = useCallback(
    (element: CanvasElement) => {
      const newState: CanvasState = {
        ...canvasState,
        elements: [...canvasState.elements, element],
      };
      addToHistory(newState);
    },
    [canvasState, addToHistory]
  );

  // Remove element
  const removeElement = useCallback(
    (elementId: string) => {
      const newState: CanvasState = {
        ...canvasState,
        elements: canvasState.elements.filter((el) => el.id !== elementId),
      };
      addToHistory(newState);
      
      if (selectedElement === elementId) {
        setSelectedElement(null);
      }
    },
    [canvasState, selectedElement, addToHistory]
  );

  // Update element
  const updateElement = useCallback(
    (elementId: string, updates: Partial<CanvasElement>) => {
      const newState: CanvasState = {
        ...canvasState,
        elements: canvasState.elements.map((el) =>
          el.id === elementId ? { ...el, ...updates } : el
        ),
      };
      addToHistory(newState);
    },
    [canvasState, addToHistory]
  );

  // Duplicate element
  const duplicateElement = useCallback(
    (elementId: string) => {
      const element = canvasState.elements.find((el) => el.id === elementId);
      if (!element) return;

      const duplicated: CanvasElement = {
        ...element,
        id: `element-${Date.now()}-${Math.random()}`,
        position: {
          x: element.position.x + 20,
          y: element.position.y + 20,
        },
        zIndex: canvasState.elements.length,
      };

      addElement(duplicated);
    },
    [canvasState, addElement]
  );

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const newState: CanvasState = {
      ...canvasState,
      elements: [],
    };
    addToHistory(newState);
    setSelectedElement(null);
  }, [canvasState, addToHistory]);

  return {
    canvasState,
    selectedElement,
    history,
    historyIndex,
    isDirty,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    setCanvasState,
    setSelectedElement,
    addToHistory,
    undo,
    redo,
    markClean,
    markDirty,
    addElement,
    removeElement,
    updateElement,
    duplicateElement,
    clearCanvas,
  };
}
