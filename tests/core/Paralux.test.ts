import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Paralux } from "../../source/index";
import { Plugin } from "../../source/core/types";

describe("Paralux Engine", () => {
  let wrapper: HTMLDivElement;
  let content: HTMLDivElement;

  beforeEach(() => {
    wrapper = document.createElement("div");
    content = document.createElement("div");
    wrapper.appendChild(content);
    document.body.appendChild(wrapper);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(Paralux).toBeDefined();
  });

  it("should initialize with default options", () => {
    const p = new Paralux({ autoStart: false });
    expect(p.options.smooth).toBe(true);
    expect(p.options.physics).toBe("lerp");
    expect(p.options.virtualScroll).toBe(false);
    expect(p.state).toBeDefined();
    expect(p.state.scrollY).toBe(0);
  });

  it("should allow configuring physics and scroll wrapper", () => {
    const p = new Paralux({
      physics: "spring",
      stiffness: 200,
      damping: 10,
      wrapper,
      content,
      autoStart: false,
    });

    expect(p.options.physics).toBe("spring");
    expect(p.options.stiffness).toBe(200);
    expect(p.options.damping).toBe(10);
    expect(p.options.wrapper).toBe(wrapper);
  });

  it("should register plugins via use()", () => {
    const p = new Paralux({ autoStart: false });

    const mockPlugin: Plugin = {
      name: "test-plugin",
      init: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    };

    p.use(mockPlugin);

    expect(mockPlugin.name).toBe("test-plugin");
  });

  it("should handle events using on() and emit()", () => {
    const p = new Paralux({ autoStart: false });
    const callback = vi.fn();

    p.on("customEvent", callback);
    p.emit("customEvent", 123, "test");

    expect(callback).toHaveBeenCalledWith(123, "test");
  });

  it("should recalculate on start", () => {
    const p = new Paralux({ wrapper, content, autoStart: false });
    const recalculateSpy = vi.spyOn(p, "recalculate");

    p.start();
    expect(recalculateSpy).toHaveBeenCalled();
    p.stop();
  });

  it("should execute plugin lifecycles", () => {
    const p = new Paralux({ autoStart: false });

    const mockPlugin: Plugin = {
      name: "test-lifecycle",
      init: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    };

    p.use(mockPlugin);

    p.start(); // Should call init()
    expect(mockPlugin.init).toHaveBeenCalled();

    p.destroy(); // Should call destroy()
    expect(mockPlugin.destroy).toHaveBeenCalled();
  });
});
