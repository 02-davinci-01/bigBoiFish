"use client";

import { useState, useRef, useCallback, useEffect } from "react";

async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getCanvasFingerprint(): Promise<string | undefined> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    ctx.fillStyle = "#f0e68c";
    ctx.fillRect(0, 0, 256, 128);

    ctx.fillStyle = "#069";
    ctx.font = "15px Arial";
    ctx.fillText("fingerprint:canvas", 2, 20);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.font = "18px Georgia";
    ctx.fillText("BIG BOI FISH 🐡", 4, 45);

    ctx.beginPath();
    ctx.arc(128, 90, 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 0, 128, 0.5)";
    ctx.fill();

    ctx.fillStyle = "#f0f";
    ctx.font = "12px monospace";
    ctx.fillText("Cwm fjord bank glyphs vext quiz", 2, 110);

    const dataUrl = canvas.toDataURL("image/png");
    return await sha256(dataUrl);
  } catch {
    return undefined;
  }
}

function getWebGLInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) return undefined;

    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : undefined;
    const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : undefined;
    const version = gl.getParameter(gl.VERSION);
    const shadingLang = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const extensions = gl.getSupportedExtensions()?.length;

    return { renderer, vendor, version, shadingLang, maxTextureSize, extensions };
  } catch {
    return undefined;
  }
}

async function getAudioFingerprint(): Promise<string | undefined> {
  try {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    const oscillator = ctx.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, ctx.currentTime);
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, ctx.currentTime);
    compressor.knee.setValueAtTime(40, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    oscillator.connect(compressor);
    compressor.connect(ctx.destination);
    oscillator.start(0);

    const rendered = await ctx.startRendering();
    const samples = rendered.getChannelData(0).slice(4500, 5000);
    const str = Array.from(samples).map((v) => v.toFixed(6)).join(",");
    return await sha256(str);
  } catch {
    return undefined;
  }
}

async function getBatteryInfo() {
  try {
    const nav = navigator as unknown as Record<string, unknown>;
    if (typeof nav.getBattery !== "function") return undefined;
    const battery = await (nav.getBattery as () => Promise<{
      level: number;
      charging: boolean;
      chargingTime: number;
      dischargingTime: number;
    }>)();
    return {
      level: Math.round(battery.level * 100),
      charging: battery.charging,
    };
  } catch {
    return undefined;
  }
}

function getStorageEstimate() {
  try {
    if (navigator.storage?.estimate) {
      return navigator.storage.estimate().then((e) => ({
        quota: e.quota ? Math.round(e.quota / 1024 / 1024) : undefined,
        usage: e.usage ? Math.round(e.usage / 1024 / 1024) : undefined,
      }));
    }
  } catch {}
  return Promise.resolve(undefined);
}

function getMediaCapabilities() {
  const checks: Record<string, boolean> = {};
  try {
    const w = window as unknown as Record<string, unknown>;
    checks.webrtc = !!w.RTCPeerConnection;
    checks.webgl = !!document.createElement("canvas").getContext("webgl");
    checks.webgl2 = !!document.createElement("canvas").getContext("webgl2");
    checks.webAudio = !!(w.AudioContext || w.webkitAudioContext);
    checks.serviceWorker = "serviceWorker" in navigator;
    checks.webSocket = !!w.WebSocket;
    checks.bluetooth = "bluetooth" in navigator;
    checks.usb = "usb" in navigator;
    checks.midi = "requestMIDIAccess" in navigator;
    checks.gamepad = "getGamepads" in navigator;
    checks.speechSynthesis = "speechSynthesis" in window;
    checks.speechRecognition = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  } catch {}
  return checks;
}

function detectFonts(): string[] {
  const baseFonts = ["monospace", "sans-serif", "serif"] as const;
  const testFonts = [
    "Arial", "Arial Black", "Comic Sans MS", "Courier New", "Georgia",
    "Helvetica", "Impact", "Lucida Console", "Lucida Sans Unicode",
    "Palatino Linotype", "Tahoma", "Times New Roman", "Trebuchet MS",
    "Verdana", "MS Gothic", "MS PGothic", "MS UI Gothic", "Meiryo",
    "Yu Gothic", "Malgun Gothic", "Segoe UI", "Roboto", "Ubuntu",
    "Cantarell", "Noto Sans", "Fira Sans", "SF Pro", "Menlo",
    "Consolas", "Cascadia Code", "JetBrains Mono", "Papyrus",
    "Brush Script MT", "Garamond", "Century Gothic", "Futura",
    "Copperplate", "Rockwell", "Franklin Gothic",
  ];
  const detected: string[] = [];
  try {
    const span = document.createElement("span");
    span.style.position = "absolute";
    span.style.left = "-9999px";
    span.style.fontSize = "72px";
    span.textContent = "mmmmmmmmmmlli";
    document.body.appendChild(span);

    const baseWidths: Record<string, number> = {};
    for (const base of baseFonts) {
      span.style.fontFamily = base;
      baseWidths[base] = span.offsetWidth;
    }

    for (const font of testFonts) {
      let found = false;
      for (const base of baseFonts) {
        span.style.fontFamily = `"${font}", ${base}`;
        if (span.offsetWidth !== baseWidths[base]) {
          found = true;
          break;
        }
      }
      if (found) detected.push(font);
    }

    document.body.removeChild(span);
  } catch {}
  return detected;
}

function getNavigationType(): string {
  try {
    const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entries.length > 0) return entries[0].type;
  } catch {}
  return "unknown";
}

export default function CosmicTransmit() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pageLoadTime = useRef(Date.now());

  useEffect(() => {
    pageLoadTime.current = Date.now();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const btn = btnRef.current;
    if (btn) btn.style.transform = "translate(0, 0)";
  }, []);

  const handleTransmit = async (e: React.MouseEvent) => {
    if (sending) return;
    setSending(true);
    setSent(false);
    try {
      const nav = navigator as unknown as Record<string, unknown>;
      const conn = (nav.connection ?? nav.mozConnection ?? nav.webkitConnection) as
        | { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean }
        | undefined;

      const timeOnPage = Math.round((Date.now() - pageLoadTime.current) / 1000);

      const [canvasHash, audioHash, battery, storage] = await Promise.all([
        getCanvasFingerprint(),
        getAudioFingerprint(),
        getBatteryInfo(),
        getStorageEstimate(),
      ]);

      const webgl = getWebGLInfo();
      const fonts = detectFonts();
      const mediaApis = getMediaCapabilities();

      const orientation = screen.orientation
        ? { type: screen.orientation.type, angle: screen.orientation.angle }
        : undefined;

      const payload = {
        screen: `${screen.width}x${screen.height}`,
        screenAvail: `${screen.availWidth}x${screen.availHeight}`,
        window: `${window.innerWidth}x${window.innerHeight}`,
        outerWindow: `${window.outerWidth}x${window.outerHeight}`,
        dpr: window.devicePixelRatio,
        colorDepth: screen.colorDepth,
        orientation,

        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        language: navigator.language,
        languages: navigator.languages?.join(", "),
        platform: navigator.platform,
        vendor: navigator.vendor,

        touchPoints: navigator.maxTouchPoints,
        deviceMemory: nav.deviceMemory as number | undefined,
        hardwareConcurrency: navigator.hardwareConcurrency,

        connectionType: conn?.effectiveType,
        downlink: conn?.downlink,
        rtt: conn?.rtt,
        saveData: conn?.saveData,

        referrer: document.referrer || undefined,
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
        doNotTrack: navigator.doNotTrack,
        webdriver: nav.webdriver as boolean | undefined,
        pdfViewerEnabled: nav.pdfViewerEnabled as boolean | undefined,

        darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        highContrast: window.matchMedia("(prefers-contrast: high)").matches,

        historyLength: window.history.length,
        navigationType: getNavigationType(),
        tabVisible: document.visibilityState === "visible",

        canvasHash,
        audioHash,
        webgl,
        fonts,
        fontsCount: fonts.length,
        mediaApis,

        battery,
        storage,

        timeOnPage,
        clickX: Math.round(e.clientX),
        clickY: Math.round(e.clientY),
        clickTimestamp: Date.now(),
      };

      await fetch("/api/wave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // silent fail
    }
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 1400);
  };

  const active = sending || sent;

  return (
    <button
      ref={btnRef}
      className={`magnetic-btn cosmic-btn ${sending ? "cosmic-btn-transmitting" : ""} ${sent ? "cosmic-btn-done" : ""}`}
      onClick={handleTransmit}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={sending}
    >
      <span className="cosmic-btn-label">
        {sending ? (
          <>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="animate-spin"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                strokeDasharray="31.42"
                strokeDashoffset="10"
              />
            </svg>
            lightspeed
          </>
        ) : sent ? (
          "lightspeed"
        ) : (
          "transmit to cosmos"
        )}
      </span>
      {!active && (
        <span className="cosmic-tooltip">
          transmit good deeds to the cosmos — it alters with every transmission
        </span>
      )}
    </button>
  );
}
