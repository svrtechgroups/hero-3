import * as THREE from 'three';

export const FOV = 35;
export const CAM_Z = 12;

/** World units per CSS pixel on the z=0 plane (where the cube lives). */
export const worldPerPx = (viewportHeightPx: number, depth = 0) =>
  (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (CAM_Z - depth)) / viewportHeightPx;

/** Scale factor so SoftPoints aSize is expressed in world units. */
export const pointScale = (heightPx: number, dpr: number) =>
  (heightPx * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));

/**
 * One lightweight points shader used everywhere (dust, debris sparks, trail,
 * question marks, code glyphs). Per-point size + alpha, optional glyph atlas.
 * Normal blending on purpose: additive blending disappears on a white page.
 */
export function makeSoftPointsMaterial(opts: { color: string; map?: THREE.Texture | null; cols?: number; opacity?: number }) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(opts.color) },
      uOpacity: { value: opts.opacity ?? 1 },
      uScale: { value: 500 },
      uSizeMul: { value: 1 },
      uMap: { value: opts.map ?? null },
      uCols: { value: opts.map ? (opts.cols ?? 1) : 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      attribute float aGlyph;
      uniform float uScale;
      uniform float uSizeMul;
      varying float vAlpha;
      varying float vGlyph;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.0, aSize * uSizeMul * uScale / -mv.z);
        gl_Position = projectionMatrix * mv;
        vAlpha = aAlpha;
        vGlyph = aGlyph;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform sampler2D uMap;
      uniform float uCols;
      varying float vAlpha;
      varying float vGlyph;
      void main() {
        vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
        float a;
        if (uCols > 0.5) {
          float c = mod(vGlyph, uCols);
          float r = floor(vGlyph / uCols);
          uv = (uv + vec2(c, uCols - 1.0 - r)) / uCols;
          a = texture2D(uMap, uv).a;
        } else {
          float d = length(gl_PointCoord - 0.5);
          a = smoothstep(0.5, 0.05, d);
        }
        a *= vAlpha * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }
    `,
  });
}

/** Geometry with the attributes SoftPoints expects. */
export function makePointsGeometry(count: number, size: number | ((i: number) => number), glyphs = 0) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alpha = new Float32Array(count).fill(1);
  const glyph = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    sizes[i] = typeof size === 'number' ? size : size(i);
    glyph[i] = glyphs ? Math.floor(Math.random() * glyphs) : 0;
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aGlyph', new THREE.BufferAttribute(glyph, 1));
  // positions change every frame; skip frustum culling instead of recomputing bounds
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

/* ------------------------------ canvas textures ------------------------------ */

let codeAtlas: THREE.CanvasTexture | null = null;
let questionTex: THREE.CanvasTexture | null = null;
let beamTex: THREE.CanvasTexture | null = null;
let skyTex: THREE.CanvasTexture | null = null;

export const CODE_GLYPHS = ['{', '}', '<', '>', '/', ';', '=', '(', ')', '0', '1', '[', ']', '=>', '&&', 'fn'];

/** 4×4 atlas of code glyphs, white on transparent (tinted in the shader). */
export function getCodeAtlas() {
  if (codeAtlas) return codeAtlas;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  CODE_GLYPHS.forEach((g, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    ctx.font = `600 ${g.length > 1 ? 26 : 40}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillText(g, col * 64 + 32, row * 64 + 34);
  });
  codeAtlas = new THREE.CanvasTexture(c);
  return codeAtlas;
}

export function getQuestionTexture() {
  if (questionTex) return questionTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.font = '700 52px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 32, 35);
  questionTex = new THREE.CanvasTexture(c);
  return questionTex;
}

/** Soft vertical light beam (alpha falls off at the edges and ends). */
export function getBeamTexture() {
  if (beamTex) return beamTex;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const gx = ctx.createLinearGradient(0, 0, 64, 0);
  gx.addColorStop(0, 'rgba(255,255,255,0)');
  gx.addColorStop(0.5, 'rgba(255,255,255,1)');
  gx.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gx;
  ctx.fillRect(0, 0, 64, 256);
  ctx.globalCompositeOperation = 'destination-in';
  const gy = ctx.createLinearGradient(0, 0, 0, 256);
  gy.addColorStop(0, 'rgba(0,0,0,0)');
  gy.addColorStop(0.35, 'rgba(0,0,0,1)');
  gy.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gy;
  ctx.fillRect(0, 0, 64, 256);
  beamTex = new THREE.CanvasTexture(c);
  return beamTex;
}

/** Radial glow used for the launch "sky". */
export function getSkyTexture() {
  if (skyTex) return skyTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  skyTex = new THREE.CanvasTexture(c);
  return skyTex;
}
