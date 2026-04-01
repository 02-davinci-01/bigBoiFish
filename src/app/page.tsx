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

/* ── Fake hacking lines for the terminal effect ── */
const HACK_LINES = [
  "$ ssh root@192.168.1.1 -p 443",
  "connecting... established.",
  "root@bigboifish:~# cat /etc/shadow",
  "root:$6$xYz...:19842:0:99999:7:::",
  "daemon:*:19842:0:99999:7:::",
  "root@bigboifish:~# nmap -sV 10.0.0.0/24",
  "PORT     STATE SERVICE  VERSION",
  "22/tcp   open  ssh      OpenSSH 9.2",
  "443/tcp  open  ssl      nginx 1.24",
  "root@bigboifish:~# python3 exploit.py --target=*",
  "  [*] Injecting payload... 0x4F 0x50 0x45 0x4E",
  "  [*] Bypassing firewall rules...",
  "  [+] PAYLOAD DELIVERED",
  "  [+] Escalating privileges...",
  "root@bigboifish:~# echo $ACCESS_GRANTED",
  "TRUE",
  "",
  "  ██████╗ ██████╗       ██████╗  █████╗ ██╗   ██╗██╗███╗   ██╗ ██████╗██╗       ██████╗ ██╗",
  "  ██╔═══██╗╚════██╗      ██╔══██╗██╔══██╗██║   ██║██║████╗  ██║██╔════╝██║      ██╔═══██╗██║",
  "  ██║   ██║ █████╔╝█████╗██║  ██║███████║██║   ██║██║██╔██╗ ██║██║     ██║█████╗██║   ██║██║",
  "  ██║   ██║██╔═══╝ ╚════╝██║  ██║██╔══██║╚██╗ ██╔╝██║██║╚██╗██║██║     ██║╚════╝██║   ██║██║",
  "  ╚██████╔╝███████╗      ██████╔╝██║  ██║ ╚████╔╝ ██║██║ ╚████║╚██████╗██║      ╚██████╔╝██║",
  "   ╚═════╝ ╚══════╝      ╚═════╝ ╚═╝  ╚═╝  ╚═══╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝       ╚═════╝ ╚═╝",
  "",
  "  >> 02-davinci-01 has hacked your system <<",
  "",
];

/* ── Page Loader — Rolodex → Glitch → Hacking Terminal ── */
function PageLoader() {
  const TITLE = "B I G   B O I   F I S H";
  const [phase, setPhase] = useState<'rolodex' | 'glitch' | 'hacking' | 'prompt' | 'aprilFools' | 'fadeOut'>('rolodex');
  const [settledCount, setSettledCount] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showAprilMsg, setShowAprilMsg] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const totalLetters = TITLE.replace(/ /g, '').length;

  // Once enough rolodex letters settle (~60%), trigger glitch
  const onLetterSettled = useCallback(() => {
    setSettledCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (phase !== 'rolodex') return;
    const threshold = Math.floor(totalLetters * 0.55);
    if (settledCount >= threshold) {
      // Start glitch effect
      setGlitchActive(true);
      const t = setTimeout(() => {
        setPhase('hacking');
        setGlitchActive(false);
      }, 1400); // glitch lasts 1.4s
      return () => clearTimeout(t);
    }
  }, [phase, settledCount, totalLetters]);

  // Phase: Print hacking lines one by one
  useEffect(() => {
    if (phase !== 'hacking') return;
    if (visibleLines >= HACK_LINES.length) {
      const t = setTimeout(() => setPhase('prompt'), 600);
      return () => clearTimeout(t);
    }
    const line = HACK_LINES[visibleLines];
    const isArt = line.includes('██') || line.includes('╗') || line.includes('╚') || line === '';
    const delay = isArt ? 60 : 50 + Math.random() * 80;
    const t = setTimeout(() => setVisibleLines((v) => v + 1), delay);
    return () => clearTimeout(t);
  }, [phase, visibleLines]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [visibleLines, phase]);

  // Focus input when prompt phase starts
  useEffect(() => {
    if (phase === 'prompt') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  // Handle name submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim().toLowerCase() === 'goldfish') {
      setShowAprilMsg(true);
      setTimeout(() => setPhase('aprilFools'), 100);
    } else {
      setInputValue('');
      inputRef.current?.focus();
    }
  }, [inputValue]);

  // After april fools message, fade out
  useEffect(() => {
    if (phase !== 'aprilFools') return;
    const t = setTimeout(() => setPhase('fadeOut'), 2800);
    return () => clearTimeout(t);
  }, [phase]);

  const isHackPhase = phase === 'hacking' || phase === 'prompt' || phase === 'aprilFools';

  const loaderClass = [
    'page-loader',
    isHackPhase ? 'hack-terminal' : '',
    phase === 'fadeOut' ? 'loader-exit' : '',
    glitchActive ? 'glitch-active' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={loaderClass}>
      {/* ── Rolodex phase ── */}
      {(phase === 'rolodex' || glitchActive) && (
        <div className={`slot-container ${glitchActive ? 'glitch-text' : ''}`}>
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
      )}

      {/* ── Hacking terminal phase ── */}
      {isHackPhase && (
        <div className="hack-screen" ref={terminalRef}>
          <div className="hack-scanline" />
          <div className="hack-lines">
            {HACK_LINES.slice(0, visibleLines).map((line, i) => (
              <div key={i} className={`hack-line ${line.includes('██') || line.includes('╗') || line.includes('╚') ? 'hack-ascii' : ''} ${line.includes('>>') ? 'hack-highlight' : ''}`}>
                {line || '\u00A0'}
              </div>
            ))}
          </div>

          {/* Prompt: enter name */}
          {phase === 'prompt' && !showAprilMsg && (
            <div className="hack-prompt">
              <div className="hack-line">{'>'} enter your name to regain access:</div>
              <form onSubmit={handleSubmit} className="hack-input-row">
                <span className="hack-caret">{'>'}</span>
                <input
                  ref={inputRef}
                  type="text"
                  className="hack-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </form>
            </div>
          )}

          {/* April fools reveal */}
          {showAprilMsg && (
            <div className="hack-april">
              <div className="hack-line hack-april-line">{'>'} goldFish</div>
              <div className="hack-line">&nbsp;</div>
              <div className="hack-line hack-hehe">hehehehe</div>
              <div className="hack-line hack-hehe">april fools day :&#41;</div>
            </div>
          )}
        </div>
      )}
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
