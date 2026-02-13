"use client";

import { useRef, useState, useCallback } from "react";
import type { PromptFile } from "./FileSelector";

interface DownloadButtonProps {
  files: PromptFile[];
  selectedIds: string[];
}

export default function DownloadButton({ files, selectedIds }: DownloadButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<"idle" | "downloading" | "success">("idle");

  // Magnetic effect
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

  // Download logic — triggers multiple downloads
  const handleDownload = useCallback(async () => {
    if (selectedIds.length === 0 || state !== "idle") return;

    setState("downloading");

    const selectedFiles = files.filter((f) => selectedIds.includes(f.id));

    // Small stagger between downloads for browser compatibility
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const a = document.createElement("a");
      a.href = file.path;
      a.download = file.path.split("/").pop() || "file.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (i < selectedFiles.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setState("success");
    setTimeout(() => setState("idle"), 2000);
  }, [files, selectedIds, state]);

  const disabled = selectedIds.length === 0;

  return (
    <button
      ref={btnRef}
      className={`magnetic-btn transition-all duration-500 ${
        disabled ? "opacity-30 pointer-events-none" : ""
      } ${state === "success" ? "!bg-[var(--fg)] !text-[var(--bg)]" : ""}`}
      onClick={handleDownload}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || state === "downloading"}
      style={{ minWidth: 200, transition: "transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
    >
      <span className="flex items-center gap-3">
        {state === "idle" && (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download{selectedIds.length > 1 ? ` (${selectedIds.length})` : ""}
          </>
        )}
        {state === "downloading" && (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="animate-spin"
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="31.42" strokeDashoffset="10" />
            </svg>
            Downloading...
          </>
        )}
        {state === "success" && (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Done
          </>
        )}
      </span>
    </button>
  );
}
