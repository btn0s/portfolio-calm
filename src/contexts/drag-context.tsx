"use client";

import { createContext, useContext, useRef, useCallback } from "react";

type DragContextType = {
  registerPotentialDrag: (pointerId: number) => void;
  confirmDrag: (pointerId: number) => void;
  cancelDrag: (pointerId: number) => void;
  isDragging: (pointerId: number) => boolean;
  wasDragConfirmed: (pointerId: number) => boolean;
};

const DragContext = createContext<DragContextType | undefined>(undefined);

export function DragProvider({ children }: { children: React.ReactNode }) {
  const potentialDragsRef = useRef<Set<number>>(new Set());
  const confirmedDragsRef = useRef<Set<number>>(new Set());

  const registerPotentialDrag = useCallback((pointerId: number) => {
    potentialDragsRef.current.add(pointerId);
  }, []);

  const confirmDrag = useCallback((pointerId: number) => {
    potentialDragsRef.current.delete(pointerId);
    confirmedDragsRef.current.add(pointerId);
  }, []);

  const cancelDrag = useCallback((pointerId: number) => {
    potentialDragsRef.current.delete(pointerId);
    // Delay clearing confirmed state so onClick can still check it
    setTimeout(() => {
      confirmedDragsRef.current.delete(pointerId);
    }, 50);
  }, []);

  const isDragging = useCallback((pointerId: number) => {
    return potentialDragsRef.current.has(pointerId) || confirmedDragsRef.current.has(pointerId);
  }, []);

  const wasDragConfirmed = useCallback((pointerId: number) => {
    return confirmedDragsRef.current.has(pointerId);
  }, []);

  return (
    <DragContext.Provider
      value={{
        registerPotentialDrag,
        confirmDrag,
        cancelDrag,
        isDragging,
        wasDragConfirmed,
      }}
    >
      {children}
    </DragContext.Provider>
  );
}

export function useDragContext() {
  const context = useContext(DragContext);
  if (context === undefined) {
    throw new Error("useDragContext must be used within a DragProvider");
  }
  return context;
}

export function useDragContextOptional() {
  return useContext(DragContext);
}
