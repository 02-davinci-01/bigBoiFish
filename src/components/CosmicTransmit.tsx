"use client";

import { useState, useRef, useCallback } from "react";

export default function CosmicTransmit() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const btn = btnRef.current;
    if (btn) btn.style.transform = "translate(0, 0)";
  }, []);

  const handleTransmit = async () => {
    if (sending) return;
    setSending(true);
    setSent(false);
    try {
      await fetch("/api/wave", { method: "POST" });
    } catch {
      // silent fail
    }
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 1400);
  };

  const active = sending || sent;

  return (
    <button
      ref={btnRef}
      className={`magnetic-btn cosmic-btn ${sending ? "cosmic-btn-transmitting" : ""} ${sent ? "cosmic-btn-done" : ""}`}
      onClick={handleTransmit}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={sending}
    >
      <span className="cosmic-btn-label">
        {sending ? (
          <>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="animate-spin"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                strokeDasharray="31.42"
                strokeDashoffset="10"
              />
            </svg>
            lightspeed
          </>
        ) : sent ? (
          "lightspeed"
        ) : (
          "transmit to cosmos"
        )}
      </span>
      {!active && (
        <span className="cosmic-tooltip">
          transmit good deeds to the cosmos — it alters with every transmission
        </span>
      )}
    </button>
  );
}
