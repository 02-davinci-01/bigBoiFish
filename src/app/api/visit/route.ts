import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

/* eslint-disable @typescript-eslint/no-explicit-any */
type ClientPayload = Record<string, any>;

interface GeoData {
  city?: string;
  regionName?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
  org?: string;
  as?: string;
  lat?: number;
  lon?: number;
  zip?: string;
  timezone?: string;
  mobile?: boolean;
  proxy?: boolean;
  hosting?: boolean;
}

function parseUserAgent(ua: string) {
  let browser = "Unknown";
  let browserVersion = "";
  let os = "Unknown";

  if (ua.includes("Firefox/")) {
    browserVersion = ua.split("Firefox/")[1]?.split(" ")[0] ?? "";
    browser = `Firefox ${browserVersion}`;
  } else if (ua.includes("Edg/")) {
    browserVersion = ua.split("Edg/")[1]?.split(" ")[0] ?? "";
    browser = `Edge ${browserVersion}`;
  } else if (ua.includes("OPR/")) {
    browserVersion = ua.split("OPR/")[1]?.split(" ")[0] ?? "";
    browser = `Opera ${browserVersion}`;
  } else if (ua.includes("Chrome/")) {
    browserVersion = ua.split("Chrome/")[1]?.split(" ")[0] ?? "";
    browser = `Chrome ${browserVersion}`;
  } else if (ua.includes("Safari/") && ua.includes("Version/")) {
    browserVersion = ua.split("Version/")[1]?.split(" ")[0] ?? "";
    browser = `Safari ${browserVersion}`;
  }

  if (ua.includes("iPhone")) os = "iOS (iPhone)";
  else if (ua.includes("iPad")) os = "iOS (iPad)";
  else if (ua.includes("Android")) os = "Android " + (ua.match(/Android ([\d.]+)/)?.[1] ?? "");
  else if (ua.includes("Mac OS X")) os = "macOS " + (ua.match(/Mac OS X ([\d_.]+)/)?.[1]?.replace(/_/g, ".") ?? "");
  else if (ua.includes("Windows NT 10")) os = "Windows 10/11";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("CrOS")) os = "Chrome OS";

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  return { browser, os, isMobile };
}

async function getGeoData(ip: string): Promise<GeoData | null> {
  if (ip === "unknown" || ip === "::1" || ip === "127.0.0.1") return null;
  try {
    const cleanIp = ip.split(",")[0].trim();
    const res = await fetch(
      `http://ip-api.com/json/${cleanIp}?fields=city,regionName,country,countryCode,isp,org,as,lat,lon,zip,timezone,mobile,proxy,hosting`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function yn(val: unknown): string {
  if (val === true) return "Yes";
  if (val === false) return "No";
  return "—";
}

export async function POST(req: Request) {
  await redis.incr("visit:total");
  // await sendNotification(req);
  return NextResponse.json({ ok: true });
}

async function sendNotification(req: Request) {
  const topic = process.env.NTFY_VISIT_TOPIC;
  if (!topic) return;

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  const acceptLang = req.headers.get("accept-language") || "—";
  const refererHeader = req.headers.get("referer") || "—";
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  let c: ClientPayload = {};
  try {
    c = await req.json();
  } catch {}

  const { browser, os, isMobile } = parseUserAgent(ua);
  const geo = await getGeoData(ip);

  const deviceType = (c.touchPoints ?? 0) > 0 || isMobile ? "Mobile" : "Desktop";
  const loc = geo ? [geo.city, geo.regionName, geo.country].filter(Boolean).join(", ") : "Unknown";

  const lines: string[] = [];
  const section = (title: string) => { lines.push("", `━━ ${title} ━━`); };

  section("IDENTITY");
  lines.push(`Time: ${time}`);
  lines.push(`IP: ${ip}`);
  if (c.canvasHash) lines.push(`Canvas FP: ${c.canvasHash.slice(0, 16)}…`);
  if (c.audioHash) lines.push(`Audio FP: ${c.audioHash.slice(0, 16)}…`);
  if (c.canvasHash && c.audioHash) {
    lines.push(`Combined ID: ${c.canvasHash.slice(0, 8)}-${c.audioHash.slice(0, 8)}`);
  }
  if (c.mathFingerprint) {
    const mathHash = c.mathFingerprint.length > 40
      ? c.mathFingerprint.slice(0, 40) + "…"
      : c.mathFingerprint;
    lines.push(`Math FP: ${mathHash}`);
  }

  section("LOCATION");
  lines.push(`Location: ${loc}`);
  if (geo?.zip) lines.push(`ZIP: ${geo.zip}`);
  if (geo?.lat && geo?.lon) lines.push(`Coords: ${geo.lat}, ${geo.lon}`);
  if (geo?.timezone) lines.push(`TZ (IP): ${geo.timezone}`);
  if (c.timezone) lines.push(`TZ (Browser): ${c.timezone}`);
  if (c.timezoneOffset !== undefined) lines.push(`UTC Offset: ${-c.timezoneOffset / 60}h`);
  if (geo?.isp) lines.push(`ISP: ${geo.isp}`);
  if (geo?.org && geo.org !== geo.isp) lines.push(`Org: ${geo.org}`);
  if (geo?.as) lines.push(`AS: ${geo.as}`);
  lines.push(`VPN/Proxy: ${yn(geo?.proxy)}`);
  lines.push(`Hosting: ${yn(geo?.hosting)}`);
  lines.push(`Mobile IP: ${yn(geo?.mobile)}`);

  section("DEVICE");
  lines.push(`Type: ${deviceType}`);
  lines.push(`Browser: ${browser}`);
  lines.push(`OS: ${os}`);
  lines.push(`Platform: ${c.platform || "—"}`);
  lines.push(`Vendor: ${c.vendor || "—"}`);
  if (c.screen) lines.push(`Screen: ${c.screen}`);
  if (c.screenAvail) lines.push(`Avail Screen: ${c.screenAvail}`);
  if (c.window) lines.push(`Viewport: ${c.window}`);
  if (c.outerWindow) lines.push(`Outer Window: ${c.outerWindow}`);
  if (c.dpr) lines.push(`Pixel Ratio: ${c.dpr}x`);
  if (c.colorDepth) lines.push(`Color Depth: ${c.colorDepth}-bit`);
  if (c.orientation) lines.push(`Orientation: ${c.orientation.type} (${c.orientation.angle}°)`);
  lines.push(`Touch Points: ${c.touchPoints ?? "—"}`);
  if (c.hardwareConcurrency) lines.push(`CPU Cores: ${c.hardwareConcurrency}`);
  if (c.deviceMemory) lines.push(`RAM: ~${c.deviceMemory} GB`);
  if (c.battery) {
    lines.push(`Battery: ${c.battery.level}% ${c.battery.charging ? "(charging)" : "(discharging)"}`);
  }

  section("GPU");
  if (c.webgl) {
    lines.push(`Renderer: ${c.webgl.renderer || "—"}`);
    lines.push(`GPU Vendor: ${c.webgl.vendor || "—"}`);
    lines.push(`WebGL: ${c.webgl.version || "—"}`);
    lines.push(`GLSL: ${c.webgl.shadingLang || "—"}`);
    lines.push(`Max Texture: ${c.webgl.maxTextureSize || "—"}`);
    lines.push(`Extensions: ${c.webgl.extensions ?? "—"}`);
  } else {
    lines.push("WebGL: Not available");
  }

  section("NETWORK & LOCALE");
  lines.push(`Language: ${c.language || "—"}`);
  lines.push(`Languages: ${c.languages || acceptLang}`);
  lines.push(`Locale: ${c.locale || "—"}`);
  if (c.connectionType) lines.push(`Connection: ${c.connectionType}`);
  if (c.downlink) lines.push(`Downlink: ${c.downlink} Mbps`);
  if (c.rtt) lines.push(`RTT: ${c.rtt}ms`);
  lines.push(`Save Data: ${yn(c.saveData)}`);
  lines.push(`Online: ${yn(c.online)}`);
  lines.push(`Cookies: ${yn(c.cookiesEnabled)}`);
  lines.push(`DNT: ${c.doNotTrack ?? "—"}`);

  section("PRIVACY & FLAGS");
  lines.push(`Webdriver/Bot: ${yn(c.webdriver)}`);
  lines.push(`Dark Mode: ${yn(c.darkMode)}`);
  lines.push(`Reduced Motion: ${yn(c.reducedMotion)}`);
  lines.push(`High Contrast: ${yn(c.highContrast)}`);
  lines.push(`PDF Viewer: ${yn(c.pdfViewerEnabled)}`);
  if (c.storage) {
    lines.push(`Storage Quota: ${c.storage.quota ?? "—"} MB`);
    lines.push(`Storage Used: ${c.storage.usage ?? "—"} MB`);
  }

  if (c.permissions && Object.keys(c.permissions).length > 0) {
    section("PERMISSIONS");
    for (const [name, state] of Object.entries(c.permissions)) {
      lines.push(`${name}: ${state}`);
    }
  }

  section("PERFORMANCE");
  if (c.perfTiming) {
    const p = c.perfTiming;
    lines.push(`Nav Type: ${p.type || "—"}`);
    lines.push(`Redirects: ${p.redirectCount ?? 0}`);
    lines.push(`DNS: ${p.dns ?? "—"}ms`);
    lines.push(`TCP: ${p.tcp ?? "—"}ms`);
    lines.push(`TLS: ${p.tls ?? "—"}ms`);
    lines.push(`TTFB: ${p.ttfb ?? "—"}ms`);
    lines.push(`Download: ${p.download ?? "—"}ms`);
    lines.push(`DOM Interactive: ${p.domInteractive ?? "—"}ms`);
    lines.push(`DOM Complete: ${p.domComplete ?? "—"}ms`);
    lines.push(`Page Load: ${p.loadEvent ?? "—"}ms`);
    if (p.transferSize) lines.push(`Transfer: ${Math.round(p.transferSize / 1024)} KB`);
    if (p.decodedBodySize) lines.push(`Decoded: ${Math.round(p.decodedBodySize / 1024)} KB`);
  } else {
    lines.push("Not available");
  }

  section("BEHAVIOR");
  lines.push(`History Length: ${c.historyLength ?? "—"}`);
  lines.push(`Tab Visible: ${yn(c.tabVisible)}`);
  if (c.referrer) lines.push(`Referrer: ${c.referrer}`);
  if (refererHeader !== "—") lines.push(`Referer Header: ${refererHeader}`);

  section("FONTS");
  if (c.fonts?.length) {
    lines.push(`Detected (${c.fontsCount}): ${c.fonts.join(", ")}`);
  } else {
    lines.push("None detected");
  }

  if (c.plugins?.length) {
    section("PLUGINS");
    lines.push(c.plugins.join(", "));
  }

  section("API SUPPORT");
  if (c.mediaApis) {
    const supported = Object.entries(c.mediaApis as Record<string, boolean>)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const missing = Object.entries(c.mediaApis as Record<string, boolean>)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (supported.length) lines.push(`✓ ${supported.join(", ")}`);
    if (missing.length) lines.push(`✗ ${missing.join(", ")}`);
  }

  const title = `${loc} | ${deviceType} | ${browser.split(" ")[0]}`;

  await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: {
      Title: title,
      Tags: "eyes",
    },
    body: lines.join("\n"),
  });
}
