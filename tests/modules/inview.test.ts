import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { inview } from "../../source/modules/inview";
import { PluginContext } from "../../source/core/types";

describe("Inview Module", () => {
  let mockContext: PluginContext;
  let mockObserver: any;
  let emitMock: any;

  beforeEach(() => {
    emitMock = vi.fn();
    mockContext = {
      emit: emitMock,
      state: {},
      options: {},
      metrics: {},
    } as any;

    mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };

    global.IntersectionObserver = class {
      constructor(callback: any, options: any) {
        mockObserver.callback = callback;
        return mockObserver;
      }
    } as any;

    document.body.innerHTML = `
      <div data-inview id="el1"></div>
      <div data-inview id="el2"></div>
      <div id="no-inview"></div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  const inviewPlugin = inview();

  it("should initialize and observe elements with data-inview attribute", () => {
    inviewPlugin.init!(mockContext);

    expect(mockObserver.observe).toHaveBeenCalledTimes(2);
  });

  it("should handle entries natively via intersection callback", () => {
    inviewPlugin.init!(mockContext);

    const el1 = document.getElementById("el1")!;

    // Simulate entry entering viewport
    mockObserver.callback([{ target: el1, isIntersecting: true }]);

    expect(emitMock).toHaveBeenCalledWith("enter", el1);
    expect(el1.getAttribute("data-inview-state")).toBe("entered");

    // Simulate entry leaving viewport
    mockObserver.callback([{ target: el1, isIntersecting: false }]);

    expect(emitMock).toHaveBeenCalledWith("leave", el1);
    expect(el1.getAttribute("data-inview-state")).toBe("left");
  });

  it("should clean up observer on destroy", () => {
    inviewPlugin.init!(mockContext);
    inviewPlugin.destroy!(mockContext);

    expect(mockObserver.unobserve).toHaveBeenCalledTimes(2);
    expect(mockObserver.disconnect).toHaveBeenCalled();
  });
});
