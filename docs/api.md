# The Core API

This document covers the primary `Paralux` class and API methods.

## Instantiation

```ts
const paralux = new Paralux({
  wrapper: document.getElementById("scroller"), // Usually window or body
  content: document.getElementById("content"),
  smooth: true,
  virtualScroll: true,
  physics: "spring",
  inertia: 0.08,
  stiffness: 150,
  damping: 20,
  mass: 1,
  direction: "vertical",
});
```

## Methods

- `start()`: Boots the requestAnimationFrame loop and bounds DOM listeners.
- `stop()`: Halts the RAF loop and removes bound temporary DOM listeners.
- `destroy()`: Kills entirely, clearing events, observers, and plugin lifecycles.
- `scrollTo(y, options)`: Programmatically updates the `targetScrollY` applying spring logic smoothly to the destination.
- `use(plugin)`: Integrates modular capabilities like `webgl()`, `parallax()`, or custom interceptors.
- `on(event, cb)`: Event bus for standard lifecycle triggers (`scroll`, `resize`, `enter`, `leave`).
