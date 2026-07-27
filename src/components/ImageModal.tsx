"use client";

import { useEffect, useState, useCallback } from "react";
import { GALLERY_ITEMS } from "@/data/gallery";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title: string;
  description: string;
}

/* ── Constellation layout ──────────────────────────────────────────────
 * Hand-placed star positions (% of the field) so the graph reads like a
 * real star map rather than a random scatter. `hub` marks the brightest,
 * central star. Edges are index pairs into this array.
 */
const STAR_POS: { x: number; y: number; hub?: boolean }[] = [
  { x: 16, y: 34 }, // 1
  { x: 27, y: 21 }, // 2
  { x: 40, y: 35 }, // 3
  { x: 22, y: 55 }, // 4
  { x: 37, y: 67 }, // 5
  { x: 52, y: 24 }, // 6
  { x: 50, y: 47, hub: true }, // 7
  { x: 44, y: 77 }, // 8
  { x: 64, y: 64 }, // 9
  { x: 69, y: 33 }, // 10
  { x: 83, y: 47 }, // 11
  { x: 85, y: 25 }, // 12
  { x: 66, y: 81 }, // 13
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 5], [5, 9], [9, 11], [9, 10], [10, 8],
  [8, 6], [6, 2], [2, 3], [3, 0], [3, 4], [4, 7], [7, 12],
  [12, 8], [6, 4], [6, 9], [5, 6],
];

const STARS = GALLERY_ITEMS.map((item, i) => ({
  ...item,
  x: STAR_POS[i].x,
  y: STAR_POS[i].y,
  hub: STAR_POS[i].hub ?? false,
}));

/* Faint background dust — computed once at module load. The constellation only
 * ever mounts client-side (after unlock), so there is no SSR/hydration mismatch. */
const DUST = Array.from({ length: 46 }, (_, key) => ({
  key,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 0.6 + Math.random() * 1.6,
  delay: Math.random() * 4,
  dur: 2.5 + Math.random() * 4,
}));

/* A pulse of light that traces one edge at a time, like a shooting star
 * skimming the constellation. Self-contained rAF so only this node re-renders. */
function EdgePulse() {
  const [p, setP] = useState({ x: 0, y: 0, o: 0 });

  useEffect(() => {
    const pick = (): [number, number] => {
      const e = EDGES[Math.floor(Math.random() * EDGES.length)];
      return Math.random() < 0.5 ? e : [e[1], e[0]];
    };
    const TRAVEL = 1100; // ms to cross an edge
    const GAP = 2600; // ms of dark between pulses
    let edge = pick();
    let startAt = performance.now() + 600;
    let raf = 0;

    const tick = (now: number) => {
      const el = now - startAt;
      if (el < 0) {
        setP((v) => (v.o ? { ...v, o: 0 } : v));
      } else if (el < TRAVEL) {
        const t = el / TRAVEL;
        const a = STARS[edge[0]];
        const b = STARS[edge[1]];
        setP({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          o: Math.sin(t * Math.PI), // fade in at the start star, out at the end
        });
      } else {
        edge = pick();
        startAt = now + GAP;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span
      className="edge-pulse"
      aria-hidden="true"
      style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: p.o }}
    />
  );
}

function Constellation({ onExit }: { onExit: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const select = useCallback((i: number) => {
    setLoaded(false);
    setSelected(i);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      setSelected((s) => {
        if (s === null) return s;
        setLoaded(false);
        return (s + dir + STARS.length) % STARS.length;
      });
    },
    [],
  );

  // Keyboard: arrows navigate the open star, Esc backs out (star → field → modal)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selected !== null) setSelected(null);
        else onExit();
      } else if (selected !== null && e.key === "ArrowRight") {
        step(1);
      } else if (selected !== null && e.key === "ArrowLeft") {
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, step, onExit]);

  const active = selected !== null ? STARS[selected] : null;

  return (
    <div className="constellation">
      <div className="constellation-title">aliam rationem</div>

      {/* drifting dust */}
      <div className="constellation-dust" aria-hidden="true">
        {DUST.map((d) => (
          <span
            key={d.key}
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.dur}s`,
            }}
          />
        ))}
      </div>

      {/* constellation lines */}
      <svg
        className="constellation-lines"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={STARS[a].x}
            y1={STARS[a].y}
            x2={STARS[b].x}
            y2={STARS[b].y}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* shooting-star pulse tracing the edges */}
      <EdgePulse />

      {/* stars */}
      {STARS.map((star, i) => (
        <button
          key={star.id}
          className={`star ${star.hub ? "star-hub" : ""}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animationDelay: `${(i % 6) * 0.4}s`,
          }}
          onClick={() => select(i)}
          aria-label={star.caption}
        >
          <span className="star-core" />
          <span className="star-label">{star.caption}</span>
        </button>
      ))}

      {/* expanded picture */}
      {active && (
        <div
          className="constellation-detail"
          onClick={() => setSelected(null)}
        >
          <button
            className="constellation-nav constellation-prev"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous"
          >
            ‹
          </button>

          <figure
            className="constellation-detail-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="constellation-detail-image-wrap">
              <span className="constellation-loader" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={active.id}
                src={`/api/gallery/${active.id}`}
                alt={active.caption}
                className={`constellation-detail-image ${loaded ? "is-loaded" : ""}`}
                onLoad={() => setLoaded(true)}
              />
            </div>
            <figcaption className="constellation-detail-caption">
              {active.caption}
            </figcaption>
            <span className="constellation-detail-index">
              {String(selected! + 1).padStart(2, "0")} / {STARS.length}
            </span>
          </figure>

          <button
            className="constellation-nav constellation-next"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next"
          >
            ›
          </button>

          <button
            className="constellation-detail-close"
            onClick={() => setSelected(null)}
            aria-label="Back to constellation"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function ImageModal({
  isOpen,
  onClose,
  imageSrc,
  title,
}: ImageModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Auth flow
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      setUnlocked(false);
      setPassword("");
      setError(false);
      onClose();
    }, 480);
  }, [onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (checking || !password) return;
      setChecking(true);
      setError(false);
      try {
        const res = await fetch("/api/gallery/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          setUnlocked(true);
        } else {
          setError(true);
          setPassword("");
        }
      } catch {
        setError(true);
      } finally {
        setChecking(false);
      }
    },
    [checking, password],
  );

  useEffect(() => {
    if (isVisible && !isClosing) {
      document.body.style.overflow = "hidden";
    } else if (!isVisible) {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible, isClosing]);

  // While locked, Esc closes the modal. Once unlocked, the Constellation owns
  // Esc (star → field → close) to avoid two handlers fighting.
  useEffect(() => {
    if (!isVisible || unlocked) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isVisible, unlocked, handleClose]);

  if (!isVisible) return null;

  return (
    <>
      {/* Dark Overlay */}
      <div
        className={`modal-overlay ${isClosing ? "modal-closing" : ""}`}
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        className={`modal-card ${unlocked ? "modal-card-constellation" : ""} ${
          isClosing ? "modal-closing" : ""
        }`}
      >
        {/* Close Button */}
        <button onClick={handleClose} className="modal-close" aria-label="Close">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {unlocked ? (
          <Constellation onExit={handleClose} />
        ) : (
          /* ── Locked: teaser image + password gate ── */
          <>
            <div className="modal-image-wrapper">
              <img src={imageSrc} alt={title} className="modal-image" />
            </div>
            <div className="modal-content">
              <p className="modal-subtitle">divine froggie</p>
              <h3 className="modal-title" style={{ marginBottom: 18 }}>
                {title}
              </h3>
              <form className="gallery-gate" onSubmit={handleSubmit}>
                <label className="gallery-gate-label">
                  the cosmos is yours if you spell your name
                </label>
                <div className="gallery-gate-row">
                  <input
                    type="password"
                    className={`gallery-gate-input ${error ? "gallery-gate-error" : ""}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(false);
                    }}
                    placeholder={error ? "not your name" : "your name"}
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    className="gallery-gate-submit"
                    disabled={checking || !password}
                  >
                    {checking ? "…" : "enter"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
