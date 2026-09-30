import * as THREE from 'three';
import { cubeLook } from '@/lib/journey';

/** Per-frame cube state computed once by <CubeRig/> and read by every cube part. */
export const cubeFrame = {
  pos: new THREE.Vector3(),
  scale: 1,
  stage: 0,
  wpp: 0.01,
  vw: 1,
  vh: 1,
  look: cubeLook(0, 0),
};
