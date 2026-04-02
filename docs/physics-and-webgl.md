# Physics and WebGL

Paralux includes a powerful physics interceptor and WebGL uniform binder.

## Physics Modes

- **`lerp`**: Linear interpolation smoothly drifts the position based on the `inertia` factor (0.01 - 0.15).
- **`spring`**: A Hooke's Law algorithm mapped to `stiffness`, `damping`, and `mass`. This mimics hyper-realistic momentum scrolling exactly like iOS.

```ts
new Paralux({
  physics: "spring",
  stiffness: 150, // Tension
  damping: 20, // Bounce reduction
  mass: 1, // Weight
});
```

## WebGL Integration

The `webgl` plugin transmits the virtual scrolling layout cleanly to the GPU.

```ts
import { webgl } from "paralux/modules";

paralux.use(
  webgl({
    gl: glContext,
    program: glProgram,
  }),
);
```

It maps to uniforms:

- `uParaluxScrollY`: Viewport progression pixels.
- `uParaluxVelocity`: Current scroll momentum.
- `uParaluxProgress`: Normalized `0.0 -> 1.0` document progress.
- `uParaluxDirection`: Scroll polarity.
- `uParaluxSkew`: A safe `-1.0` to `1.0` shear factor.
