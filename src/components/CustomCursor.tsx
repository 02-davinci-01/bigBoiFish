"use client";

import { useEffect, useRef } from "react";

const MAX_FROGS = 20;
const HOVER_SPAWN_INTERVAL = 300;  // ms between timer-based spawns on hover
const MOVE_SPAWN_DIST = 45;        // px of movement before spawning a frog
const DRAG_SPAWN_DIST = 22;        // px during drag (more frogs)
const FROG_LIFETIME = 200;

interface Frog {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotSpeed: number;
}

function drawMiniFrog(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;

  const s = size;

  // body
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(90, 138, 94, ${alpha * 0.7})`;
  ctx.fill();

  // head
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.35, s * 0.35, s * 0.28, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(100, 158, 104, ${alpha * 0.8})`;
  ctx.fill();

  // eyes
  const eyeOffX = s * 0.16;
  const eyeY = -s * 0.45;
  const eyeR = s * 0.09;
  ctx.beginPath();
  ctx.arc(-eyeOffX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.arc(eyeOffX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
  ctx.fill();

  // pupils
  const pupilR = s * 0.045;
  ctx.beginPath();
  ctx.arc(-eyeOffX, eyeY, pupilR, 0, Math.PI * 2);
  ctx.arc(eyeOffX, eyeY, pupilR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(20, 20, 20, ${alpha * 0.9})`;
  ctx.fill();

  // front legs
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, s * 0.1);
  ctx.quadraticCurveTo(-s * 0.65, s * 0.35, -s * 0.45, s * 0.4);
  ctx.moveTo(s * 0.4, s * 0.1);
  ctx.quadraticCurveTo(s * 0.65, s * 0.35, s * 0.45, s * 0.4);
  ctx.strokeStyle = `rgba(80, 128, 84, ${alpha * 0.6})`;
  ctx.lineWidth = s * 0.06;
  ctx.stroke();

  // back legs
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s * 0.25);
  ctx.quadraticCurveTo(-s * 0.7, s * 0.5, -s * 0.5, s * 0.55);
  ctx.moveTo(s * 0.3, s * 0.25);
  ctx.quadraticCurveTo(s * 0.7, s * 0.5, s * 0.5, s * 0.55);
  ctx.strokeStyle = `rgba(80, 128, 84, ${alpha * 0.5})`;
  ctx.lineWidth = s * 0.05;
  ctx.stroke();

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
    let isHovering = false;
    let isMouseDown = false;
    const frogs: Frog[] = [];
    let rafId = 0;
    let lastSpawnTime = 0;
    let lastSpawnX = 0;
    let lastSpawnY = 0;

    const spawnFrog = (x: number, y: number) => {
      if (frogs.length >= MAX_FROGS) frogs.shift();
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.5;
      frogs.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4,
        life: 1,
        maxLife: FROG_LIFETIME,
        size: 8 + Math.random() * 6,
        rotation: (Math.random() - 0.5) * 0.4,
        rotSpeed: (Math.random() - 0.5) * 0.005,
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

      // Movement-based spawning — frogs on all movement
      const dx = mouseX - lastSpawnX;
      const dy = mouseY - lastSpawnY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = isMouseDown ? DRAG_SPAWN_DIST : MOVE_SPAWN_DIST;
      if (dist > threshold) {
        spawnFrog(mouseX, mouseY);
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

      // Timer-based spawning while cursor is active
      if (hasMouseMoved && time - lastSpawnTime > HOVER_SPAWN_INTERVAL) {
        spawnFrog(mouseX, mouseY);
        lastSpawnTime = time;
      }

      ctx.clearRect(0, 0, w, h);

      if (hasMouseMoved) {
        const breathe = 0.5 + 0.5 * Math.sin(time * 0.001);

        // Outer pond glow — soft green ambient
        const haloRadius = 45 + breathe * 25;
        const haloAlpha = 0.025 + breathe * 0.025;
        const haloGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, haloRadius);
        haloGrad.addColorStop(0, `rgba(90, 138, 94, ${haloAlpha})`);
        haloGrad.addColorStop(0.5, `rgba(90, 138, 94, ${haloAlpha * 0.4})`);
        haloGrad.addColorStop(1, `rgba(90, 138, 94, 0)`);
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // Inner core glow
        const coreRadius = 10 + breathe * 5;
        const coreAlpha = 0.1 + breathe * 0.06;
        const coreGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, coreRadius);
        coreGrad.addColorStop(0, `rgba(120, 180, 120, ${coreAlpha})`);
        coreGrad.addColorStop(1, `rgba(90, 138, 94, 0)`);
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();
      }

      // Draw frogs
      for (let i = frogs.length - 1; i >= 0; i--) {
        const f = frogs[i];
        f.life -= 1 / f.maxLife;
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.008;
        f.rotation += f.rotSpeed;

        if (f.life <= 0) {
          frogs.splice(i, 1);
          continue;
        }

        const alpha = Math.min(f.life * 2, 1) * 0.6;
        drawMiniFrog(ctx, f.x, f.y, f.size, alpha, f.rotation);
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
        isHovering = true;
      } else {
        cursor.classList.remove("expanded");
        dot.style.opacity = "1";
        isHovering = false;
      }
    };

    const onMouseLeave = () => {
      cursor.style.opacity = "0";
      dot.style.opacity = "0";
      isHovering = false;
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
