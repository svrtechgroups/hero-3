'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { brand } from '@/lib/brand';
import { journey } from '@/lib/journey';
import { lerp, range } from '@/lib/math';
import { cubeFrame } from './frame';
import { makePointsGeometry, makeSoftPointsMaterial, pointScale } from './shared';

/* ------------------------------ Launch trail ------------------------------ */

export function LaunchTrail({ mobile }: { mobile: boolean }) {
  const N = mobile ? 20 : 40;
  const ref = useRef<THREE.Points>(null!);
  const { geo, mat, hist } = useMemo(() => {
    const geo = makePointsGeometry(N, (i) => lerp(0.42, 0.06, i / N));
    const alpha = geo.attributes.aAlpha.array as Float32Array;
    for (let i = 0; i < N; i++) alpha[i] = Math.pow(1 - i / N, 1.4);
    const mat = makeSoftPointsMaterial({ color: brand.accent });
    const hist = Array.from({ length: N }, () => new THREE.Vector3());
    return { geo, mat, hist };
  }, [N]);

  useFrame((state) => {
    const f = cubeFrame;
    const on = f.look.trail > 0.01;
    // shift history; when off, collapse it onto the cube so the next trail starts clean
    for (let i = N - 1; i > 0; i--) hist[i].copy(on ? hist[i - 1] : f.pos);
    hist[0].copy(f.pos);
    ref.current.visible = on;
    if (!on) return;
    const pos = geo.attributes.position.array as Float32Array;
    hist.forEach((p, i) => pos.set([p.x, p.y - f.scale * 0.35, p.z - 0.2], i * 3));
    geo.attributes.position.needsUpdate = true;
    mat.uniforms.uOpacity.value = f.look.trail * 0.9;
    mat.uniforms.uSizeMul.value = f.scale;
    mat.uniforms.uScale.value = pointScale(state.size.height, state.viewport.dpr);
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

/* ------------------------------ Impact debris ------------------------------ */

export function ImpactDebris({ mobile }: { mobile: boolean }) {
  const D = mobile ? 18 : 42;
  const S = mobile ? 50 : 140;
  const boxes = useRef<THREE.InstancedMesh>(null!);
  const sparks = useRef<THREE.Points>(null!);
  const latch = useRef({ center: new THREE.Vector3(), scale: 1, scroll: 0 });

  const data = useMemo(() => {
    const mk = (n: number) =>
      Array.from({ length: n }, () => ({
        dir: new THREE.Vector3().randomDirection(),
        dist: 0.6 + Math.random() * 1.2,
        speed: 0.3 + Math.random() * 1.0, // parallax speed relative to scroll
        spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(2),
        size: 0.5 + Math.random(),
      }));
    const sparkGeo = makePointsGeometry(S, () => 0.05 + Math.random() * 0.08);
    return { boxes: mk(D), sparks: mk(S), sparkGeo };
  }, [D, S]);

  const mats = useMemo(
    () => ({
      box: new THREE.MeshPhysicalMaterial({ color: brand.primary, roughness: 0.2, clearcoat: 1, metalness: 0.2, transparent: true }),
      spark: makeSoftPointsMaterial({ color: brand.accent }),
      geo: new THREE.BoxGeometry(1, 1, 1),
    }),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const f = cubeFrame;
    const L = f.look;
    const spread = L.burstOut * (1 - L.burstIn);
    const on = spread > 0.01;
    boxes.current.visible = sparks.current.visible = on;
    if (!on) {
      // follow the cube until it bursts, then stay where it burst
      latch.current.center.copy(f.pos);
      latch.current.scale = f.scale;
      latch.current.scroll = journey.scrollY;
      return;
    }
    const { center, scale, scroll } = latch.current;
    const scrolled = (journey.scrollY - scroll) * f.wpp;
    const t = state.clock.elapsedTime;
    const reach = scale * 2.6 * spread;

    data.boxes.forEach((d, i) => {
      dummy.position.copy(d.dir).multiplyScalar(d.dist * reach).add(center);
      dummy.position.y += scrolled * d.speed;
      dummy.rotation.set(t * d.spin.x, t * d.spin.y, t * d.spin.z);
      dummy.scale.setScalar(scale * 0.12 * d.size * spread);
      dummy.updateMatrix();
      boxes.current.setMatrixAt(i, dummy.matrix);
    });
    boxes.current.instanceMatrix.needsUpdate = true;
    mats.box.opacity = spread;

    const pos = data.sparkGeo.attributes.position.array as Float32Array;
    data.sparks.forEach((d, i) => {
      pos[i * 3] = center.x + d.dir.x * d.dist * reach * 1.4;
      pos[i * 3 + 1] = center.y + d.dir.y * d.dist * reach * 1.4 + scrolled * d.speed;
      pos[i * 3 + 2] = center.z + d.dir.z * d.dist * reach * 1.4;
    });
    data.sparkGeo.attributes.position.needsUpdate = true;
    mats.spark.uniforms.uOpacity.value = spread * 0.8;
    mats.spark.uniforms.uSizeMul.value = scale;
    mats.spark.uniforms.uScale.value = pointScale(state.size.height, state.viewport.dpr);
  });

  return (
    <>
      <instancedMesh ref={boxes} args={[mats.geo, mats.box, D]} frustumCulled={false} />
      <points ref={sparks} geometry={data.sparkGeo} material={mats.spark} />
    </>
  );
}

/* ------------------------------ Service cubes ------------------------------ */
// The cube splits into four; each flies into a service card's icon slot and
// morphs into that service's icon: browser window, phone, AI core, loop.

export function ServiceCubes() {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const cubes = useRef<(THREE.Mesh | null)[]>([]);
  const icons = useRef<(THREE.Group | null)[]>([]);

  const res = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({ color: brand.primary, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.08, metalness: 0.15, envMapIntensity: 1.5 });
    const screenMat = new THREE.MeshPhysicalMaterial({ color: brand.glow, roughness: 0.2, clearcoat: 1, envMapIntensity: 1.2 });
    const lineMat = new THREE.LineBasicMaterial({ color: brand.navy, transparent: true, opacity: 0.35 });
    const box = new THREE.BoxGeometry(1, 1, 1);
    const shapes = [
      new THREE.BoxGeometry(1.35, 0.92, 0.12), // browser
      new THREE.BoxGeometry(0.62, 1.2, 0.12), // phone
      new THREE.IcosahedronGeometry(0.7, 0), // AI agent
      new THREE.TorusGeometry(0.48, 0.17, 18, 48), // automation loop
    ];
    const screens = [
      { geo: new THREE.BoxGeometry(1.2, 0.66, 0.02), pos: [0, -0.07, 0.07] as [number, number, number] },
      { geo: new THREE.BoxGeometry(0.5, 0.96, 0.02), pos: [0, 0, 0.07] as [number, number, number] },
      null,
      null,
    ];
    const edges = shapes.map((s, i) => (i === 3 ? null : new THREE.EdgesGeometry(s)));
    return { mat, screenMat, lineMat, box, shapes, screens, edges };
  }, []);

  useFrame((state) => {
    const f = cubeFrame;
    const L = f.look;
    const s = f.stage;
    const { width: vw, height: vh } = state.size;
    const morph = range(s, 6.88, 7.05) * (1 - range(s, 7.2, 7.35));
    const t = state.clock.elapsedTime;

    for (let i = 0; i < 4; i++) {
      const g = groups.current[i];
      if (!g) continue;
      g.visible = L.split > 0.01;
      if (!g.visible) continue;
      const slot = journey.slots[i];
      const tx = slot.visible ? (slot.x - vw / 2) * f.wpp : f.pos.x;
      const ty = slot.visible ? -(slot.y - vh / 2) * f.wpp : f.pos.y;
      const tsize = slot.visible ? slot.size * f.wpp * 0.55 : 0;
      // arc outwards on the way: a little overshoot in z for depth
      g.position.set(lerp(f.pos.x, tx, L.split), lerp(f.pos.y, ty, L.split), Math.sin(L.split * Math.PI) * 1.2);
      g.scale.setScalar(Math.max(1e-4, lerp(f.scale * 0.5, tsize, L.split)));
      g.rotation.y = lerp(t * 0.8 + i, Math.sin(t * 0.8 + i) * 0.45, morph);
      g.rotation.x = lerp(0.4, 0.15, morph);
      cubes.current[i]?.scale.setScalar(Math.max(1e-4, 1 - morph));
      icons.current[i]?.scale.setScalar(Math.max(1e-4, morph));
    }
  });

  return (
    <>
      {res.shapes.map((shape, i) => (
        <group key={i} ref={(el) => { groups.current[i] = el; }} visible={false}>
          <mesh ref={(el) => { cubes.current[i] = el; }} geometry={res.box} material={res.mat} />
          <group ref={(el) => { icons.current[i] = el; }} scale={0.0001}>
            <mesh geometry={shape} material={res.mat} rotation={i === 3 ? [0.4, 0, 0] : [0, 0, 0]} />
            {res.edges[i] && <lineSegments geometry={res.edges[i]!} material={res.lineMat} />}
            {res.screens[i] && (
              <mesh geometry={res.screens[i]!.geo} material={res.screenMat} position={res.screens[i]!.pos} />
            )}
          </group>
        </group>
      ))}
    </>
  );
}
