# Paralux — Physics-Based Smooth Scroll & Parallax Engine

## Overview

**Paralux** is a modern, high-performance, physics-driven scroll engine designed for React, Next.js, and vanilla web applications. It replaces native scrolling with a fully controllable virtual scroll system, enabling smooth interpolation, inertia, parallax effects, and scroll-based animations.

Paralux is built with a modular architecture and plugin system, allowing developers to extend functionality without modifying the core.

---

## Core Features

### Smooth Scrolling Engine

- Virtual scroll layer using `requestAnimationFrame`
- Linear interpolation (LERP) and/or spring physics
- Configurable inertia and damping
- Frame-perfect updates (no scroll jank)

### Physics System

- Velocity tracking
- Acceleration & deceleration
- Spring-based motion (stiffness, damping)
- Optional momentum / inertia scrolling

### Parallax System

- Attribute-based (`data-paralux`)
- Programmatic API
- Independent speed control per element
- Supports vertical and horizontal movement

### Scroll State

- `scrollY` (virtual position)
- `targetScrollY` (native position)
- `velocity`
- `direction`
- `progress` (0 → 1)

### Plugin System

- Extend core functionality via `.use()`
- Lifecycle hooks
- Fully modular architecture

### React Integration

- Context Provider
- Hooks (`useParalux`, `useScroll`, etc.)
- Components (`<Parallax />`, `<ScrollScene />`)

### Performance Optimized

- Uses `transform` only (no layout thrashing)
- GPU-accelerated rendering
- Batched DOM reads/writes
- Passive event listeners

---

## Installation

```bash
pnpm add paralux
# or
npm install paralux
```

---

## Basic Usage (Vanilla)

```ts
import { Paralux } from "paralux";

const paralux = new Paralux({
  smooth: true,
  inertia: 0.08,
});

paralux.start();
```

---

## React Usage

### Provider

```tsx
import { ParaluxProvider } from "paralux/react";

export default function App() {
  return (
    <ParaluxProvider options={{ inertia: 0.08 }}>
      <YourApp />
    </ParaluxProvider>
  );
}
```

### Hook

```ts
import { useParalux } from "paralux/react";

const { scrollY, velocity, progress } = useParalux();
```

---

## Configuration Options

```ts
new Paralux({
  smooth: true, // Enable smoothing
  inertia: 0.08, // LERP factor
  damping: 0.8, // Physics damping
  stiffness: 0.1, // Spring force
  maxVelocity: 100, // Clamp velocity
  direction: "vertical", // or "horizontal"
  wrapper: HTMLElement, // Scroll container
  content: HTMLElement, // Inner content
  autoStart: true, // Start automatically
});
```

---

## Core API

### Instance Methods

#### `.start()`

Starts the RAF loop.

#### `.stop()`

Stops all updates.

#### `.destroy()`

Removes listeners and cleans up.

#### `.scrollTo(value, options)`

```ts
paralux.scrollTo(500, {
  duration: 800,
  easing: "easeOut",
});
```

#### `.on(event, callback)`

```ts
paralux.on("scroll", (state) => {});
paralux.on("enter", (element) => {});
paralux.on("leave", (element) => {});
```

---

## Events

| Event  | Description             |
| ------ | ----------------------- |
| scroll | Fires every frame       |
| enter  | Element enters viewport |
| leave  | Element leaves viewport |
| resize | Window resized          |
| update | Internal update cycle   |

---

## Parallax System

### HTML API

```html
<div data-paralux data-speed="0.3"></div>
<div data-paralux data-speed="-0.2"></div>
```

### Options

| Attribute   | Description         |
| ----------- | ------------------- |
| data-speed  | Movement multiplier |
| data-axis   | x or y              |
| data-offset | Custom offset       |

---

### React Component

```tsx
import { Parallax } from "paralux/react";

<Parallax speed={0.3}>
  <img src="/hero.png" />
</Parallax>;
```

---

## Scroll State Object

```ts
{
  scrollY: number,
  targetScrollY: number,
  velocity: number,
  direction: 1 | -1,
  progress: number
}
```

---

## Plugin System

### Usage

```ts
paralux.use(myPlugin());
```

### Plugin Structure

```ts
function myPlugin() {
  return {
    name: "my-plugin",

    init(ctx) {},

    update(ctx) {},

    destroy(ctx) {},
  };
}
```

### Plugin Context

```ts
{
  (instance, state, options, emit, on);
}
```

---

## Built-in Modules (Recommended)

### Parallax Module

Handles `[data-paralux]` elements.

### InView Module

Detects elements entering/leaving viewport.

### Velocity Module

Tracks scroll velocity and exposes it.

---

## In-View Detection

```html
<div data-inview></div>
```

```ts
paralux.on("enter", (el) => {});
paralux.on("leave", (el) => {});
```

---

## Scroll Progress

```ts
const progress = scrollY / maxScroll;
```

Used for:

- animations
- timelines
- progress bars

---

## Advanced Features

### Horizontal Scrolling

```ts
direction: "horizontal";
```

### Custom Easing

```ts
scrollTo(1000, {
  easing: (t) => t * t,
});
```

### Velocity-Based Animations

```ts
if (velocity > 20) {
  // trigger effect
}
```

---

## CSS Requirements

```css
html,
body {
  height: 200%;
  scroll-behavior: auto;
}

#paralux-container {
  position: fixed;
  inset: 0;
  will-change: transform;
}
```

---

## Performance Guidelines

- Only animate `transform` and `opacity`
- Avoid layout-triggering properties
- Minimize DOM queries
- Use `will-change`
- Keep plugin logic lightweight

---

## Architecture

### Core Loop

1. Read native scroll
2. Apply physics (LERP / spring)
3. Update state
4. Emit events
5. Apply transforms

---

## File Structure (Recommended)

```
paralux/
 ├── core/
 ├── modules/
 ├── react/
 ├── plugins/
 ├── utils/
 └── index.ts
```

---

## Future Extensions

- WebGPU-based effects
- Shader-driven parallax
- Timeline system (GSAP-like)
- Devtools panel
- Visual editor
- Animation presets

---

## Example: Full Setup

```ts
import { Paralux } from "paralux";
import { parallax } from "paralux/modules";

const paralux = new Paralux({
  inertia: 0.08,
});

paralux.use(parallax());

paralux.start();
```

---

## Philosophy

Paralux is designed to be:

- Minimal at its core
- Powerful through plugins
- Physics-driven
- Framework-agnostic
- Developer-first

---

## License

MIT

---

## Author

Jonas Franke / ByJonas

---

## Status

Active development — designed for high-end interactive web experiences.

---
