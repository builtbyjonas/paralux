import { describe, it, expect, vi, beforeEach } from "vitest";
import { webgl } from "../../source/modules/webgl";
import { PluginContext } from "../../source/core/types";

describe("WebGL Module", () => {
  let mockContext: PluginContext;

  beforeEach(() => {
    mockContext = {
      state: {
        scrollY: 100,
        targetScrollY: 100,
        velocity: 50,
        direction: 1,
        progress: 0.5,
      },
      options: {},
      metrics: { maxScroll: 1000 },
    } as any;
  });

  it("should call onUniformsUpdate adapter", () => {
    const onUniformsUpdate = vi.fn();
    const plugin = webgl({ onUniformsUpdate });

    plugin.init!(mockContext);
    plugin.update!(mockContext);

    expect(onUniformsUpdate).toHaveBeenCalledWith({
      scrollY: 100,
      velocity: 50,
      progress: 0.5,
      direction: 1,
      skew: 1.0, // 50 * 0.05 = 2.5, clamped to 1.0
    });
  });

  it("should clamp skew between -1.0 and 1.0", () => {
    const onUniformsUpdate = vi.fn();
    const plugin = webgl({ onUniformsUpdate });

    mockContext.state.velocity = -100;
    plugin.update!(mockContext);

    expect(onUniformsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        skew: -1.0, // -100 * 0.05 = -5.0, clamped to -1.0
      }),
    );

    mockContext.state.velocity = 5;
    plugin.update!(mockContext);

    expect(onUniformsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        skew: 0.25, // 5 * 0.05 = 0.25
      }),
    );
  });

  it("should update vanilla WebGL uniforms natively avoiding JS gc issues", () => {
    const mockProgram = {} as WebGLProgram;

    const mockGl = {
      getUniformLocation: vi.fn((prog, name) => "loc_" + name),
      getParameter: vi.fn(() => mockProgram),
      CURRENT_PROGRAM: 12345,
      uniform1f: vi.fn(),
    } as any as WebGLRenderingContext;

    const plugin = webgl({
      gl: mockGl,
      program: mockProgram,
      uniformPrefix: "test",
    });

    plugin.init!(mockContext);

    expect(mockGl.getUniformLocation).toHaveBeenCalledWith(
      mockProgram,
      "testScrollY",
    );
    expect(mockGl.getUniformLocation).toHaveBeenCalledWith(
      mockProgram,
      "testVelocity",
    );
    expect(mockGl.getUniformLocation).toHaveBeenCalledWith(
      mockProgram,
      "testProgress",
    );
    expect(mockGl.getUniformLocation).toHaveBeenCalledWith(
      mockProgram,
      "testDirection",
    );
    expect(mockGl.getUniformLocation).toHaveBeenCalledWith(
      mockProgram,
      "testSkew",
    );

    // Make sure program matches
    plugin.update!(mockContext);

    expect(mockGl.uniform1f).toHaveBeenCalledWith("loc_testScrollY", 100);
    expect(mockGl.uniform1f).toHaveBeenCalledWith("loc_testVelocity", 50);
    expect(mockGl.uniform1f).toHaveBeenCalledWith("loc_testProgress", 0.5);
    expect(mockGl.uniform1f).toHaveBeenCalledWith("loc_testDirection", 1);
    expect(mockGl.uniform1f).toHaveBeenCalledWith("loc_testSkew", 1.0); // Clamped value again (50 * 0.05 -> clamped to 1)

    plugin.destroy!(mockContext);
  });
});
