"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import CustomCursor from "@/components/CustomCursor";
import GrainOverlay from "@/components/GrainOverlay";
import FileSelector, { type PromptFile } from "@/components/FileSelector";
import DownloadButton from "@/components/DownloadButton";
import Toast from "@/components/Toast";
import WeatherWidget from "@/components/WeatherWidget";
import ScrollingMessage from "@/components/ScrollingMessage";
import ImageModal from "@/components/ImageModal";

const PROMPT_FILES: PromptFile[] = [
  {
    id: "cogni-mentor",
    name: "cogni_mentor.json",
    description: "Divine Study Mentor",
    path: "/prompts/cogni_mentor.json",
    size: "4.1 KB",
  },
  {
    id: "exam-mentor",
    name: "exam_mentor.json",
    description: "End-Sem Tutor Assistant",
    path: "/prompts/exam_mentor.json",
    size: "4.3 KB",
  },
  {
    id: "swim-pdf",
    name: "swim_.pdf",
    description: "swim_.pdf",
    path: "/prompts/swim_.pdf",
    size: "847 KB",
  },
  {
    id: "nom-nom-pdf",
    name: "nom_nom_.pdf",
    description: "Bibamus, moriendum est",
    path: "/prompts/nom_nom_.pdf",
    size: "155 KB",
  },
  {
    id: "redbull-pdf",
    name: "redbull_.pdf",
    description: "save a can for me.",
    path: "/prompts/redbull_.pdf",
    size: "68 KB",
  },
];

/* ── Slot Machine Letter ── */
const SLOT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/* ── Hover Scramble: swim_ ↔ U+1F421 ── */
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+_-./\\|#@!?";
const WORD_DEFAULT = "swim";
const WORD_HOVER = "U+1F421";

function SwimText() {
  const [display, setDisplay] = useState(WORD_DEFAULT.split(""));
  const [isHovered, setIsHovered] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const maxLen = Math.max(WORD_DEFAULT.length, WORD_HOVER.length);

  const scrambleTo = useCallback((target: string) => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const padded = target.padEnd(maxLen, " ");

    // Immediately expand display to max length
    setDisplay((prev) => {
      const next = [...prev];
      while (next.length < maxLen) next.push(" ");
      return next;
    });

    for (let i = 0; i < maxLen; i++) {
      const tickCount = 3 + Math.floor(Math.random() * 5);
      for (let t = 0; t < tickCount; t++) {
        const timeout = setTimeout(() => {
          setDisplay((prev) => {
            const next = [...prev];
            next[i] = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            return next;
          });
        }, t * 50 + i * 70);
        timeoutsRef.current.push(timeout);
      }
      // Settle to target char
      const settleTimeout = setTimeout(() => {
        setDisplay((prev) => {
          const next = [...prev];
          next[i] = padded[i];
          return next;
        });
      }, tickCount * 50 + i * 70);
      timeoutsRef.current.push(settleTimeout);
    }
  }, [maxLen]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    scrambleTo(WORD_HOVER);
  }, [scrambleTo]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    scrambleTo(WORD_DEFAULT);
  }, [scrambleTo]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Only render actual visible characters — no spacer spans
  const visibleChars = display.filter(c => c !== " ");
  const targetWord = isHovered ? WORD_HOVER : WORD_DEFAULT;

  return (
    <span
      className={`animate-fade-up delay-2 swim-text swim-hover ${isHovered ? "swim-hover-active" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="swim-chars-inner">
        {visibleChars.map((c, i) => (
          <span
            key={i}
            className={`swim-char ${c !== (targetWord[i] ?? "") ? "swim-char-scrambling" : ""}`}
          >
            {c}
          </span>
        ))}
        {!isHovered && <span className="terminal-cursor">_</span>}
      </span>
    </span>
  );
}

function SlotLetter({
  target,
  delay,
  onSettled,
}: {
  target: string;
  delay: number;
  onSettled?: () => void;
}) {
  const [display, setDisplay] = useState(" ");
  const [settled, setSettled] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Wait for delay, then start rolling
    const startTimeout = setTimeout(() => {
      let ticks = 0;
      const totalTicks = 8 + Math.floor(Math.random() * 6); // 8-14 ticks

      intervalRef.current = setInterval(() => {
        ticks++;
        if (ticks >= totalTicks) {
          setDisplay(target);
          setSettled(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          onSettled?.();
        } else {
          setDisplay(
            SLOT_CHARS[Math.floor(Math.random() * SLOT_CHARS.length)]
          );
        }
      }, 60);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [target, delay, onSettled]);

  if (target === " ") {
    return <span className="slot-letter slot-space">&nbsp;</span>;
  }

  return (
    <span className={`slot-letter ${settled ? "slot-settled" : "slot-rolling"}`}>
      {display}
    </span>
  );
}

/* ── Page Loader — Standard Rolodex ── */
function PageLoader() {
  const TITLE = "B I G   B O I   F I S H";
  const [phase, setPhase] = useState<'rolodex' | 'light' | 'fadeOut'>('rolodex');
  const [settledCount, setSettledCount] = useState(0);
  const totalLetters = TITLE.replace(/ /g, '').length;

  const onLetterSettled = useCallback(() => {
    setSettledCount((c) => c + 1);
  }, []);

  // All letters settled → lighten background
  useEffect(() => {
    if (phase !== 'rolodex') return;
    if (settledCount >= totalLetters) {
      const t = setTimeout(() => setPhase('light'), 400);
      return () => clearTimeout(t);
    }
  }, [phase, settledCount, totalLetters]);

  // Light phase → fade out
  useEffect(() => {
    if (phase !== 'light') return;
    const t = setTimeout(() => setPhase('fadeOut'), 800);
    return () => clearTimeout(t);
  }, [phase]);

  const loaderClass = [
    'page-loader',
    phase === 'light' ? 'loader-light' : '',
    phase === 'fadeOut' ? 'loader-exit' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={loaderClass}>
      <div className="slot-container">
        <div className="slot-text">
          {TITLE.split("").map((ch, i) => (
            <SlotLetter
              key={i}
              target={ch}
              delay={120 + i * 70}
              onSettled={ch !== ' ' ? onLetterSettled : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const HERO_IMAGE = {
  src: "/images/image.png",
  title: "Liber Eremitae",
  description: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.",
};

export default function Home() {
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [progressHover, setProgressHover] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Progress bar: Jan 30, 2026 → Apr 30, 2026
  const [progressPercent, setProgressPercent] = useState(0);
  const [daysCompleted, setDaysCompleted] = useState(0);
  const [daysLeft, setDaysLeft] = useState(0);
  useEffect(() => {
    const start = new Date('2026-01-30').getTime();
    const end = new Date('2026-05-30').getTime();
    const now = Date.now();
    setProgressPercent(Math.round(Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100)) * 100) / 100);
    const msPerDay = 86400000;
    setDaysCompleted(Math.max(0, Math.floor((now - start) / msPerDay)));
    setDaysLeft(Math.max(0, Math.ceil((end - now) / msPerDay)));
  }, []);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelected(ids);
  }, []);

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: "" });
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleProgressMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
    setProgressHover(true);
  }, []);

  const handleProgressMouseLeave = useCallback(() => {
    setProgressHover(false);
  }, []);

  return (
    <>
      <CustomCursor />
      <GrainOverlay />

      {/* Page loader — slot machine */}
      <PageLoader />

      {/* Thin structural line at top */}
      <div className="top-rule" />

      {/* Weather top-left, Messages top-right */}
      <WeatherWidget />
      <ScrollingMessage />

      {/* Main content — single viewport, no scroll */}
      <div className="page-content">
        {/* Subtle sun radial gradient bg */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(210, 180, 80, 0.06) 0%, #f7f7f8 60%)",
          }}
          aria-hidden="true"
        />
        {/* Pulsing sun wave rings */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            border: '1px solid rgba(210, 180, 80, 0.08)',
            transform: 'translate(-50%, -50%)',
            animation: 'sunWave 4s ease-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            border: '1px solid rgba(210, 180, 80, 0.08)',
            transform: 'translate(-50%, -50%)',
            animation: 'sunWave 4s ease-out 1.3s infinite',
          }} />
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            border: '1px solid rgba(210, 180, 80, 0.08)',
            transform: 'translate(-50%, -50%)',
            animation: 'sunWave 4s ease-out 2.6s infinite',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-2xl">
          {/* Hero Text */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h1
              className="animate-fade-up delay-1 text-shimmer hero-glow"
              style={{
                fontSize: "clamp(2rem, 6vw, 3.5rem)",
                fontWeight: 300,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                lineHeight: 1.1,
              }}
            >
              BIG BOI FISH
            </h1>
            <SwimText />
          </div>

          {/* Image with progress bar cutting through */}
          <div className="animate-fade-up delay-3 image-container" style={{ position: 'relative', width: '100%', maxWidth: 600, marginBottom: 24 }}>
            <button onClick={openModal} className="image-clickable">
              {/* Image behind */}
              <div className="image-accent image-anim" style={{ animationDelay: '2.5s' }}>
                <img
                  src={HERO_IMAGE.src}
                  alt={HERO_IMAGE.title}
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    filter: 'grayscale(100%) contrast(0.8) brightness(1.15)',
                    display: 'block',
                  }}
                />
              </div>
              {/* Label on hover */}
              <div className="reveal-button">
                <div className="reveal-btn">{HERO_IMAGE.title}</div>
              </div>
            </button>
            {/* Progress bar on top, centered vertically */}
            <div className="progress-track-wrapper">
              <div
                className="progress-track progress-hoverable"
                onMouseMove={handleProgressMouseMove}
                onMouseLeave={handleProgressMouseLeave}
              >
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                <span className="progress-label">{Math.round(100 - progressPercent)}% left</span>
              </div>
            </div>
          </div>

          {/* Progress tooltip — fixed, follows cursor */}
          <div
            className="progress-tooltip"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              opacity: progressHover ? 1 : 0,
              pointerEvents: 'none',
            }}
          >
            <div className="progress-tooltip-row">
              <span className="progress-tooltip-label">days completed</span>
              <span className="progress-tooltip-value">{daysCompleted}</span>
            </div>
            <div className="progress-tooltip-row">
              <span className="progress-tooltip-label">days left</span>
              <span className="progress-tooltip-value">{daysLeft}</span>
            </div>
            <div className="progress-tooltip-divider" />
            <div className="progress-tooltip-row">
              <span className="progress-tooltip-label">performance</span>
              <span className="progress-tooltip-value">9.1/10</span>
            </div>
          </div>

          {/* File Selector */}
          <div className="animate-fade-up delay-4 w-full" style={{ maxWidth: 600 }}>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div style={{ flex: 1, minWidth: 0 }}>
                <FileSelector
                  files={PROMPT_FILES}
                  selected={selected}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}>
                <DownloadButton files={PROMPT_FILES} selectedIds={selected} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Subtle April indicator */}
      <div className="april-tag animate-fade-up delay-5">
        <span className="april-sun">&#x2600;</span>
        <span className="april-label">april</span>
      </div>

      {/* Footer — fixed to viewport bottom */}
      <div className="site-footer">
        <span className="footer-text">rendered to reality by&nbsp;</span>
        <span className="footer-text footer-author">divine froggie</span>
        <span className="footer-face">&nbsp;&#x0CA0;&#x256D;&#x256E;&#x0CA0;</span>
      </div>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
      />

      <ImageModal
        isOpen={modalOpen}
        onClose={closeModal}
        imageSrc={HERO_IMAGE.src}
        title={HERO_IMAGE.title}
        description={HERO_IMAGE.description}
      />
    </>
  );
}
