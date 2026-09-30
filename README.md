# SVR Tech Groups — home page

Next.js 15 · React 19 · React Three Fiber · drei · GSAP ScrollTrigger · Lenis · Tailwind CSS

Concept: **"Watch your software get built."** One glowing project cube travels down the whole page in a fixed WebGL layer and changes form in every section.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## How the journey works

Everything hangs off one number, the **stage** (see `lib/journey.ts`):

| Stage | Section | Cube |
|---|---|---|
| 0 | Hero | rough double-lined wireframe sketch |
| 1 | Discover | "?" particles converge onto the wireframe |
| 2 | Design | translucent faces + blueprint face grid |
| 3 | Build | code glyphs spiral in, speed meter spins up |
| 4 | QA | laser plane sweeps, 8 corner checks light up |
| 5 | Launch | solid glossy cube launches with a light trail |
| 6 | Impact | lands and bursts into debris, stats fly out |
| 7 | Services | splits into 4 cubes → browser / phone / AI core / loop icons |
| 8 | Testimonials | small solid cube cruises past floating quotes |
| 9 | Contact | small wireframe; assembles solid on successful submit |
| 10 | Footer | shrinks into the logo mark |

**Anchors, not hard-coded coordinates.** Any element with `data-cube-anchor data-stage="N"` (`components/ui/CubeAnchor.tsx`) is a resting place. Every frame the tracker finds the two anchors around a focus line in the viewport and interpolates position, size and stage between them. Move an anchor in the layout and the cube follows — mobile layouts needed no extra 3D code. `data-stage="process"` is dynamic (1→5 across the pinned section).

Service icon slots use `data-service-slot="0..3"`. The DOM SVG icons and the footer logo mark fade out via `--svc-split` / `--footer-cube` exactly while the 3D versions occupy them, so without WebGL the page is still complete.

## Files

```
app/layout.tsx              fonts (Sora + Inter), SEO metadata, JSON-LD, skip link
app/page.tsx                section order
app/api/contact/route.ts    server validation — TODO: plug in email/CRM delivery
lib/journey.ts              store, stage → look mapping, anchor tracker
lib/content.ts              ALL copy, stats and testimonials (placeholders marked)
components/providers/MotionProvider.tsx  Lenis + GSAP ticker, parallax, reveals, 3D section transitions
components/three/CubeCanvas.tsx   front canvas (z-30): rig, cube, trail, debris, service cubes
components/three/WorldCanvas.tsx  back canvas (z-0): grid, sketch lines, code rain, scan lines, sky/beams, orbits, glass shapes, dust
components/ui/DepthLayers.tsx     per-section DOM parallax layers (back + mid; content = foreground)
components/sections/*             Navbar, Hero, Process, Impact, Services, Testimonials, Contact, Footer
```

## Before launch

- **Logo:** replace the placeholder in `components/ui/Logo.tsx` (keep the 40×40 mark size so the footer cube lands on it).
- **Stats + testimonials:** replace placeholders in `lib/content.ts`.
- **Contact delivery:** wire `app/api/contact/route.ts` to Resend/Nodemailer/CRM and add rate limiting.
- **OG image:** add `public/og.png` (1200×630).
- **Colours:** change the RGB triples in `app/globals.css` and the hex mirror in `lib/brand.ts`.

## Performance & accessibility

- Two fixed canvases rather than one: the world must sit *behind* the content and the cube *in front* of it (so it can fly into cards and beside the form). Both cap DPR at 2 (1.25–1.5 on mobile), load after first paint via `requestIdleCallback`, and stop rendering while the tab is hidden.
- No HDR downloads: reflections come from a locally generated drei `<Environment>` with Lightformers.
- Mobile: fewer particles/shapes, no pinning — How We Build becomes a stacked sequence where the cube hops between per-step anchors; testimonials become a swipeable row.
- `prefers-reduced-motion`: no Lenis, no pins, no scrubbed parallax; canvases render on demand only when the page scrolls, so the cube still changes form but calmly.
- Semantic landmarks, visible focus rings, labelled form fields with inline errors, screen-reader list of all process steps, stat values exposed to assistive tech, WebGL layers `aria-hidden`.
- Stat numbers are DOM (3D-transformed) rather than WebGL text, so they stay crisp, indexable and readable by screen readers.
