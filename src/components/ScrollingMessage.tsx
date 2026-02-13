"use client";

import { useEffect, useState, useRef } from "react";
import { tickerMessages } from "@/data/messages";

export default function ScrollingMessage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealCount, setRevealCount] = useState(0);
  const [isErasing, setIsErasing] = useState(false);
  const [eraseCount, setEraseCount] = useState(0);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const message = tickerMessages[currentIndex];

  useEffect(() => {
    setRevealCount(0);
    setIsErasing(false);
    setEraseCount(0);
    let charIndex = 0;

    // Type out characters from right to left (like cursor writing)
    const typeChar = () => {
      if (charIndex <= message.length) {
        setRevealCount(charIndex);
        charIndex++;
        timeoutRef.current = setTimeout(typeChar, 45);
      } else {
        // Pause, then erase from left (delete key style)
        timeoutRef.current = setTimeout(() => {
          setIsErasing(true);
          let eraseIdx = 0;
          const erase = () => {
            if (eraseIdx <= message.length) {
              setEraseCount(eraseIdx);
              eraseIdx++;
              timeoutRef.current = setTimeout(erase, 25);
            } else {
              setIsErasing(false);
              setEraseCount(0);
              setCurrentIndex((prev) => (prev + 1) % tickerMessages.length);
            }
          };
          erase();
        }, 3000);
      }
    };

    timeoutRef.current = setTimeout(typeChar, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, message]);

  // Split message and render from right to left
  const chars = message.split("");
  const totalChars = chars.length;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMouseX((e.clientX - rect.left) / rect.width);
    }
  };

  const handleMouseLeave = () => {
    setMouseX(null);
  };

  // Fishbowl lens distortion per letter
  const getLetterStyle = (index: number): React.CSSProperties => {
    if (mouseX === null) return {};
    const letterPos = index / totalChars;
    const dist = Math.abs(letterPos - mouseX);
    const radius = 0.15; // lens radius
    if (dist > radius) return {};
    const intensity = 1 - dist / radius;
    const scale = 1 + intensity * 0.7;
    const yOffset = -intensity * 3;
    return {
      transform: `scale(${scale}) translateY(${yOffset}px)`,
      color: `rgba(10, 10, 10, ${0.4 + intensity * 0.6})`,
      transition: 'transform 0.15s ease-out, color 0.15s ease-out',
    };
  };

  return (
    <div
      className="scrolling-message"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <span className="scrolling-message-text">
        {chars.map((char, i) => {
          // Reveal from the end first (right to left)
          const revealIndex = totalChars - i;
          const isRevealed = revealIndex <= revealCount;
          // Erase from the left (delete key: i=0 erased first, then i=1, etc.)
          const isErased = isErasing && i < eraseCount;
          const isVisible = isRevealed && !isErased;
          const fishbowlStyle = getLetterStyle(i);

          if (char === " ") {
            return (
              <span
                key={i}
                className="scrolling-letter-space"
                style={{ visibility: isVisible ? "visible" : "hidden", ...fishbowlStyle }}
              >
                &nbsp;
              </span>
            );
          }
          return (
            <span
              key={i}
              className="scrolling-letter"
              style={{ visibility: isVisible ? "visible" : "hidden", ...fishbowlStyle }}
            >
              {char}
            </span>
          );
        })}
        <span className="scrolling-cursor">_</span>
      </span>
    </div>
  );
}
