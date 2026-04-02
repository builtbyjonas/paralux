# Paralux

**Paralux** is a modern, high-performance, physics-driven scroll engine designed for React, Next.js, and vanilla web applications. It replaces native scrolling with a fully controllable virtual scroll system, enabling smooth interpolation, inertia, parallax effects, and scroll-based animations.

> [!CAUTION]
> Paralux is still in early development. The API is not yet stable and may change without a major version bump. Use with caution in production environments and expect breaking changes as the library evolves.

## Features

- **Smooth Scrolling Engine:** Virtual scroll layer using `requestAnimationFrame`.
- **Physics System:** Built-in Spring and LERP physics mechanics mimicking native iOS-like inertia.
- **Parallax System:** Attribute-based or programmatic parallax mapping.
- **Auto-Recalculation:** Smart viewport caching using `ResizeObserver` & `MutationObserver` ensures your scroll limits never break during dynamic DOM updates.
- **WebGL / GPU Sync:** Built-in `.webgl` plugin syncing scroll vectors and mathematically deduced `skew` limits natively to your shaders.
- **React Support First-Class:** Includes a robust set of typed providers and hooks.

## Installation

```bash
npm install paralux normalize-wheel
# or
pnpm add paralux normalize-wheel
```

_(Note: `normalize-wheel` is required for virtual scroll hijacking)_

## Quick Start (Vanilla)

```ts
import { Paralux } from "paralux";
import { parallax, velocity } from "paralux/modules";

const paralux = new Paralux({
  smooth: true,
  virtualScroll: true,
  physics: "spring",
  stiffness: 150,
  damping: 20,
});

paralux.use(parallax());
paralux.use(velocity());
```

## Quick Start (React)

```tsx
import { ParaluxProvider, Parallax, useParalux } from "paralux/react";

export default function App() {
  return (
    <ParaluxProvider options={{ smooth: true, virtualScroll: true }}>
      <Parallax speed={0.5}>
        <h1>This moves half as fast!</h1>
      </Parallax>

      {/* Your App */}
    </ParaluxProvider>
  );
}
```

## Documentation

For a deep dive into the APIs and advanced usage, see the `docs/` directory:

- [Getting Started](docs/getting-started.md)
- [Core API Reference](docs/api.md)
- [Available Plugins](docs/plugins.md)
- [React Reference](docs/react.md)
- [Physics & WebGL Guide](docs/physics-and-webgl.md)

---

**License**: MIT  
**Author**: ByJonas / Jonas Franke
