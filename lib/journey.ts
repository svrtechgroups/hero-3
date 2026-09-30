import type Lenis from 'lenis';
import { bump, clamp01, lerp, range } from './math';

/**
 * THE JOURNEY
 * ------------------------------------------------------------------
 * One number — `stage` — describes where the project cube is in its life:
 *
 *   0  Hero          wireframe sketch ("an idea")
 *   1  Discover      question marks resolve into the wireframe
 *   2  Design        translucent faces + blueprint lines
 *   3  Build         code particles stream in (speed meter)
 *   4  QA            laser scan + check lights
 *   5  Launch        solid glossy cube launches with a light trail
 *   6  Impact        cube lands and bursts; stats fly out of it
 *   7  Services      cube splits into 4 cubes that become card icons
 *   8  Testimonials  small solid cube travels past floating quotes
 *   9  Contact       small wireframe again ("your idea is next")
 *  10  Footer        cube shrinks into the logo mark
 *
 * DOM elements marked `data-cube-anchor data-stage="N"` say where the cube
 * should sit and how big it should be at that stage. Every frame the tracker
 * finds the two anchors around a focus line in the viewport and interpolates
 * position, size and stage between them — so the cube literally travels with
 * the page, and layout changes (mobile, resize) need no extra code.
 * `data-stage="process"` is dynamic: 1 → 5 across the pinned process section.
 */

export type Slot = { x: number; y: number; size: number; visible: boolean };

export const journey = {
  scrollY: 0,
  velocity: 0,
  /** 0..1 progress through the pinned How-We-Build timeline */
  process: 0,
  /** 0..1 contact form "assembled" state (set on successful submit) */
  assembled: 0,
  /** pointer, normalised -1..1 */
  mouse: { x: 0, y: 0 },
  /** where the cube should be (screen px) — written by trackCube() */
  target: { x: 0, y: 0, size: 160, stage: 0 },
  /** smoothed stage — written by the cube canvas, read by DOM + world */
  stage: 0,
  /** service icon slots (screen px) */
  slots: [0, 1, 2, 3].map(() => ({ x: 0, y: 0, size: 0, visible: false })) as Slot[],
  reduced: false,
  mobile: false,
  webgl: false,
  lenis: null as Lenis | null,
  /** canvases in "demand" mode register invalidate() here */
  invalidators: new Set<() => void>(),
};

/* ---------------- stage → derived values shared by DOM and 3D ---------------- */

export const splitAmount = (s: number) => range(s, 6.7, 7.0) * (1 - range(s, 7.25, 7.6));
export const footerCubeAmount = (s: number) => range(s, 9.55, 9.95);

export function cubeLook(s: number, assembled: number) {
  const contactNear = bump(s, 9, 0.75);
  const assembledF = assembled * contactNear;

  const sketch = 1 - range(s, 0.3, 1.3);
  const question = bump(s, 1, 0.8);
  const questionResolve = range(s, 0.55, 1.45);
  const blueprint = bump(s, 2.1, 1.1);
  const code = bump(s, 3, 0.85);
  const scan = bump(s, 4, 0.8);
  const qaProgress = range(s, 3.55, 4.45);
  const trail = bump(s, 5.05, 0.6);

  let faces = range(s, 1.5, 2.3) * 0.25 + range(s, 2.6, 3.8) * 0.15 + range(s, 4.4, 5.0) * 0.6;
  faces *= 1 - range(s, 8.4, 8.9);
  faces += range(s, 9.4, 9.9);
  faces = clamp01(Math.max(faces, assembledF));

  let gloss = range(s, 4.4, 5.0) * (1 - range(s, 8.4, 8.9)) + range(s, 9.4, 9.9);
  gloss = clamp01(Math.max(gloss, assembledF));

  let wire = 1 - range(s, 4.5, 5.0) * 0.8 + range(s, 8.4, 8.9) * 0.8 - range(s, 9.4, 9.9) * 0.6;
  wire = lerp(clamp01(wire), 0.25, assembledF);

  const burstOut = range(s, 5.75, 6.05);
  const burstIn = range(s, 6.3, 6.65);
  const split = splitAmount(s);
  const visible = clamp01(Math.min(1 - burstOut + burstIn, 1 - split));

  // launch arc (0..1..0) — peaks at the end of the pinned process section
  const launchT = clamp01((s - 4.55) / 0.9);
  const launch = Math.sin(launchT * Math.PI);

  return {
    sketch, question, questionResolve, blueprint, code, scan, qaProgress, trail,
    faces, gloss, wire, burstOut, burstIn, split, visible, launch,
  };
}

/* ---------------------------- anchor tracking ---------------------------- */

let anchors: HTMLElement[] = [];
let slotEls: HTMLElement[] = [];

export function collectAnchors() {
  anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-cube-anchor]'));
  slotEls = Array.from(document.querySelectorAll<HTMLElement>('[data-service-slot]')).sort(
    (a, b) => Number(a.dataset.serviceSlot) - Number(b.dataset.serviceSlot),
  );
}

type Pt = { x: number; y: number; size: number; stage: number };
const pts: Pt[] = [];

export function trackCube() {
  const vh = window.innerHeight;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);

  // The focus line sits mid-screen, sliding down near the end of the page so
  // the footer anchor (which can never reach mid-screen) is still reached.
  const endT = clamp01((journey.scrollY - (maxScroll - vh * 0.8)) / (vh * 0.8));
  const focus = vh * (0.5 + 0.42 * endT);

  pts.length = 0;
  for (const el of anchors) {
    const r = el.getBoundingClientRect();
    if (r.width < 1) continue; // hidden on this breakpoint
    const raw = el.dataset.stage ?? '0';
    const stage = raw === 'process' ? 1 + journey.process * 4 : parseFloat(raw);
    pts.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width, stage });
  }
  if (pts.length) {
    let a = pts[0];
    let b = pts[0];
    let t = 0;
    if (focus >= pts[pts.length - 1].y) {
      a = b = pts[pts.length - 1];
    } else if (focus > pts[0].y) {
      for (let i = 0; i < pts.length - 1; i++) {
        if (focus >= pts[i].y && focus <= pts[i + 1].y) {
          a = pts[i];
          b = pts[i + 1];
          const span = b.y - a.y;
          t = span > 0 ? (focus - a.y) / span : 0;
          break;
        }
      }
    }
    // hold near each anchor, travel in between
    const e = range(t, 0.12, 0.88);
    const T = journey.target;
    const changed = Math.abs(T.y - lerp(a.y, b.y, e)) > 0.5 || Math.abs(T.stage - lerp(a.stage, b.stage, e)) > 0.001;
    T.x = lerp(a.x, b.x, e);
    T.y = lerp(a.y, b.y, e);
    T.size = lerp(a.size, b.size, e);
    T.stage = lerp(a.stage, b.stage, e);
    if (changed) journey.invalidators.forEach((fn) => fn());
  }

  for (let i = 0; i < 4; i++) {
    const el = slotEls[i];
    const slot = journey.slots[i];
    if (!el) { slot.visible = false; continue; }
    const r = el.getBoundingClientRect();
    slot.visible = r.width > 0;
    slot.x = r.left + r.width / 2;
    slot.y = r.top + r.height / 2;
    slot.size = r.width;
  }
}
