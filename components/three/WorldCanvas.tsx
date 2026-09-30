'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { brand } from '@/lib/brand';
import { journey } from '@/lib/journey';
import { bump, damp, lerp, range, wrap } from '@/lib/math';
import {
  CAM_Z, CODE_GLYPHS, FOV, getBeamTexture, getCodeAtlas, getSkyTexture,
  makePointsGeometry, makeSoftPointsMaterial, pointScale, worldPerPx,
} from './shared';
import { usePageActive } from './usePageActive';

/**
 * One continuous background behind every section. Its layers fade in and out
 * with the journey stage so section changes never hard-cut:
 *   blueprint grid (slowest) → sketch lines → code rain → scan lines →
 *   sky + light beams → orbit rings → calm grid again.
 * Floating glass shapes and dust are always present, each depth scrolling
 * at its own parallax speed and drifting with the pointer.
 */

const visibleHeight = (depth: number) => 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (CAM_Z - depth);

type LayerProps = { mobile: boolean };

/** Shared helper: parallax offset (world units) for a layer at `depth` moving at `speed`× scroll. */
function scrollOffset(vh: number, depth: number, speed: number) {
  return journey.scrollY * worldPerPx(vh, depth) * speed;
}

function useMouseDrift(ref: React.RefObject<THREE.Object3D | null>, amount: number) {
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.x = damp(ref.current.position.x, journey.mouse.x * amount, 2.5, Math.min(dt, 0.1));
    const baseY = (ref.current.userData.baseY as number) ?? 0;
    ref.current.userData.mouseY = damp((ref.current.userData.mouseY as number) ?? 0, -journey.mouse.y * amount * 0.6, 2.5, Math.min(dt, 0.1));
    ref.current.position.y = baseY + (ref.current.userData.mouseY as number);
  });
}

/* ------------------------------ Blueprint grid ------------------------------ */
function BlueprintGrid() {
  const group = useRef<THREE.Group>(null!);
  const plane = useRef<THREE.Group>(null!);
  const STEP = 1.2;
  const MAJOR = STEP * 5;
  const { minor, major } = useMemo(() => {
    const mk = (step: number, w: number, h: number) => {
      const v: number[] = [];
      for (let x = -w / 2; x <= w / 2; x += step) v.push(x, -h / 2, 0, x, h / 2, 0);
      for (let y = -h / 2; y <= h / 2; y += step) v.push(-w / 2, y, 0, w / 2, y, 0);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      return g;
    };
    return { minor: mk(STEP, 72, 48), major: mk(MAJOR, 72, 48) };
  }, [MAJOR]);
  const mats = useMemo(
    () => ({
      minor: new THREE.LineBasicMaterial({ color: brand.accent, transparent: true, opacity: 0.1, depthWrite: false }),
      major: new THREE.LineBasicMaterial({ color: brand.primary, transparent: true, opacity: 0.16, depthWrite: false }),
    }),
    [],
  );
  useMouseDrift(group, 0.6);
  useFrame((state) => {
    const s = journey.stage;
    const amt = Math.max(0.2, 1 - range(s, 2.3, 3.0) + range(s, 8.5, 9.2) * 0.8);
    mats.minor.opacity = 0.09 * amt;
    mats.major.opacity = 0.16 * amt;
    // slowest layer: 0.18× scroll, wrapped so the grid is endless
    plane.current.position.y = wrap(scrollOffset(state.size.height, -10, 0.18), MAJOR);
  });
  return (
    <group ref={group} position={[0, 0, -10]}>
      <group rotation-x={-0.32}>
        <group ref={plane}>
          <lineSegments geometry={minor} material={mats.minor} />
          <lineSegments geometry={major} material={mats.major} />
        </group>
      </group>
    </group>
  );
}

/* ------------------------------ Sketch lines (hero, mid layer) ------------------------------ */
function SketchLines({ mobile }: LayerProps) {
  const group = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const { geo, mat } = useMemo(() => {
    const n = mobile ? 16 : 36;
    const v: number[] = [];
    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * 22;
      const y = (Math.random() - 0.5) * 12;
      const a = Math.random() * Math.PI;
      const l = 0.6 + Math.random() * 2.2;
      v.push(x, y, 0, x + Math.cos(a) * l, y + Math.sin(a) * l, 0);
      // drafting tick marks at the ends
      v.push(x - 0.08, y - 0.08, 0, x + 0.08, y + 0.08, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return { geo, mat: new THREE.LineBasicMaterial({ color: brand.accent, transparent: true, opacity: 0, depthWrite: false }) };
  }, [mobile]);
  useMouseDrift(group, 1.2);
  useFrame((state) => {
    const s = journey.stage;
    mat.opacity = bump(s, 0, 1.4) * 0.45;
    group.current.visible = mat.opacity > 0.005;
    inner.current.position.y = scrollOffset(state.size.height, -4, 0.45);
    inner.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
  });
  return (
    <group ref={group} position={[0, 0, -4]}>
      <group ref={inner}>
        <lineSegments geometry={geo} material={mat} />
      </group>
    </group>
  );
}

/* ------------------------------ Code rain (build step) ------------------------------ */
function CodeRain({ mobile }: LayerProps) {
  const ref = useRef<THREE.Points>(null!);
  const N = mobile ? 180 : 560;
  const H = visibleHeight(-7) + 2;
  const { geo, mat, speed } = useMemo(() => {
    const geo = makePointsGeometry(N, () => 0.22 + Math.random() * 0.14, CODE_GLYPHS.length);
    const pos = geo.attributes.position.array as Float32Array;
    const cols = mobile ? 18 : 40;
    for (let i = 0; i < N; i++) {
      const col = Math.floor(Math.random() * cols);
      pos[i * 3] = (col / cols - 0.5) * 34;
      pos[i * 3 + 1] = (Math.random() - 0.5) * H;
      pos[i * 3 + 2] = -5 - Math.random() * 4;
    }
    const speed = Float32Array.from({ length: N }, () => 1.5 + Math.random() * 3.5);
    return { geo, mat: makeSoftPointsMaterial({ color: brand.accent, map: getCodeAtlas(), cols: 4 }), speed };
  }, [N, H, mobile]);
  useFrame((state, delta) => {
    const s = journey.stage;
    const amt = bump(s, 3, 1.1);
    ref.current.visible = amt > 0.01;
    if (!ref.current.visible) return;
    const dt = Math.min(delta, 0.1);
    const pos = geo.attributes.position.array as Float32Array;
    const boost = 0.5 + bump(s, 3, 0.5) * 1.5;
    for (let i = 0; i < N; i++) {
      pos[i * 3 + 1] -= speed[i] * dt * boost;
      if (pos[i * 3 + 1] < -H / 2) pos[i * 3 + 1] += H;
    }
    geo.attributes.position.needsUpdate = true;
    mat.uniforms.uOpacity.value = amt * 0.55;
    mat.uniforms.uScale.value = pointScale(state.size.height, state.viewport.dpr);
  });
  return <points ref={ref} geometry={geo} material={mat} />;
}

/* ------------------------------ Scan lines (QA step) ------------------------------ */
function ScanLines() {
  const group = useRef<THREE.Group>(null!);
  const bars = useRef<THREE.Mesh[]>([]);
  const H = visibleHeight(-5);
  const res = useMemo(
    () => ({
      geo: new THREE.PlaneGeometry(40, 0.035),
      band: new THREE.PlaneGeometry(40, 0.9),
      line: new THREE.MeshBasicMaterial({ color: brand.primary, transparent: true, opacity: 0, depthWrite: false }),
      glow: new THREE.MeshBasicMaterial({ color: brand.glow, transparent: true, opacity: 0, depthWrite: false }),
    }),
    [],
  );
  useFrame((state) => {
    const amt = bump(journey.stage, 4, 0.9);
    group.current.visible = amt > 0.01;
    if (!group.current.visible) return;
    const t = state.clock.elapsedTime;
    bars.current.forEach((m, i) => {
      if (m) m.position.y = wrap(H / 2 - ((t * (0.9 + i * 0.25) + i * 1.7) % H), H);
    });
    res.line.opacity = amt * 0.5;
    res.glow.opacity = amt * 0.18;
  });
  return (
    <group ref={group} position={[0, 0, -5]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} ref={(el) => { if (el) bars.current[i] = el; }} geometry={res.geo} material={res.line}>
          <mesh geometry={res.band} material={res.glow} position={[0, 0.45, -0.01]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------ Sky + light beams (launch / impact) ------------------------------ */
function SkyAndBeams({ mobile }: LayerProps) {
  const group = useRef<THREE.Group>(null!);
  const beams = useRef<THREE.Mesh[]>([]);
  const res = useMemo(
    () => ({
      sky: new THREE.MeshBasicMaterial({ color: brand.glow, map: getSkyTexture(), transparent: true, opacity: 0, depthWrite: false }),
      beam: new THREE.MeshBasicMaterial({ color: brand.accent, map: getBeamTexture(), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
      skyGeo: new THREE.PlaneGeometry(40, 40),
      beamGeo: new THREE.PlaneGeometry(1.6, 34),
    }),
    [],
  );
  const beamCount = mobile ? 3 : 6;
  useMouseDrift(group, 0.8);
  useFrame((state) => {
    const s = journey.stage;
    const amt = bump(s, 5.4, 1.4);
    group.current.visible = amt > 0.01;
    if (!group.current.visible) return;
    const t = state.clock.elapsedTime;
    res.sky.opacity = amt * 0.75;
    res.beam.opacity = amt * 0.28;
    beams.current.forEach((b, i) => {
      if (!b) return;
      b.rotation.z = -0.25 + Math.sin(t * 0.25 + i) * 0.08;
      b.position.x = (i / (beamCount - 1) - 0.5) * 18 + Math.sin(t * 0.2 + i * 2) * 0.6;
    });
  });
  return (
    <group ref={group}>
      <mesh geometry={res.skyGeo} material={res.sky} position={[0, 2, -12]} />
      {Array.from({ length: beamCount }, (_, i) => (
        <mesh key={i} ref={(el) => { if (el) beams.current[i] = el; }} geometry={res.beamGeo} material={res.beam} position={[0, 4, -7 - (i % 3)]} />
      ))}
    </group>
  );
}

/* ------------------------------ Orbit rings (testimonials) ------------------------------ */
function OrbitRings() {
  const group = useRef<THREE.Group>(null!);
  const res = useMemo(() => {
    const mk = (rx: number, ry: number) => {
      const pts = new THREE.EllipseCurve(0, 0, rx, ry).getPoints(128);
      return new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y, 0)));
    };
    return {
      geos: [mk(5, 1.6), mk(8, 2.6), mk(11.5, 3.6)],
      mat: new THREE.LineBasicMaterial({ color: brand.accent, transparent: true, opacity: 0, depthWrite: false }),
    };
  }, []);
  useMouseDrift(group, 0.9);
  useFrame((state) => {
    const amt = bump(journey.stage, 8, 1.0);
    group.current.visible = amt > 0.01;
    res.mat.opacity = amt * 0.35;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.1 - 0.12;
  });
  return (
    <group ref={group} position={[0, 0, -6]}>
      {res.geos.map((g, i) => (
        <lineLoop key={i} geometry={g} material={res.mat} rotation-x={0.2 * i} />
      ))}
    </group>
  );
}

/* ------------------------------ Floating glass shapes (always) ------------------------------ */
function GlassShapes({ mobile }: LayerProps) {
  const refs = useRef<THREE.Mesh[]>([]);
  const items = useMemo(() => {
    const geos = [
      new THREE.IcosahedronGeometry(0.9, 0),
      new THREE.OctahedronGeometry(0.8, 0),
      new THREE.TorusGeometry(0.7, 0.22, 16, 40),
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.DodecahedronGeometry(0.8, 0),
    ];
    const n = mobile ? 5 : 9;
    return Array.from({ length: n }, (_, i) => {
      const depth = -2 - Math.random() * 8;
      return {
        geo: geos[i % geos.length],
        depth,
        x: (Math.random() - 0.5) * (mobile ? 9 : 20),
        y: Math.random() * 20,
        speed: 0.25 + ((depth + 10) / 8) * 0.5, // nearer = faster
        spin: 0.1 + Math.random() * 0.3,
        scale: 0.5 + Math.random() * 0.8,
        mat: new THREE.MeshPhysicalMaterial({
          color: brand.glow, roughness: 0.12, metalness: 0.05, clearcoat: 1,
          transparent: true, opacity: 0.22, depthWrite: false,
        }),
      };
    });
  }, [mobile]);
  const cLow = useMemo(() => new THREE.Color(brand.glow), []);
  const cHigh = useMemo(() => new THREE.Color(brand.primary), []);

  useFrame((state) => {
    const s = journey.stage;
    // colour intensity rises through build → launch, calms toward the footer
    const intensity = Math.max(bump(s, 4.5, 2.2), bump(s, 8, 1.5) * 0.5);
    const t = state.clock.elapsedTime;
    items.forEach((it, i) => {
      const m = refs.current[i];
      if (!m) return;
      const H = visibleHeight(it.depth) + 3;
      m.position.set(
        it.x + journey.mouse.x * (1 + it.depth / 10) * 0.8,
        wrap(it.y + scrollOffset(state.size.height, it.depth, it.speed) + Math.sin(t * 0.4 + i) * 0.3, H),
        it.depth,
      );
      m.rotation.x = t * it.spin;
      m.rotation.y = t * it.spin * 0.7;
      it.mat.color.copy(cLow).lerp(cHigh, intensity * 0.7);
      it.mat.opacity = lerp(0.18, 0.3, intensity);
    });
  });
  return (
    <>
      {items.map((it, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }} geometry={it.geo} material={it.mat} scale={it.scale} />
      ))}
    </>
  );
}

/* ------------------------------ Dust (always, per-depth parallax) ------------------------------ */
function Dust({ mobile }: LayerProps) {
  const ref = useRef<THREE.Points>(null!);
  const N = mobile ? 160 : 480;
  const { geo, mat, seed } = useMemo(() => {
    const geo = makePointsGeometry(N, () => 0.03 + Math.random() * 0.05);
    const seed = Float32Array.from({ length: N * 4 }, (_, k) => {
      const f = k % 4;
      return f === 0 ? (Math.random() - 0.5) * 30 : f === 1 ? Math.random() * 30 : f === 2 ? -1 - Math.random() * 10 : Math.random();
    });
    return { geo, mat: makeSoftPointsMaterial({ color: brand.accent, opacity: 0.45 }), seed };
  }, [N]);
  useFrame((state) => {
    const pos = geo.attributes.position.array as Float32Array;
    const vh = state.size.height;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const depth = seed[i * 4 + 2];
      const speed = 0.2 + ((depth + 11) / 10) * 0.8;
      pos[i * 3] = seed[i * 4] + journey.mouse.x * (1 + depth / 11) * 0.6;
      pos[i * 3 + 1] = wrap(seed[i * 4 + 1] + scrollOffset(vh, depth, speed) + Math.sin(t * 0.3 + seed[i * 4 + 3] * 6) * 0.15, visibleHeight(depth) + 2);
      pos[i * 3 + 2] = depth;
    }
    geo.attributes.position.needsUpdate = true;
    mat.uniforms.uScale.value = pointScale(vh, state.viewport.dpr);
  });
  return <points ref={ref} geometry={geo} material={mat} />;
}

export default function WorldCanvas() {
  const active = usePageActive();
  const [cfg] = useState(() => ({
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    mobile: window.matchMedia('(max-width: 767px)').matches,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={cfg.mobile ? [1, 1.25] : [1, 2]}
        camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 60 }}
        gl={{ alpha: true, antialias: !cfg.mobile, powerPreference: 'high-performance' }}
        frameloop={!active ? 'never' : cfg.reduced ? 'demand' : 'always'}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 5]} intensity={1.2} />
        <BlueprintGrid />
        <SkyAndBeams mobile={cfg.mobile} />
        <OrbitRings />
        <ScanLines />
        <CodeRain mobile={cfg.mobile} />
        <SketchLines mobile={cfg.mobile} />
        <GlassShapes mobile={cfg.mobile} />
        <Dust mobile={cfg.mobile} />
        {cfg.reduced && <DemandBridge />}
      </Canvas>
    </div>
  );
}

/** In reduced-motion mode the world renders only when the journey changes. */
function DemandBridge() {
  const invalidate = useThree((st) => st.invalidate);
  useEffect(() => {
    journey.invalidators.add(invalidate);
    return () => { journey.invalidators.delete(invalidate); };
  }, [invalidate]);
  return null;
}
