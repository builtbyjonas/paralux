import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { velocity } from "../../source/modules/velocity";
import { PluginContext, ScrollState } from "../../source/core/types";

describe("Velocity Module", () => {
  let mockState: ScrollState;
  let mockContext: PluginContext;
  let documentElStyle: CSSStyleDeclaration;

  beforeEach(() => {
    mockState = {
      scrollY: 0,
      targetScrollY: 0,
      velocity: 0,
      direction: 1,
      progress: 0,
    };

    mockContext = {
      state: mockState,
      options: {},
      metrics: { maxScroll: 1000 },
    } as any;

    documentElStyle = document.documentElement.style;
    // Clear out any previous styles
    documentElStyle.removeProperty("--paralux-velocity");
    documentElStyle.removeProperty("--paralux-direction");
  });

  afterEach(() => {
    documentElStyle.removeProperty("--paralux-velocity");
    documentElStyle.removeProperty("--paralux-direction");
  });

  const speedPlugin = velocity();

  it("should initialize and set default CSS variables", () => {
    expect(speedPlugin.name).toBe("velocity");

    speedPlugin.init!(mockContext);

    expect(documentElStyle.getPropertyValue("--paralux-velocity")).toBe("0");
    expect(documentElStyle.getPropertyValue("--paralux-direction")).toBe("1");
  });

  it("should update CSS variables based on context state", () => {
    mockState.velocity = 45.6789;
    mockState.direction = -1;

    speedPlugin.update!(mockContext);

    expect(documentElStyle.getPropertyValue("--paralux-velocity")).toBe(
      "45.68",
    ); // Checks rounding
    expect(documentElStyle.getPropertyValue("--paralux-direction")).toBe("-1");

    mockState.velocity = 120.123;
    mockState.direction = 1;

    speedPlugin.update!(mockContext);

    expect(documentElStyle.getPropertyValue("--paralux-velocity")).toBe(
      "120.12",
    );
    expect(documentElStyle.getPropertyValue("--paralux-direction")).toBe("1");
  });

  it("should clean up CSS variables on destroy", () => {
    speedPlugin.init!(mockContext);

    speedPlugin.destroy!(mockContext);

    expect(documentElStyle.getPropertyValue("--paralux-velocity")).toBe("");
    expect(documentElStyle.getPropertyValue("--paralux-direction")).toBe("");
  });
});
