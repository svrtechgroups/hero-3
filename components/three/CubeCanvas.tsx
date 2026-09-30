'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { cubeLook, journey } from '@/lib/journey';
import { damp } from '@/lib/math';
import { cubeFrame } from './frame';
import { CAM_Z, FOV, worldPerPx } from './shared';
import { ProjectCube } from './ProjectCube';
import { ImpactDebris, LaunchTrail, ServiceCubes } from './CubeEffects';
import { usePageActive } from './usePageActive';

/** Turns the tracked screen target into smoothed world-space cube state. */
function CubeRig() {
  const invalidate = useThree((s) => s.invalidate);
  const cur = useRef({ x: 0, y: 0, size: 160, stage: 0, init: false });

  useEffect(() => {
    journey.invalidators.add(invalidate);
    return () => { journey.invalidators.delete(invalidate); };
  }, [invalidate]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const { width: vw, height: vh } = state.size;
    const T = journey.target;
    const c = cur.current;
    if (!c.init || journey.reduced) {
      c.x = T.x; c.y = T.y; c.size = T.size; c.stage = T.stage; c.init = true;
    } else {
      c.x = damp(c.x, T.x, 7, dt);
      c.y = damp(c.y, T.y, 7, dt);
      c.size = damp(c.size, T.size, 6, dt);
      c.stage = damp(c.stage, T.stage, 5, dt);
    }
    journey.stage = c.stage;

    const look = cubeLook(c.stage, journey.assembled);
    const wpp = worldPerPx(vh);
    const launchPx = -look.launch * vh * 0.55;
    cubeFrame.look = look;
    cubeFrame.stage = c.stage;
    cubeFrame.wpp = wpp;
    cubeFrame.vw = vw;
    cubeFrame.vh = vh;
    cubeFrame.pos.set((c.x - vw / 2) * wpp, -(c.y + launchPx - vh / 2) * wpp, 0);
    cubeFrame.scale = c.size * wpp * 0.6; // rotated unit cube ≈ fills the anchor box
  }, -1);

  return null;
}

export default function CubeCanvas() {
  const active = usePageActive();
  const [cfg] = useState(() => ({
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    mobile: window.matchMedia('(max-width: 767px)').matches,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-30" aria-hidden="true">
      <Canvas
        dpr={cfg.mobile ? [1, 1.5] : [1, 2]}
        camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 60 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        frameloop={!active ? 'never' : cfg.reduced ? 'demand' : 'always'}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 6]} intensity={1.6} />
        <directionalLight position={[-6, -2, 4]} intensity={0.5} color="#93C5FD" />
        {/* studio reflections for the glossy stages — generated locally, no HDR download */}
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[8, 2, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color="#93C5FD" />
          <Lightformer form="rect" intensity={1.2} position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
          <Lightformer form="ring" intensity={2} position={[2, 2, 6]} scale={1.5} />
        </Environment>
        <CubeRig />
        <ProjectCube mobile={cfg.mobile} />
        <LaunchTrail mobile={cfg.mobile} />
        <ImpactDebris mobile={cfg.mobile} />
        <ServiceCubes />
      </Canvas>
    </div>
  );
}
