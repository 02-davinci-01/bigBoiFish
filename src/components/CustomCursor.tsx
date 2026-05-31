"use client";

import { useEffect, useRef } from "react";

const MAX_PARTICLES = 24;
const MOVE_SPAWN_DIST = 50;
const DRAG_SPAWN_DIST = 25;
const PARTICLE_LIFETIME = 160;

interface SunParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  rays: number;
}

function drawMiniSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number,
  rotation: number,
  rays: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;

  const r = size * 0.3;

  // outer glow
  const glow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, size * 0.7);
  glow.addColorStop(0, `rgba(255, 160, 50, ${alpha * 0.4})`);
  glow.addColorStop(1, `rgba(255, 120, 20, 0)`);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // core
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 170, 60, ${alpha * 0.9})`;
  ctx.fill();

  // rays
  const rayLen = size * 0.35;
  ctx.strokeStyle = `rgba(255, 140, 40, ${alpha * 0.5})`;
  ctx.lineWidth = size * 0.06;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const inner = r + size * 0.08;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * (inner + rayLen), Math.sin(angle) * (inner + rayLen));
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
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
    let isMouseDown = false;
    const particles: SunParticle[] = [];
    let rafId = 0;
    let lastSpawnX = 0;
    let lastSpawnY = 0;

    const spawnParticle = (x: number, y: number) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.3,
        life: 1,
        maxLife: PARTICLE_LIFETIME,
        size: 6 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        rays: 5 + Math.floor(Math.random() * 4),
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!hasMouseMoved) {
        hasMouseMoved = true;
        cursorX = mouseX;
        cursorY = mouseY;
        lastSpawnX = mouseX;
        lastSpawnY = mouseY;
        cursor.style.transform = `translate(${cursorX - 16}px, ${cursorY - 16}px)`;
        cursor.style.opacity = "1";
        dot.style.opacity = "1";
      }

      dot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`;

      const dx = mouseX - lastSpawnX;
      const dy = mouseY - lastSpawnY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = isMouseDown ? DRAG_SPAWN_DIST : MOVE_SPAWN_DIST;
      if (dist > threshold) {
        spawnParticle(mouseX, mouseY);
        lastSpawnX = mouseX;
        lastSpawnY = mouseY;
      }
    };

    const onMouseDown = () => { isMouseDown = true; };
    const onMouseUp = () => { isMouseDown = false; };

    const tick = (time: number) => {
      cursorX += (mouseX - cursorX) * 0.07;
      cursorY += (mouseY - cursorY) * 0.07;
      cursor.style.transform = `translate(${cursorX - 16}px, ${cursorY - 16}px)`;

      ctx.clearRect(0, 0, w, h);

      if (hasMouseMoved) {
        const breathe = 0.5 + 0.5 * Math.sin(time * 0.002);
        const vibrate = Math.sin(time * 0.015) * 1.5;

        const cx = mouseX + vibrate;
        const cy = mouseY + vibrate * 0.7;

        // warm ambient glow
        const haloRadius = 40 + breathe * 20;
        const haloAlpha = 0.03 + breathe * 0.025;
        const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloRadius);
        haloGrad.addColorStop(0, `rgba(255, 160, 50, ${haloAlpha})`);
        haloGrad.addColorStop(0.5, `rgba(255, 120, 30, ${haloAlpha * 0.4})`);
        haloGrad.addColorStop(1, `rgba(255, 100, 20, 0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // inner core
        const coreRadius = 8 + breathe * 4;
        const coreAlpha = 0.12 + breathe * 0.06;
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
        coreGrad.addColorStop(0, `rgba(255, 180, 80, ${coreAlpha})`);
        coreGrad.addColorStop(1, `rgba(255, 140, 40, 0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 1 / p.maxLife;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.006;
        p.rotation += p.rotSpeed;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = Math.min(p.life * 2, 1) * 0.5;
        drawMiniSun(ctx, p.x, p.y, p.size, alpha, p.rotation, p.rays);
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
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
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
