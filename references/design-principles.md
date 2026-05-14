# Design Principles

Use this reference when choosing visual direction, style, materials, animation tone, or detailed layout rules for a generated deck.

## Visual Stance

Form follows the communication goal. Every color, material, layout, and animation choice must support the user's mental model and business objective.

| Stance | Best for | Traits |
|---|---|---|
| Future & Depth | Frontier research, technology launches | Dark mode, glass layers, glow, depth |
| Efficiency & Speed | Professional tools, dashboards | Clean flat surfaces, Bento UI, clear borders |
| Trust & Professional | Finance, enterprise, formal reporting | Swiss minimalism, whitespace, strict grids |
| Care & Resonance | Humanities, lifestyle, brand stories | Low-saturation naturals, soft shadow, larger radius |
| Immersion & Expression | Entertainment, creative proposals | High contrast, expressive material, broken grids |

Style routing:

- Solution / pre-sales proposal -> Trust & Professional or Efficiency & Speed.
- Product launch / technology showcase -> Future & Depth.
- Brand story / human-centered content -> Care & Resonance.
- Creative / marketing concept -> Immersion & Expression.

## Typography And Space

- Density is inversely proportional to importance. Hero/focus slides need low density. Data lists can be denser.
- Prefer modern sans-serif fonts such as Clash Display, Satoshi, DM Sans. Use strong weight and size contrast between headings and body copy.
- Body line-height: `1.5` or `1.6`.
- Minimum readable text: `12px` only for annotations. Standard body: `14px` or `16px`.
- Use `clamp()` for responsive type sizing.

## Component State Completeness

When rendering repeated components such as cards, nav items, or list rows, show multiple states in the same static frame:

- Default
- Hover or active-like state
- Selected or emphasized state

Do not rely only on Tailwind `hover:` pseudo classes for static screenshots. Directly encode visible states on specific items.

## System Constraints

All design decisions must map to a finite variable set:

| System | Constraint |
|---|---|
| Color | Define a primary brand color, then use complementary and analogous colors intentionally. Avoid arbitrary colors. |
| Spacing | Use an 8-point grid: `8/12/16/20/24/32/40` for gap and padding. |
| Radius | Default `12px`. Care-oriented styles may use `24px` or full radius. |
| Size | Minimum target `44px`; readable minimum `12px`; standard body `14px/16px`. |
| Shadow | Use diffuse light, e.g. `0 10px 30px rgba(0,0,0,0.08)`. Avoid harsh shadows. |

## Emerging Design Trends

Use at most two trends in one deck.

### Ghostly Agency

Agentic UX: the interface feels like a translucent assistant preparing context before the user asks.

- Predictive presence: progressive `.reveal` content.
- Invisible steward: translucent floating elements.
- Intent visualization: subtle halos or particles for AI work.

```css
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.ghostly-card { background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); animation: float 4s ease-in-out infinite; }
@keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(0,212,255,0.3); } 50% { box-shadow: 0 0 40px rgba(0,212,255,0.6); } }
.agentic-hint { animation: pulse-glow 2s ease-in-out infinite; }
```

### The Grain Of Truth

Organic imperfection and tactile realism.

- Digital crease: SVG noise texture overlays.
- Organic type: slight rotation, less rigid alignment.
- Tactile texture: grain backgrounds and irregular borders.

```css
.grain-overlay { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"); }
.organic-shape { border-radius: 48% 52% 50% 50% / 50% 48% 52% 50%; transform: rotate(-1.5deg); }
```

### Liminal Multimodality

Fluid transitions between voice, gesture, gaze, and touch.

- Sensory flow: waveform animation.
- Spatial hints: 3D perspective and parallax.
- Multimodal icons: sound waves, gesture outlines, gaze paths.

### Emotional Sovereignty

Personalization for resonance, not retention.

- Explain recommendations.
- Offer accept / reject choices for sensitive personalization.
- Adapt visual color to content themes when it helps comprehension.

Routing:

- AI / automation -> Ghostly Agency + Emotional Sovereignty.
- Creative / arts -> Grain of Truth + Immersion & Expression.
- Frontier technology -> Ghostly Agency + Liminal Multimodality.
- Humanities / lifestyle -> Grain of Truth + Care & Resonance.
- Enterprise / professional -> Emotional Sovereignty + Trust & Professional.

## Feel References

- Dramatic / cinematic: slow fades, subtle scale, dark spotlight, parallax, full-bleed.
- Technology / future: neon glow, particles, grid, monospace accent, cyan/magenta.
- Playful / friendly: bounce easing, large radius, pastel or bright accents, floating motion.
- Professional / enterprise: subtle 200-300ms animation, clean sans-serif, restrained navy/slate, minimal decoration.
- Calm / minimal: slow subtle motion, whitespace, soft palette, serif heading, focused content.
- Editorial: strong hierarchy, quotes, interwoven image/text, serif heading with sans body.

Animation implementation patterns live in `references/animation-patterns.md`.
