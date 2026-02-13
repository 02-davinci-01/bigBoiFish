"use client";

import { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ message, visible, onHide }: ToastProps) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (visible) {
      setHiding(false);
      const timer = setTimeout(() => {
        setHiding(true);
        setTimeout(onHide, 400);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div className={`toast ${hiding ? "hiding" : ""}`}>
      {message}
    </div>
  );
}
