'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { brand } from '@/lib/brand';
import { journey } from '@/lib/journey';
import { damp, lerp } from '@/lib/math';
import { cubeFrame } from './frame';
import { CODE_GLYPHS, getCodeAtlas, getQuestionTexture, makePointsGeometry, makeSoftPointsMaterial, pointScale } from './shared';

/** Blueprint subdivision lines drawn on each face of a unit cube. */
function faceGridGeometry(div: number) {
  const v: number[] = [];
  const h = 0.5;
  for (let axis = 0; axis < 3; axis++) {
    const u = (axis + 1) % 3;
    const w = (axis + 2) % 3;
    for (const side of [-h, h]) {
      for (let i = 1; i < div; i++) {
        const c = -h + i / div;
        const a = [0, 0, 0];
        const b = [0, 0, 0];
        a[axis] = b[axis] = side;
        a[u] = -h; b[u] = h; a[w] = b[w] = c;
        v.push(...a, ...b);
        a[w] = -h; b[w] = h; a[u] = b[u] = c;
        v.push(...a, ...b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  return g;
}

function randomOnCube() {
  const p = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
  const axis = Math.floor(Math.random() * 3);
  p[axis] = Math.random() < 0.5 ? -0.5 : 0.5;
  return p;
}

const CORNERS: [number, number, number][] = [];
for (const x of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) CORNERS.push([x, y, z]);

const tmpColor = new THREE.Color();
const cPrimary = new THREE.Color(brand.primary);
const cAccent = new THREE.Color(brand.accent);
const cSlate = new THREE.Color(brand.slate);

export function ProjectCube({ mobile }: { mobile: boolean }) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const faceMesh = useRef<THREE.Mesh>(null!);
  const sketchA = useRef<THREE.LineSegments>(null!);
  const sketchB = useRef<THREE.LineSegments>(null!);
  const scanner = useRef<THREE.Group>(null!);
  const cornerGroup = useRef<THREE.Group>(null!);
  const codePts = useRef<THREE.Points>(null!);
  const qPts = useRef<THREE.Points>(null!);

  const Q = mobile ? 22 : 48;
  const C = mobile ? 90 : 260;

  const g = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const edges = new THREE.EdgesGeometry(box);
    const grid = faceGridGeometry(4);
    const plane = new THREE.PlaneGeometry(1.9, 1.9);
    const s = 0.95;
    const square = new THREE.BufferGeometry();
    square.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([-s, 0, -s, s, 0, -s, s, 0, -s, s, 0, s, s, 0, s, -s, 0, s, -s, 0, s, -s, 0, -s], 3),
    );
    const dot = new THREE.SphereGeometry(0.05, 12, 12);

    // question marks: scattered start → surface end
    const qGeo = makePointsGeometry(Q, () => 0.18 + Math.random() * 0.12);
    const qStart = new Float32Array(Q * 3);
    const qEnd = new Float32Array(Q * 3);
    for (let i = 0; i < Q; i++) {
      const dir = new THREE.Vector3().randomDirection().multiplyScalar(1.2 + Math.random() * 1.1);
      qStart.set([dir.x, dir.y, dir.z], i * 3);
      qEnd.set(randomOnCube(), i * 3);
    }

    // code stream: particles spiral inward from a ring
    const codeGeo = makePointsGeometry(C, () => 0.12 + Math.random() * 0.1, CODE_GLYPHS.length);
    const codeSeed = new Float32Array(C * 4); // angle, height, phase, speed
    for (let i = 0; i < C; i++) {
      codeSeed.set([Math.random() * Math.PI * 2, (Math.random() - 0.5) * 2, Math.random(), 0.6 + Math.random() * 0.8], i * 4);
    }
    return { box, edges, grid, plane, square, dot, qGeo, qStart, qEnd, codeGeo, codeSeed };
  }, [Q, C]);

  const m = useMemo(
    () => ({
      face: new THREE.MeshPhysicalMaterial({
        color: brand.accent, transparent: true, opacity: 0, roughness: 0.6, metalness: 0.15,
        clearcoat: 0, clearcoatRoughness: 0.08, envMapIntensity: 0.5,
      }),
      wire: new THREE.LineBasicMaterial({ color: brand.accent, transparent: true }),
      sketch: new THREE.LineBasicMaterial({ color: brand.glow, transparent: true }),
      grid: new THREE.LineBasicMaterial({ color: brand.primary, transparent: true, opacity: 0 }),
      scanPlane: new THREE.MeshBasicMaterial({ color: brand.accent, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
      scanLine: new THREE.LineBasicMaterial({ color: brand.primary, transparent: true, opacity: 0 }),
      corners: CORNERS.map(() => new THREE.MeshBasicMaterial({ color: brand.slate })),
      q: makeSoftPointsMaterial({ color: brand.primary, map: getQuestionTexture(), cols: 1 }),
      code: makeSoftPointsMaterial({ color: brand.primary, map: getCodeAtlas(), cols: 4 }),
    }),
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const f = cubeFrame;
    const L = f.look;
    const t = state.clock.elapsedTime;
    const ps = pointScale(state.size.height, state.viewport.dpr);

    // ---- placement ----
    outer.current.visible = L.visible > 0.01;
    if (!outer.current.visible) return;
    const sc = Math.max(1e-4, f.scale * L.visible);
    outer.current.position.copy(f.pos);
    outer.current.position.y += Math.sin(t * 1.1) * 0.05 * f.scale;
    outer.current.scale.setScalar(sc);

    const spin = 0.22 + L.code * 1.8 + L.launch * 3;
    inner.current.rotation.y += dt * (journey.reduced ? 0 : spin);
    inner.current.rotation.x = damp(inner.current.rotation.x, 0.42 + journey.mouse.y * 0.25, 3, dt);
    inner.current.rotation.z = damp(inner.current.rotation.z, -journey.mouse.x * 0.15, 3, dt);

    // ---- surfaces ----
    faceMesh.current.visible = L.faces > 0.005;
    m.face.opacity = L.faces;
    m.face.depthWrite = L.faces > 0.95;
    m.face.roughness = lerp(0.6, 0.1, L.gloss);
    m.face.clearcoat = L.gloss;
    m.face.envMapIntensity = lerp(0.5, 1.6, L.gloss);
    m.face.color.copy(tmpColor.copy(cAccent).lerp(cPrimary, L.gloss));

    m.wire.opacity = L.wire;
    m.wire.color.copy(tmpColor.copy(cAccent).lerp(cPrimary, Math.min(1, L.faces + L.blueprint)));

    m.sketch.opacity = L.sketch * 0.6;
    sketchA.current.visible = sketchB.current.visible = L.sketch > 0.01;
    sketchA.current.rotation.z = 0.025 + Math.sin(t * 2.3) * 0.012;
    sketchB.current.rotation.x = -0.02 + Math.cos(t * 1.7) * 0.012;

    m.grid.opacity = L.blueprint * 0.5;

    // ---- QA scan ----
    scanner.current.visible = cornerGroup.current.visible = L.scan > 0.01;
    if (L.scan > 0.01) {
      scanner.current.position.y = Math.sin(t * 2.4) * 0.62;
      m.scanPlane.opacity = 0.2 * L.scan;
      m.scanLine.opacity = 0.95 * L.scan;
      m.corners.forEach((mat, i) => {
        const lit = L.qaProgress > (i + 0.5) / CORNERS.length ? 1 : 0;
        mat.color.copy(tmpColor.copy(cSlate).lerp(cPrimary, lit));
        const s = (0.6 + lit * 0.7) * L.scan;
        cornerGroup.current.children[i].scale.setScalar(Math.max(1e-4, s));
      });
    }

    // ---- Discover: question marks resolve onto the cube ----
    qPts.current.visible = L.question > 0.01;
    if (qPts.current.visible) {
      const q = L.questionResolve;
      const pos = g.qGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < Q; i++) {
        const k = i * 3;
        const w = (1 - q) * 0.12;
        pos[k] = lerp(g.qStart[k], g.qEnd[k], q) + Math.sin(t * 1.3 + i) * w;
        pos[k + 1] = lerp(g.qStart[k + 1], g.qEnd[k + 1], q) + Math.cos(t * 1.1 + i * 2) * w;
        pos[k + 2] = lerp(g.qStart[k + 2], g.qEnd[k + 2], q);
      }
      g.qGeo.attributes.position.needsUpdate = true;
      m.q.uniforms.uOpacity.value = L.question * (1 - q * 0.75);
      m.q.uniforms.uSizeMul.value = sc * (1 - q * 0.5);
      m.q.uniforms.uScale.value = ps;
    }

    // ---- Build: code glyphs stream into the cube ----
    codePts.current.visible = L.code > 0.01;
    if (codePts.current.visible) {
      const pos = g.codeGeo.attributes.position.array as Float32Array;
      const alpha = g.codeGeo.attributes.aAlpha.array as Float32Array;
      const speed = 0.2 + L.code * 1.1;
      for (let i = 0; i < C; i++) {
        const [a, h, p, sp] = [g.codeSeed[i * 4], g.codeSeed[i * 4 + 1], g.codeSeed[i * 4 + 2], g.codeSeed[i * 4 + 3]];
        const frac = (p + t * sp * speed) % 1;
        const r = lerp(2.8, 0.05, frac);
        pos[i * 3] = Math.cos(a + frac * 1.2) * r;
        pos[i * 3 + 1] = h * (r / 2.8) * 1.3;
        pos[i * 3 + 2] = Math.sin(a + frac * 1.2) * r;
        alpha[i] = Math.sin(frac * Math.PI);
      }
      g.codeGeo.attributes.position.needsUpdate = true;
      g.codeGeo.attributes.aAlpha.needsUpdate = true;
      m.code.uniforms.uOpacity.value = L.code;
      m.code.uniforms.uSizeMul.value = sc;
      m.code.uniforms.uScale.value = ps;
    }
  }, 0);

  return (
    <group ref={outer}>
      <group ref={inner}>
        <mesh ref={faceMesh} geometry={g.box} material={m.face} />
        <lineSegments geometry={g.edges} material={m.wire} />
        <lineSegments ref={sketchA} geometry={g.edges} material={m.sketch} scale={1.05} rotation={[0.03, -0.02, 0.025]} />
        <lineSegments ref={sketchB} geometry={g.edges} material={m.sketch} scale={0.96} rotation={[-0.02, 0.035, -0.015]} />
        <lineSegments geometry={g.grid} material={m.grid} />
        <group ref={cornerGroup}>
          {CORNERS.map((c, i) => (
            <mesh key={i} position={c} geometry={g.dot} material={m.corners[i]} />
          ))}
        </group>
        <points ref={qPts} geometry={g.qGeo} material={m.q} />
        <points ref={codePts} geometry={g.codeGeo} material={m.code} />
      </group>
      {/* the scanner doesn't rotate with the cube: it sweeps in screen space */}
      <group ref={scanner}>
        <mesh rotation-x={-Math.PI / 2} geometry={g.plane} material={m.scanPlane} />
        <lineSegments geometry={g.square} material={m.scanLine} />
      </group>
    </group>
  );
}
