"use client";

import { useState, useCallback } from "react";

export default function HermitOracle() {
  const [sending, setSending] = useState(false);
  const [choice, setChoice] = useState<"affirm" | "negate" | null>(null);

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

  return (
    <div className="hermit-oracle">
      <p className="hermit-oracle-text">
        According to hermit&rsquo;s theory of the universe, the souls of all
        humans are infinite. Beyond space and time. Hence a thought will be
        rendered here everyday for the divine creatures. The bubbles affirm while
        the fleeing man negate. Oh divine traveller what shall it be?
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
      <div className={`hermit-oracle-status ${choice ? "hermit-oracle-status-visible" : ""}`}>
        lightspeed
      </div>
    </div>
  );
}
