"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { songs } from "@/data/songs";

/* ── Hand-drawn line-art record ── */
function VinylDisc() {
  return (
    <svg
      className="vinyl-disc"
      viewBox="0 0 100 100"
      width="62"
      height="62"
      fill="none"
      aria-hidden="true"
    >
      {/* outer edge */}
      <circle cx="50" cy="50" r="47" className="vinyl-edge" />
      {/* grooves */}
      <circle cx="50" cy="50" r="41" className="vinyl-groove" />
      <circle cx="50" cy="50" r="35.5" className="vinyl-groove" />
      <circle cx="50" cy="50" r="30" className="vinyl-groove" />
      <circle cx="50" cy="50" r="24.5" className="vinyl-groove" />
      {/* lead-in tick — makes the spin readable */}
      <line x1="50" y1="35" x2="50" y2="24" className="vinyl-tick" />
      {/* label */}
      <circle cx="50" cy="50" r="15" className="vinyl-label" />
      {/* spindle hole */}
      <circle cx="50" cy="50" r="2.2" className="vinyl-spindle" />
    </svg>
  );
}

/* ── Tonearm, parked / dropped ── */
function Tonearm({ playing }: { playing: boolean }) {
  return (
    <svg
      className={`vinyl-arm ${playing ? "vinyl-arm-down" : ""}`}
      viewBox="0 0 48 60"
      width="40"
      height="50"
      fill="none"
      aria-hidden="true"
    >
      {/* pivot base */}
      <circle cx="39" cy="11" r="4.2" className="vinyl-arm-pivot" />
      <circle cx="39" cy="11" r="1.4" className="vinyl-arm-bolt" />
      {/* arm */}
      <line x1="39" y1="11" x2="17" y2="43" className="vinyl-arm-bar" />
      {/* headshell */}
      <line x1="17" y1="43" x2="12.5" y2="50" className="vinyl-arm-head" />
    </svg>
  );
}

export default function VinylPlayer() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const audioRef = useRef<HTMLAudioElement>(null);

  const song = songs[index];
  const hasCrate = songs.length > 0;

  // Sync <audio> playback with intent
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => {
        // No mp3 yet (or blocked) — keep the vinyl spinning anyway.
      });
    } else {
      audio.pause();
    }
  }, [playing, index]);

  const togglePlay = useCallback(() => {
    if (!hasCrate) return;
    setPlaying((p) => !p);
  }, [hasCrate]);

  const skip = useCallback((dir: 1 | -1) => {
    if (songs.length === 0) return;
    setIndex((i) => (i + dir + songs.length) % songs.length);
    setProgress(0);
  }, []);

  const onTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress(audio.currentTime / audio.duration);
  }, []);

  const onEnded = useCallback(() => {
    if (songs.length > 1) {
      skip(1);
    } else {
      setPlaying(false);
      setProgress(0);
    }
  }, [skip]);

  const deckClass = ["vinyl-deck", playing ? "is-spinning" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="vinyl-player" aria-label="song of the day player">
      <audio
        ref={audioRef}
        src={song?.src}
        preload="none"
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
      />

      {/* Left column — caption, track, progress, controls */}
      <div className="vinyl-left">
        <span className="vinyl-caption">song of the day</span>

        <div className="vinyl-meta">
          <span className="vinyl-title" title={song?.title}>
            {song?.title ?? "empty crate"}
          </span>
          <span className="vinyl-artist">{song?.artist ?? "—"}</span>
        </div>

        <div className="vinyl-progress">
          <div
            className="vinyl-progress-fill"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        {/* Controls */}
        <div className="vinyl-controls">
          <button
            className="vinyl-btn"
            onClick={() => skip(-1)}
            disabled={songs.length < 2}
            aria-label="previous"
            title="previous"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
              <path
                d="M18 5L9 12l9 7V5zM6 5v14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            className={`vinyl-btn vinyl-btn-play ${playing ? "is-playing" : ""}`}
            onClick={togglePlay}
            disabled={!hasCrate}
            aria-label={playing ? "pause" : "play"}
            title={playing ? "pause" : "play"}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                <path
                  d="M8 5v14M16 5v14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                <path d="M8 5l11 7-11 7V5z" fill="currentColor" />
              </svg>
            )}
          </button>

          <button
            className="vinyl-btn"
            onClick={() => skip(1)}
            disabled={songs.length < 2}
            aria-label="next"
            title="next"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
              <path
                d="M6 5l9 7-9 7V5zM18 5v14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Turntable — line art, on the right */}
      <div className={deckClass}>
        <VinylDisc />
        <Tonearm playing={playing} />
      </div>
    </div>
  );
}
