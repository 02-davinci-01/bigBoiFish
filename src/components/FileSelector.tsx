"use client";

import { useState, useRef, useEffect } from "react";

export interface PromptFile {
  id: string;
  name: string;
  description: string;
  path: string;
  size: string;
}

interface FileSelectorProps {
  files: PromptFile[];
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function FileSelector({ files, selected, onSelectionChange }: FileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleFile = (id: string) => {
    if (selected.includes(id)) {
      onSelectionChange(selected.filter((s) => s !== id));
    } else {
      onSelectionChange([...selected, id]);
    }
  };

  const toggleAll = () => {
    if (selected.length === files.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(files.map((f) => f.id));
    }
  };

  const selectedCount = selected.length;

  return (
    <div ref={containerRef} className="w-full" style={{ position: 'relative', maxWidth: '320px' }}>
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="magnetic-btn w-full justify-between gap-3"
        style={{ padding: "14px 24px" }}
      >
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="relative z-[1]">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          {selectedCount === 0
            ? "Select files"
            : `${selectedCount} file${selectedCount > 1 ? "s" : ""} selected`}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`relative z-[1] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Panel — absolutely positioned to avoid layout shift */}
      <div
        className={`transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          zIndex: 40,
          transform: isOpen ? 'translateY(0) scaleY(1)' : 'translateY(-8px) scaleY(0.95)',
          transformOrigin: 'top center',
          transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <div className="file-selector">
          {/* Select All */}
          <label className="file-item" style={{ borderBottom: "1px solid #e4e4e7" }}>
            <input
              type="checkbox"
              checked={selected.length === files.length}
              onChange={toggleAll}
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--grey)" }}>
                Select All
              </span>
            </div>
          </label>

          {/* File Items */}
          {files.map((file) => (
            <label key={file.id} className="file-item">
              <input
                type="checkbox"
                checked={selected.includes(file.id)}
                onChange={() => toggleFile(file.id)}
              />
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-medium tracking-wide truncate" style={{ fontFamily: 'var(--font-mono)' }}>
                  {file.name}
                </span>
                <span className="text-xs tracking-wide" style={{ color: "var(--grey-light)" }}>
                  {file.description}
                </span>
              </div>
              <span className="text-xs font-light tabular-nums" style={{ color: "var(--grey-light)", fontFamily: 'var(--font-mono)' }}>
                {file.size}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
