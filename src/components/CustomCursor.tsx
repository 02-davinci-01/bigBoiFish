"use client";

import { useEffect, useRef } from "react";

const MAX_RINGS = 3;
const SPAWN_INTERVAL = 2400; // ms — one slow pulse every ~2.4s
const RING_MAX_RADIUS = 120; // px — wide gentle expansion
const RING_LIFETIME = 180;   // frames — very slow fade (~3s at 60fps)

interface Ring {
  x: number;
  y: number;
  radius: number;
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
    const rings: Ring[] = [];
    let rafId = 0;
    let lastSpawnTime = 0;

    const spawnRing = (x: number, y: number) => {
      if (rings.length >= MAX_RINGS) rings.shift();
      rings.push({
        x,
        y,
        radius: 0,
        life: 1,
        maxLife: RING_LIFETIME,
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
      }

      dot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`;
    };

    const tick = (time: number) => {
      // Very smooth, lazy cursor follow — like warmth drifting
      cursorX += (mouseX - cursorX) * 0.07;
      cursorY += (mouseY - cursorY) * 0.07;
      cursor.style.transform = `translate(${cursorX - 16}px, ${cursorY - 16}px)`;

      // Spawn rings slowly
      if (hasMouseMoved && time - lastSpawnTime > SPAWN_INTERVAL) {
        spawnRing(mouseX, mouseY);
        lastSpawnTime = time;
      }

      ctx.clearRect(0, 0, w, h);

      if (hasMouseMoved) {
        // Deep breathing glow — very slow 5s sine cycle
        const breathe = 0.5 + 0.5 * Math.sin(time * 0.00125);

        // Outer warmth halo — large soft ambient glow
        const haloRadius = 50 + breathe * 30;
        const haloAlpha = 0.03 + breathe * 0.03;
        const haloGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, haloRadius);
        haloGrad.addColorStop(0, `rgba(220, 190, 90, ${haloAlpha})`);
        haloGrad.addColorStop(0.5, `rgba(210, 180, 80, ${haloAlpha * 0.4})`);
        haloGrad.addColorStop(1, `rgba(210, 180, 80, 0)`);
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // Inner core glow — brighter, tighter
        const coreRadius = 12 + breathe * 6;
        const coreAlpha = 0.12 + breathe * 0.08;
        const coreGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, coreRadius);
        coreGrad.addColorStop(0, `rgba(240, 210, 100, ${coreAlpha})`);
        coreGrad.addColorStop(1, `rgba(210, 180, 80, 0)`);
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        // Subtle sun rays — 8 thin lines radiating outward, rotating slowly
        const rayCount = 8;
        const rotation = time * 0.0002; // very slow spin
        const rayLen = 20 + breathe * 14;
        const rayAlpha = 0.04 + breathe * 0.03;
        ctx.save();
        ctx.translate(mouseX, mouseY);
        ctx.rotate(rotation);
        for (let r = 0; r < rayCount; r++) {
          const angle = (r / rayCount) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
          ctx.lineTo(Math.cos(angle) * rayLen, Math.sin(angle) * rayLen);
          ctx.strokeStyle = `rgba(210, 180, 80, ${rayAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw expanding rings — thin, gentle
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.life -= 1 / r.maxLife;
        // Ease-out expansion: fast start, slow end
        const progress = 1 - r.life;
        r.radius = Math.sqrt(progress) * RING_MAX_RADIUS;

        if (r.life <= 0) {
          rings.splice(i, 1);
          continue;
        }

        const alpha = r.life * 0.2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(210, 180, 80, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.shadowColor = `rgba(210, 180, 80, ${alpha * 0.4})`;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
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
