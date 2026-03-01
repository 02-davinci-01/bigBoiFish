"use client";

import { useEffect, useRef, useCallback } from "react";

const PETAL_CHARS = ["\u2740", "\u2741", "\u2743", "\u273F", "\u2727"];
const PETAL_POOL_SIZE = 30;
const SPAWN_DISTANCE = 24; // px moved before spawning a new petal

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const petalContainerRef = useRef<HTMLDivElement>(null);
  const petalPool = useRef<HTMLSpanElement[]>([]);
  const petalIndex = useRef(0);
  const lastPetalPos = useRef({ x: 0, y: 0 });

  const spawnPetal = useCallback((x: number, y: number) => {
    const pool = petalPool.current;
    if (pool.length === 0) return;

    const dx = x - lastPetalPos.current.x;
    const dy = y - lastPetalPos.current.y;
    if (dx * dx + dy * dy < SPAWN_DISTANCE * SPAWN_DISTANCE) return;

    lastPetalPos.current = { x, y };

    const el = pool[petalIndex.current % PETAL_POOL_SIZE];
    petalIndex.current++;

    // Random petal character
    el.textContent = PETAL_CHARS[Math.floor(Math.random() * PETAL_CHARS.length)];

    // Random drift
    const driftX = (Math.random() - 0.5) * 60;
    const fallY = 30 + Math.random() * 50;
    const rotation = Math.random() * 360;
    const duration = 1200 + Math.random() * 800;
    const size = 8 + Math.random() * 6;

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.fontSize = `${size}px`;
    el.style.opacity = "1";
    el.style.transform = `translate(-50%, -50%) rotate(0deg)`;
    el.style.transition = "none";

    // Force reflow then animate
    void el.offsetWidth;
    el.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    el.style.transform = `translate(calc(-50% + ${driftX}px), calc(-50% + ${fallY}px)) rotate(${rotation}deg)`;
    el.style.opacity = "0";
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const petalContainer = petalContainerRef.current;
    if (!cursor || !dot || !petalContainer) return;

    // Build petal pool
    petalPool.current = [];
    for (let i = 0; i < PETAL_POOL_SIZE; i++) {
      const span = document.createElement("span");
      span.className = "cursor-petal";
      petalContainer.appendChild(span);
      petalPool.current.push(span);
    }

    // Start hidden until the mouse actually moves into the page
    cursor.style.opacity = "0";
    dot.style.opacity = "0";

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let hasMouseMoved = false;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!hasMouseMoved) {
        hasMouseMoved = true;
        cursorX = mouseX;
        cursorY = mouseY;
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        cursor.style.opacity = "1";
        dot.style.opacity = "1";
        lastPetalPos.current = { x: mouseX, y: mouseY };
      }

      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;

      // Spawn petal trail
      spawnPetal(mouseX, mouseY);
    };

    const animate = () => {
      cursorX += (mouseX - cursorX) * 0.12;
      cursorY += (mouseY - cursorY) * 0.12;
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      requestAnimationFrame(animate);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.tagName === "INPUT" ||
        target.tagName === "LABEL" ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest(".magnetic-btn") ||
        target.closest(".file-item")
      ) {
        cursor.classList.add("expanded");
        dot.style.opacity = "0";
      } else {
        cursor.classList.remove("expanded");
        dot.style.opacity = "1";
      }
    };

    const onMouseLeave = () => {
      cursor.style.opacity = "0";
      dot.style.opacity = "0";
    };

    const onMouseEnter = () => {
      if (hasMouseMoved) {
        cursor.style.opacity = "1";
        dot.style.opacity = "1";
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      // Clean up petals
      while (petalContainer.firstChild) petalContainer.removeChild(petalContainer.firstChild);
    };
  }, [spawnPetal]);

  return (
    <>
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={dotRef} className="custom-cursor-dot" />
      <div ref={petalContainerRef} className="petal-container" />
    </>
  );
}
