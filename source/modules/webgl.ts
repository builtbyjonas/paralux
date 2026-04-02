import { PluginContext } from "../core/types";

export interface WebGLPluginOptions {
  gl?: WebGLRenderingContext | WebGL2RenderingContext | null; // Generic WebGL context for vanilla
  program?: WebGLProgram | null; // Shader program if natively managing uniforms
  uniformPrefix?: string; // default: 'uParalux'
  onUniformsUpdate?: (uniforms: {
    scrollY: number;
    velocity: number;
    progress: number;
    direction: number;
    skew: number;
  }) => void; // Adapter for react-three-fiber or other libs
}

/**
 * WebGL / GPU Module for Paralux.
 * Allows synchronizing the virtual scroll state natively to a specific WebGL context (passing uniform values)
 * or passing the calculated physics state directly to advanced render systems like Three.JS (React Three Fiber).
 */
export function webgl(options: WebGLPluginOptions = {}) {
  let uScrollYLoc: WebGLUniformLocation | null = null;
  let uVelocityLoc: WebGLUniformLocation | null = null;
  let uProgressLoc: WebGLUniformLocation | null = null;
  let uDirectionLoc: WebGLUniformLocation | null = null;
  let uSkewLoc: WebGLUniformLocation | null = null;

  return {
    name: "webgl",
    init(ctx: PluginContext) {
      // If passing a raw vanilla WebGL Context & Program, resolve uniform locations instantly
      if (options.gl && options.program) {
        const gl = options.gl;
        const prefix = options.uniformPrefix || "uParalux";
        uScrollYLoc = gl.getUniformLocation(
          options.program,
          `${prefix}ScrollY`,
        );
        uVelocityLoc = gl.getUniformLocation(
          options.program,
          `${prefix}Velocity`,
        );
        uProgressLoc = gl.getUniformLocation(
          options.program,
          `${prefix}Progress`,
        );
        uDirectionLoc = gl.getUniformLocation(
          options.program,
          `${prefix}Direction`,
        );
        uSkewLoc = gl.getUniformLocation(options.program, `${prefix}Skew`);
      }
    },
    update(ctx: PluginContext) {
      const { scrollY, velocity, progress, direction } = ctx.state;

      // Calculate generic shader distortion metrics based on engine output
      // Skew limits between -1.0 to 1.0 depending on sheer velocity scaling factors
      const rawSkew = velocity * 0.05;
      const skew = Math.min(Math.max(rawSkew, -1.0), 1.0);

      // Adapt to advanced engines like Three.js / OGL / React Three Fiber externally
      if (options.onUniformsUpdate) {
        options.onUniformsUpdate({
          scrollY,
          velocity,
          progress,
          direction,
          skew,
        });
      }

      // Automatically bind generic uniforms if passing vanilla internal Context
      if (options.gl && options.program) {
        const gl = options.gl;
        // Ensure caller has program bound somewhere in loop for this to be valid
        // Usually handled by their own rAF wrap, if they want strictly managed injection:
        const program = gl.getParameter(gl.CURRENT_PROGRAM);
        if (program === options.program) {
          if (uScrollYLoc) gl.uniform1f(uScrollYLoc, scrollY);
          if (uVelocityLoc) gl.uniform1f(uVelocityLoc, velocity);
          if (uProgressLoc) gl.uniform1f(uProgressLoc, progress);
          if (uDirectionLoc) gl.uniform1f(uDirectionLoc, direction);
          if (uSkewLoc) gl.uniform1f(uSkewLoc, skew);
        }
      }
    },
    destroy(ctx: PluginContext) {
      // Clean up internal memory refs if any
      uScrollYLoc = null;
      uVelocityLoc = null;
      uProgressLoc = null;
      uDirectionLoc = null;
      uSkewLoc = null;
    },
  };
}
