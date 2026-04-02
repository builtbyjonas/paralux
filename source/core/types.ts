/**
 * Configuration used to initialize a {@link Paralux} instance.
 */
export interface ParaluxOptions {
  /** Enables interpolated motion instead of direct target assignment. */
  smooth?: boolean;

  /**
   * Enables wheel-driven virtual scrolling.
   *
   * @remarks
   * In virtual mode, Paralux can control transforms directly for smoother,
   * deterministic effects and plugin-driven animation.
   */
  virtualScroll?: boolean;

  /** Chooses the interpolation model used when `smooth` is enabled. */
  physics?: "lerp" | "spring";

  /** Lerp factor used by `physics: "lerp"` in the range `0..1`. */
  inertia?: number;

  /** Spring damping coefficient used by `physics: "spring"`. */
  damping?: number;

  /** Spring stiffness coefficient used by `physics: "spring"`. */
  stiffness?: number;

  /** Virtual mass used by spring simulation. */
  mass?: number;

  /** Optional velocity clamp applied to per-frame movement deltas. */
  maxVelocity?: number;

  /** Main scroll axis for input, bounds, and transforms. */
  direction?: "vertical" | "horizontal";

  /** Scroll container; defaults to `window` when available. */
  wrapper?: HTMLElement | Window;

  /** Transform target used in virtual smooth mode. */
  content?: HTMLElement;

  /** Automatically starts the engine after construction. */
  autoStart?: boolean;
}

/**
 * Runtime scroll snapshot emitted by Paralux.
 */
export interface ScrollState {
  /** Current rendered/interpolated scroll value in pixels. */
  scrollY: number;

  /** Desired target scroll position in pixels. */
  targetScrollY: number;

  /** Signed per-frame delta between previous and current `scrollY`. */
  velocity: number;

  /** Last movement direction (`1` forward/down, `-1` backward/up). */
  direction: 1 | -1;

  /** Normalized position in the range `0..1` across max scroll bounds. */
  progress: number;
}

/**
 * Context object passed to plugin lifecycle hooks.
 */
export interface PluginContext {
  /** Engine instance owning the plugin lifecycle. */
  instance: any;

  /** Live mutable scroll state for the current frame. */
  state: ScrollState;

  /** Resolved runtime options used by the active engine. */
  options: ParaluxOptions;

  /** Emits an event through the engine event bus. */
  emit: (event: string, data?: any) => void;

  /** Subscribes to an event through the engine event bus. */
  on: (event: string, callback: (...args: any[]) => void) => void;
}

/**
 * Plugin contract for extending Paralux behavior.
 */
export interface Plugin {
  /** Unique plugin name for debugging and diagnostics. */
  name: string;

  /** Runs once when plugin is registered into a running instance or on `start()`. */
  init?: (ctx: PluginContext) => void;

  /** Runs every animation frame after state update and before event emission. */
  update?: (ctx: PluginContext) => void;

  /** Runs during engine teardown and should release plugin resources. */
  destroy?: (ctx: PluginContext) => void;
}
