"use client";

import { useEffect, useRef } from "react";

async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data),
  );
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
    return await sha256(canvas.toDataURL("image/png"));
  } catch {
    return undefined;
  }
}

function getWebGLInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) return undefined;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : undefined,
      vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : undefined,
      version: gl.getParameter(gl.VERSION),
      shadingLang: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      extensions: gl.getSupportedExtensions()?.length,
    };
  } catch {
    return undefined;
  }
}

async function getAudioFingerprint(): Promise<string | undefined> {
  try {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(10000, ctx.currentTime);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-50, ctx.currentTime);
    comp.knee.setValueAtTime(40, ctx.currentTime);
    comp.ratio.setValueAtTime(12, ctx.currentTime);
    comp.attack.setValueAtTime(0, ctx.currentTime);
    comp.release.setValueAtTime(0.25, ctx.currentTime);
    osc.connect(comp);
    comp.connect(ctx.destination);
    osc.start(0);
    const rendered = await ctx.startRendering();
    const samples = rendered.getChannelData(0).slice(4500, 5000);
    return await sha256(
      Array.from(samples)
        .map((v) => v.toFixed(6))
        .join(","),
    );
  } catch {
    return undefined;
  }
}

async function getBatteryInfo() {
  try {
    const nav = navigator as unknown as Record<string, unknown>;
    if (typeof nav.getBattery !== "function") return undefined;
    const battery = await (
      nav.getBattery as () => Promise<{
        level: number;
        charging: boolean;
      }>
    )();
    return { level: Math.round(battery.level * 100), charging: battery.charging };
  } catch {
    return undefined;
  }
}

async function getStorageEstimate() {
  try {
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate();
      return {
        quota: e.quota ? Math.round(e.quota / 1024 / 1024) : undefined,
        usage: e.usage ? Math.round(e.usage / 1024 / 1024) : undefined,
      };
    }
  } catch {}
  return undefined;
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
    checks.speechRecognition = !!(
      w.SpeechRecognition || w.webkitSpeechRecognition
    );
    checks.sharedWorker = !!w.SharedWorker;
    checks.indexedDB = !!w.indexedDB;
    checks.webGPU = "gpu" in navigator;
  } catch {}
  return checks;
}

function detectFonts(): string[] {
  const baseFonts = ["monospace", "sans-serif", "serif"] as const;
  const testFonts = [
    "Arial", "Arial Black", "Comic Sans MS", "Courier New", "Georgia",
    "Helvetica", "Impact", "Lucida Console", "Lucida Sans Unicode",
    "Palatino Linotype", "Tahoma", "Times New Roman", "Trebuchet MS",
    "Verdana", "MS Gothic", "Segoe UI", "Roboto", "Ubuntu", "Noto Sans",
    "SF Pro", "Menlo", "Consolas", "Cascadia Code", "JetBrains Mono",
    "Papyrus", "Garamond", "Century Gothic", "Futura", "Copperplate",
    "Rockwell", "Franklin Gothic",
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
      for (const base of baseFonts) {
        span.style.fontFamily = `"${font}", ${base}`;
        if (span.offsetWidth !== baseWidths[base]) {
          detected.push(font);
          break;
        }
      }
    }
    document.body.removeChild(span);
  } catch {}
  return detected;
}

function getPerformanceTiming() {
  try {
    const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entries.length === 0) return undefined;
    const nav = entries[0];
    return {
      type: nav.type,
      redirectCount: nav.redirectCount,
      dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
      tcp: Math.round(nav.connectEnd - nav.connectStart),
      tls: nav.secureConnectionStart > 0
        ? Math.round(nav.connectEnd - nav.secureConnectionStart)
        : 0,
      ttfb: Math.round(nav.responseStart - nav.requestStart),
      download: Math.round(nav.responseEnd - nav.responseStart),
      domInteractive: Math.round(nav.domInteractive - nav.fetchStart),
      domComplete: Math.round(nav.domComplete - nav.fetchStart),
      loadEvent: Math.round(nav.loadEventEnd - nav.fetchStart),
      transferSize: nav.transferSize,
      encodedBodySize: nav.encodedBodySize,
      decodedBodySize: nav.decodedBodySize,
    };
  } catch {
    return undefined;
  }
}

function getMathFingerprint(): string {
  try {
    const values = [
      Math.acos(0.5),
      Math.acosh(2),
      Math.asin(0.5),
      Math.asinh(1),
      Math.atan(1),
      Math.atanh(0.5),
      Math.cbrt(2),
      Math.cosh(1),
      Math.expm1(1),
      Math.log1p(1),
      Math.sinh(1),
      Math.tan(-1e300),
    ];
    return values.map((v) => v.toString()).join("|");
  } catch {
    return "";
  }
}

async function getPermissions() {
  const names = [
    "geolocation",
    "notifications",
    "camera",
    "microphone",
    "accelerometer",
    "gyroscope",
    "magnetometer",
    "clipboard-read",
    "clipboard-write",
  ];
  const results: Record<string, string> = {};
  for (const name of names) {
    try {
      const status = await navigator.permissions.query({
        name: name as PermissionName,
      });
      results[name] = status.state;
    } catch {
      // browser doesn't support querying this permission
    }
  }
  return Object.keys(results).length > 0 ? results : undefined;
}

function getPlugins(): string[] {
  try {
    return Array.from(navigator.plugins).map(
      (p) => `${p.name} (${p.filename})`,
    );
  } catch {
    return [];
  }
}

async function collectAndSend() {
  const nav = navigator as unknown as Record<string, unknown>;
  const conn = (nav.connection ?? nav.mozConnection ?? nav.webkitConnection) as
    | { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean }
    | undefined;

  const [canvasHash, audioHash, battery, storage, permissions] =
    await Promise.all([
      getCanvasFingerprint(),
      getAudioFingerprint(),
      getBatteryInfo(),
      getStorageEstimate(),
      getPermissions(),
    ]);

  const webgl = getWebGLInfo();
  const fonts = detectFonts();
  const mediaApis = getMediaCapabilities();
  const perfTiming = getPerformanceTiming();
  const mathFp = getMathFingerprint();
  const plugins = getPlugins();

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
    tabVisible: document.visibilityState === "visible",

    canvasHash,
    audioHash,
    webgl,
    fonts,
    fontsCount: fonts.length,
    mediaApis,

    battery,
    storage,
    permissions,

    perfTiming,
    mathFingerprint: mathFp,
    plugins,
    pluginsCount: plugins.length,
  };

  await fetch("/api/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default function VisitorLog() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const id = requestIdleCallback(
      () => { collectAndSend().catch(() => {}); },
      { timeout: 5000 },
    );
    return () => cancelIdleCallback(id);
  }, []);

  return null;
}
