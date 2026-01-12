"use client";

import { useEffect } from "react";
import { useSoundSettings } from "@/contexts/sound-context";

const isClickableElement = (element: Element | null): boolean => {
  if (!element) return false;

  // Check for common clickable elements
  const clickableElements = ["a", "button", "input", "select", "textarea"];
  if (clickableElements.includes(element.tagName.toLowerCase())) return true;

  // Check for elements with click-related attributes
  const clickAttributes = ["onclick", "role"];
  if (clickAttributes.some((attr) => element.hasAttribute(attr))) return true;

  // Check for elements with cursor: pointer
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.cursor === "pointer") return true;

  return false;
};

const getClickableElementAtPosition = (
  x: number,
  y: number
): Element | null => {
  const elements = document.elementsFromPoint(x, y);
  return elements.find(isClickableElement) || null;
};

export function ClickHandler() {
  const { playSound } = useSoundSettings();

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const isMetaKey = event.metaKey || event.ctrlKey;

      if (isMetaKey) {
        playSound("confetti");
      } else {
        // Check if we're clicking a clickable element
        const clickableElement = getClickableElementAtPosition(
          event.clientX,
          event.clientY
        );
        playSound("click", !!clickableElement);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [playSound]);

  return null;
}
