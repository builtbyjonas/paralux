# React Reference

Paralux comes with first-class primitives for React via `paralux/react`.

## `<ParaluxProvider>`

Provides the engine context to your entire component tree. It initializes a new `Paralux` instance internally and tracks scroll updates.

```tsx
import { ParaluxProvider } from "paralux/react";

function MyApp({ children }) {
  return (
    <ParaluxProvider
      options={{
        smooth: true,
        virtualScroll: true,
        physics: "spring",
      }}
    >
      {children}
    </ParaluxProvider>
  );
}
```

## `useParalux` Hook

Retrieves the active `ScrollState` block reactively.

_Warning: Because this hook updates every frame (60-144 times a second), components consuming this hook will re-render frequently. Use cautiously or break down to memoized leaf components!_

```tsx
import { useParalux } from "paralux/react";

function ScrollWatcher() {
  const { scrollY, velocity, progress, direction } = useParalux();

  return (
    <div>
      <p>Scroll: {Math.round(scrollY)}px</p>
      <p>Speed: {velocity}</p>
      <p>Progress: {(progress * 100).toFixed(2)}%</p>
    </div>
  );
}
```

## `<Parallax>` Component

An easy-to-use primitive that reads the internal engine context and maps the `transform` inline styles per frame, creating smooth parallax layers automatically.

```tsx
import { Parallax } from "paralux/react";

function Hero() {
  return (
    <div className="hero-section">
      {/* Background moves very slowly */}
      <Parallax speed={0.2} axis="y">
        <img src="bg-mountain.jpg" alt="Background" />
      </Parallax>

      {/* Foreground moves rapidly */}
      <Parallax speed={1.5} axis="y">
        <h1>Welcome to React+Paralux</h1>
      </Parallax>
    </div>
  );
}
```

### Parallax Props

| Prop     | Type         | Default    | Description                                    |
| -------- | ------------ | ---------- | ---------------------------------------------- |
| `speed`  | `number`     | `required` | The parallax scale relative to scroll distance |
| `axis`   | `'x' \| 'y'` | `'y'`      | Scroll transition axis                         |
| `offset` | `number`     | `0`        | Base pixel offset applied to transform         |
