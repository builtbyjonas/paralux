# Available Plugins

Paralux is designed to be slim at its core and extensible via Plugins.

You can activate plugins using the `.use()` method:

```ts
import { Paralux } from "paralux";
import { parallax, velocity, inview, webgl } from "paralux/modules";

const paralux = new Paralux();
paralux.use(parallax());
```

## Built-in Modules

### 1. Parallax (`parallax()`)

Queries the DOM for elements with the `data-paralux` attribute and translates them dynamically.
**HTML Usage:**

```html
<!-- Moves half as fast as you scroll -->
<div data-paralux data-speed="0.5"></div>

<!-- Moves horizontally -->
<div data-paralux data-speed="1.2" data-axis="x"></div>

<!-- Adds a static offset -->
<div data-paralux data-speed="0.8" data-offset="-100"></div>
```

### 2. InView (`inview()`)

Uses `IntersectionObserver` to detect when elements marked with `data-inview` enter or leave the viewport. It toggles the attribute `data-inview-state` dynamically so you can drive CSS animations.
**HTML Usage:**

```html
<div data-inview>Animate Me!</div>
```

**CSS Usage:**

```css
[data-inview-state="entered"] {
  opacity: 1;
  transform: translateY(0);
}
[data-inview-state="left"] {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.5s ease;
}
```

### 3. Velocity (`velocity()`)

Calculates the numerical scroll velocity and polarity/direction, exposing them to the global `:root` (`html`) block natively via CSS variables.
**CSS Usage:**

```css
html {
  /* Use the velocity variable natively! */
  --paralux-velocity: 0;
  --paralux-direction: 1;
}

.skew-box {
  /* Dynamic skew depending on how fast the user scrolls */
  transform: skewY(calc(var(--paralux-velocity) * 0.1deg));
}
```

### 4. WebGL (`webgl(options)`)

Streams engine states (`scrollY`, `progress`, `velocity`, `skew`) to Shader uniforms. Refer to the [Physics & WebGL Guide](physics-and-webgl.md).

---

## Creating Custom Plugins

Writing a custom plugin is straightforward. You return an object containing lifecycle methods: `init`, `update`, and `destroy`.

```ts
export function myCustomPlugin() {
  return {
    name: "my-plugin",

    init(ctx) {
      // Access ctx.instance, ctx.state, ctx.options, etc.
      console.log("Plugin booted!");
    },

    update(ctx) {
      // Called every frame. Run logic here (DOM reads/writes, canvas draws)
      // ctx.state.scrollY exposes the current scroll position.
    },

    destroy(ctx) {
      // Clean up intervals, memory, variables, nodes...
    },
  };
}
```
