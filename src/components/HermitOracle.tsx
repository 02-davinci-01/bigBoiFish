"use client";

import { useState, useCallback, useEffect } from "react";

export default function HermitOracle() {
  const [sending, setSending] = useState(false);
  const [choice, setChoice] = useState<"affirm" | "negate" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleChoice = useCallback(
    async (type: "affirm" | "negate") => {
      if (sending) return;
      setSending(true);
      setChoice(null);
      try {
        await fetch("/api/oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        setChoice(type);
      } catch {
        // silent
      }
      setSending(false);
      setTimeout(() => setChoice(null), 2000);
    },
    [sending],
  );

  const closeMobile = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setMobileOpen(false);
      setClosing(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  const oracleContent = (
    <>
      <p className="hermit-oracle-text">
        The hermit&rsquo;s universe is wide and huge. Hence creatures need
        cosmic language. The bubbles are to affirm and send a prayer while the
        fleeing man negates and flare danger. So divine creature to whomsoever
        this canvas has been rendered to. What shall it be?
      </p>

      <div className="hermit-oracle-buttons">
        <button
          className={`hermit-oracle-btn ${choice === "affirm" ? "hermit-oracle-btn-done" : ""} ${sending ? "hermit-oracle-btn-sending" : ""}`}
          onClick={() => handleChoice("affirm")}
          disabled={sending}
          title="affirm"
        >
          <span className="hermit-oracle-btn-label">🫧</span>
        </button>
        <button
          className={`hermit-oracle-btn ${choice === "negate" ? "hermit-oracle-btn-done" : ""} ${sending ? "hermit-oracle-btn-sending" : ""}`}
          onClick={() => handleChoice("negate")}
          disabled={sending}
          title="negate"
        >
          <span className="hermit-oracle-btn-label">🏃</span>
        </button>
      </div>
      <div
        className={`hermit-oracle-status ${choice ? "hermit-oracle-status-visible" : ""}`}
      >
        lightspeed
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: fixed top-right */}
      <div className="hermit-oracle hermit-oracle-desktop">
        {oracleContent}
      </div>

      {/* Mobile: trigger button */}
      <button
        className="hermit-oracle-trigger"
        onClick={() => setMobileOpen(true)}
      >
        hermit oracle
      </button>

      {/* Mobile: modal */}
      {mobileOpen && (
        <>
          <div
            className={`hermit-oracle-overlay ${closing ? "hermit-oracle-overlay-closing" : ""}`}
            onClick={closeMobile}
          />
          <div
            className={`hermit-oracle hermit-oracle-modal ${closing ? "hermit-oracle-modal-closing" : ""}`}
          >
            <button className="hermit-oracle-modal-close" onClick={closeMobile}>
              &times;
            </button>
            {oracleContent}
          </div>
        </>
      )}
    </>
  );
}
