"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * "Chop wood, carry water." A little colored pixel sprite that lives along the
 * top edge: he chops at one end, shoulders his water buckets and walks to the
 * other end, chops again, and carries the water back — forever. A bead of sweat
 * flicks off his brow now and then — honest work.
 *
 * Everything is drawn on a 16×16 pixel grid. Motion is real sprite animation:
 * two frames per action, cross-faded by CSS so the pixels never smear.
 */

type Mode = "chop" | "water";
type Dir = "left" | "right";

interface Step {
  mode: Mode;
  dir: Dir;
  pos: "left" | "right";
  duration: number; // ms this step lasts
  walk: number; // ms the horizontal glide takes (0 = stay put)
}

const LEFT = "24px";
const RIGHT = "calc(100% - 300px)"; // clear of the vinyl bar on the right

const STEPS: Step[] = [
  { mode: "chop", dir: "right", pos: "left", duration: 3600, walk: 0 },
  { mode: "water", dir: "right", pos: "right", duration: 4600, walk: 4600 },
  { mode: "chop", dir: "left", pos: "right", duration: 3600, walk: 0 },
  { mode: "water", dir: "left", pos: "left", duration: 4600, walk: 4600 },
];

/* ── Pixel palette ── */
const PX: Record<string, string> = {
  k: "#3a2a1a", // dark brown — hat, boots, belt, block edge
  s: "#e0a878", // skin
  e: "#d9d4c7", // beard / grey
  g: "#5a8a5e", // green tunic (site accent)
  p: "#6b5335", // brown trousers
  h: "#8a5a3b", // wood — pole / handle / bucket
  o: "#a06a3f", // light wood — block top
  a: "#c8ccd0", // axe blade / metal
  w: "#4a90d9", // water
};

/* Render a pixel map (array of equal-length strings) into <rect>s. */
function Px({ rows }: { rows: string[] }) {
  const out: React.ReactElement[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === " ") continue;
      const fill = PX[ch];
      if (!fill) continue;
      out.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />,
      );
    }
  });
  return <>{out}</>;
}

/* ── Shared upper body for the water-carrier ── */
const WATER_BASE = [
  "                ",
  "     kkkkk      ",
  "    ksssssk     ",
  "     sksks      ",
  "     eeeee      ",
  " hhhhhhhhhhhhhh ",
  "  h  ggggg   h  ",
  " hhh ggggg  hhh ",
  " hwh ggggg  hwh ",
  " hwh ggggg  hwh ",
  " hhh kkkkk  hhh ",
  "     ppppp      ",
];

const WATER_LEGS_A = [
  "            ",
  "            ",
  "            ",
  "            ",
  "            ",
  "            ",
  "            ",
  "            ",
  "            ",
  "            ",
  "            ",
  "            ",
  "    pp    pp    ",
  "    pp    pp    ",
  "    kk    kk    ",
];

const WATER_LEGS_B = [
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "     pp  pp     ",
  "     pp  pp     ",
  "     kk  kk     ",
];

/* ── Shared body for the chopper (planted legs + chopping block) ── */
const CHOP_BASE = [
  "                ",
  "     kkkkk      ",
  "    ksssssk     ",
  "     sksks      ",
  "     eeeee      ",
  "     ggggg      ",
  "    ggggggg     ",
  "     ggggg      ",
  "     ggggg      ",
  "     ggggg      ",
  "     kkkkk      ",
  "     ppppp      ",
  "     pp pp ooooo",
  "     pp pp hhhhh",
  "     kk kk hhhhh",
  "           hhohh",
];

const CHOP_AXE_UP = [
  "                ",
  "              a ",
  "             aa ",
  "             h  ",
  "            h   ",
  "           h    ",
  "         ss     ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
];

const CHOP_AXE_DOWN = [
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "         s      ",
  "          s     ",
  "           h    ",
  "            h   ",
  "            aa  ",
  "             a  ",
  "                ",
  "                ",
  "                ",
];

function WaterSprite() {
  return (
    <svg className="wc-svg" viewBox="0 0 16 16" width="44" height="44">
      <Px rows={WATER_BASE} />
      <g className="wc-frame-a">
        <Px rows={WATER_LEGS_A} />
      </g>
      <g className="wc-frame-b">
        <Px rows={WATER_LEGS_B} />
      </g>
    </svg>
  );
}

function ChopSprite() {
  return (
    <svg className="wc-svg" viewBox="0 0 16 16" width="44" height="44">
      <Px rows={CHOP_BASE} />
      <g className="wc-frame-a">
        <Px rows={CHOP_AXE_UP} />
      </g>
      <g className="wc-frame-b">
        <Px rows={CHOP_AXE_DOWN} />
      </g>
    </svg>
  );
}

export default function Woodcutter() {
  const [step, setStep] = useState(0);
  const [hovered, setHovered] = useState(false);
  // While hovered we pin the sprite to the exact spot it was caught mid-stride.
  const [frozen, setFrozen] = useState<{ left: string; center: number } | null>(
    null,
  );
  const figureRef = useRef<HTMLDivElement>(null);

  // Advance the chop → carry loop, but hold still while someone is watching.
  useEffect(() => {
    if (hovered) return;
    const current = STEPS[step];
    const t = setTimeout(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, current.duration);
    return () => clearTimeout(t);
  }, [step, hovered]);

  const handleEnter = useCallback(() => {
    const el = figureRef.current;
    if (el) {
      // Current interpolated left, so a mid-walk sprite stops where it stands.
      const left = getComputedStyle(el).left;
      // Centre the tooltip over the sprite, clamped so it never runs off-screen.
      const center = Math.max(
        100,
        Math.min(window.innerWidth - 100, parseFloat(left) + 22),
      );
      setFrozen({ left, center });
    }
    setHovered(true);
  }, []);

  const handleLeave = useCallback(() => {
    setHovered(false);
    setFrozen(null);
  }, []);

  const current = STEPS[step];
  const figureClass = [
    "wc-figure",
    current.mode === "chop" ? "wc-chop" : "wc-water",
    current.dir === "left" ? "wc-face-left" : "",
    hovered ? "wc-paused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="woodcutter" aria-hidden="true">
      <div
        ref={figureRef}
        className={figureClass}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          left:
            hovered && frozen
              ? frozen.left
              : current.pos === "left"
                ? LEFT
                : RIGHT,
          transition: hovered ? "none" : undefined,
          // @ts-expect-error — custom property drives the walk duration
          "--wc-walk": `${current.walk}ms`,
        }}
      >
        {current.mode === "chop" ? <ChopSprite /> : <WaterSprite />}
        <span className="wc-sweat wc-sweat-a" />
        <span className="wc-sweat wc-sweat-b" />
      </div>
      {hovered && frozen && (
        <div className="wc-tooltip" style={{ left: `${frozen.center}px` }}>
          chop wood, carry water
        </div>
      )}
    </div>
  );
}
