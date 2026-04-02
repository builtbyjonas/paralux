import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parallax } from "../../source/modules/parallax";
import { PluginContext } from "../../source/core/types";

describe("Parallax Module", () => {
  let mockContext: PluginContext;

  beforeEach(() => {
    mockContext = {
      state: {
        scrollY: 0,
        targetScrollY: 0,
        velocity: 0,
        direction: 1,
        progress: 0,
      },
      options: {},
      metrics: { maxScroll: 1000 },
    } as any;

    document.body.innerHTML = `
      <div data-paralux data-speed="0.5" id="p1" style="height: 100px;"></div>
      <div data-paralux data-speed="2.0" data-axis="x" id="p2" style="height: 100px;"></div>
      <div id="no-parallax"></div>
    `;

    // Mock getBoundingClientRect
    const p1 = document.getElementById("p1")!;
    p1.getBoundingClientRect = () => ({ top: 100, height: 100 }) as DOMRect;
    Object.defineProperty(p1, "clientHeight", {
      value: 100,
      configurable: true,
    });

    const p2 = document.getElementById("p2")!;
    p2.getBoundingClientRect = () => ({ top: 500, height: 100 }) as DOMRect;
    Object.defineProperty(p2, "clientHeight", {
      value: 100,
      configurable: true,
    });

    // Mock window scroll and height
    global.innerHeight = 1000;
    global.scrollY = 0;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("should initialize and locate target elements", () => {
    const plugin = parallax();
    plugin.init!(mockContext);

    // We don't have direct access to elements array but we can test interaction
    const p1 = document.getElementById("p1")!;
    expect(p1.style.transform).toBe("");
  });

  it("should apply transform to entirely visible elements based on scroll and speed", () => {
    const plugin = parallax();
    plugin.init!(mockContext);

    // Initial state
    mockContext.state.scrollY = 0;
    plugin.update!(mockContext);

    const p1 = document.getElementById("p1")!;
    const p2 = document.getElementById("p2")!;

    // Formula: move = (scrollY - initialY + (wh / 2)) * speed + offset
    // p1: initialY = 100, speed = 0.5, axis = y, scrollY = 0, wh = 1000
    // move = (0 - 100 + 500) * 0.5 = 400 * 0.5 = 200
    // JSDOM might translate this to 'translate3d(0, 200px, 0)'
    expect(p1.style.transform).toContain("200px");

    // Let's test just the values directly to be safe, JSDOM handles CSS parsing.
    expect(p1.style.transform.includes("200px")).toBe(true);

    // p2: initialY = 500, speed = 2.0, axis = x, scrollY = 0, wh = 1000
    // move = (0 - 500 + 500) * 2.0 = 0
    expect(p2.style.transform.includes("0px")).toBe(true);
  });

  it("should only apply transformations to elements in viewport", () => {
    const plugin = parallax();
    plugin.init!(mockContext);

    // InitialY for p1 is 100, p2 is 500
    // Set scroll way past p1
    mockContext.state.scrollY = 2000;

    // With scrollY = 2000, wh = 1000, viewport corresponds to [2000, 3000].
    // p1 initialY = 100, height = 100 -> extent [100, 200], which is below scroll bounds (not in view).
    // Let's manually change transform to something recognizable to ensure it is not overwritten.
    const p1 = document.getElementById("p1")!;
    p1.style.transform = "translate3d(0px, 9999px, 0px)";

    plugin.update!(mockContext);

    // Shouldn't update because it's not in view
    expect(p1.style.transform).toBe("translate3d(0px, 9999px, 0px)");
  });

  it("should clear transform strings on destroy", () => {
    const plugin = parallax();
    plugin.init!(mockContext);

    mockContext.state.scrollY = 0;
    plugin.update!(mockContext);

    const p1 = document.getElementById("p1")!;
    expect(p1.style.transform).not.toBe("");

    plugin.destroy!(mockContext);

    expect(p1.style.transform).toBe("");
  });
});
