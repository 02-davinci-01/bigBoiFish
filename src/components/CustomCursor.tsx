"use client";

import { useEffect, useRef } from "react";

const PETAL_CHARS = ["\u2740", "\u2741", "\u2743", "\u273F", "\u2727"];
const MAX_PETALS = 18;
const SPAWN_DIST_SQ = 40 * 40; // squared px distance before spawning

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotV: number;
  size: number;
  char: string;
  life: number;
  maxLife: number;
}

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const canvas = canvasRef.current;
    if (!cursor || !dot || !canvas) return;

    const ctx = canvas.getContext("2d")!;
    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener("resize", onResize);

    cursor.style.opacity = "0";
    dot.style.opacity = "0";

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let hasMouseMoved = false;
    let lastSpawnX = 0;
    let lastSpawnY = 0;
    const petals: Petal[] = [];
    let rafId = 0;

    const spawnPetal = (x: number, y: number) => {
      if (petals.length >= MAX_PETALS) petals.shift();
      petals.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0.3 + Math.random() * 0.5,
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 3,
        size: 8 + Math.random() * 5,
        char: PETAL_CHARS[Math.floor(Math.random() * PETAL_CHARS.length)],
        life: 1,
        maxLife: 60 + Math.floor(Math.random() * 40), // frames
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!hasMouseMoved) {
        hasMouseMoved = true;
        cursorX = mouseX;
        cursorY = mouseY;
        cursor.style.transform = `translate(${cursorX - 16}px, ${cursorY - 16}px)`;
        cursor.style.opacity = "1";
        dot.style.opacity = "1";
        lastSpawnX = mouseX;
        lastSpawnY = mouseY;
      }

      dot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`;

      const dx = mouseX - lastSpawnX;
      const dy = mouseY - lastSpawnY;
      if (dx * dx + dy * dy > SPAWN_DIST_SQ) {
        spawnPetal(mouseX, mouseY);
        lastSpawnX = mouseX;
        lastSpawnY = mouseY;
      }
    };

    const tick = () => {
      // Smooth follow ring
      cursorX += (mouseX - cursorX) * 0.12;
      cursorY += (mouseY - cursorY) * 0.12;
      cursor.style.transform = `translate(${cursorX - 16}px, ${cursorY - 16}px)`;

      // Draw petals on canvas
      ctx.clearRect(0, 0, w, h);
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) {
          petals.splice(i, 1);
          continue;
        }

        const alpha = p.life * 0.5;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(244, 163, 187, ${alpha})`;
        ctx.shadowColor = `rgba(244, 163, 187, ${alpha * 0.5})`;
        ctx.shadowBlur = 4;
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      }

      rafId = requestAnimationFrame(tick);
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
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="petal-canvas" />
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={dotRef} className="custom-cursor-dot" />
    </>
  );
}
