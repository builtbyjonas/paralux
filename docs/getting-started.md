# Getting Started

Welcome to Paralux! This guide will walk you through setting up the engine in a standard HTML/JS environment.

## 1. Basic HTML Structure

To use smooth scrolling effectively, you typically need a fixed viewport wrapper and a tall content container. The engine will translate the `content` container inside the `wrapper`.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <style>
      body,
      html {
        margin: 0;
        padding: 0;
      }
      /* The wrapper acts as the fixed window bounds */
      #wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      /* The content holds your actual website layout */
      #content {
        will-change: transform;
      }
    </style>
  </head>
  <body>
    <div id="wrapper">
      <main id="content">
        <h1>Welcome to Paralux!</h1>
        <!-- Lots of content here ... -->
      </main>
    </div>
  </body>
</html>
```

## 2. Initialization

Now, instantiate the engine using the elements defined above.

```ts
import { Paralux } from "paralux";

const paralux = new Paralux({
  wrapper: document.getElementById("wrapper"),
  content: document.getElementById("content"),
  smooth: true,
  virtualScroll: true, // Hijacks the `wheel` event for physical scrolling
  physics: "spring",
  stiffness: 150,
  damping: 20,
});
```

Whenever the user scrolls, Paralux calculates the physics and applies a `translate3d` to `#content`, providing a buttery smooth experience. As the content changes in height, Paralux automatically recalculates the max scroll boundaries for you.
