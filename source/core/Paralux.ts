import { ParaluxOptions, ScrollState, Plugin, PluginContext } from "./types";
import { SpringPhysics, lerp } from "./physics";
import normalizeWheel from "normalize-wheel";

/**
 * Physics-driven scroll engine that powers the Paralux runtime.
 *
 * Supports:
 * - native and virtual scrolling
 * - spring or lerp-based interpolation
 * - plugin lifecycle hooks (`init`, `update`, `destroy`)
 * - event-driven subscriptions (`scroll`, `resize`, custom events)
 *
 * @remarks
 * Use virtual mode (`virtualScroll: true`) when you want deterministic motion and
 * transform-driven effects. Use native mode for standard browser scrolling with
 * state tracking and plugin updates.
 *
 * @example
 * const paralux = new Paralux({
 *   smooth: true,
 *   virtualScroll: true,
 *   physics: "spring",
 *   stiffness: 150,
 *   damping: 20,
 * });
 *
 * paralux.on("scroll", (state) => {
 *   console.log(state.progress);
 * });
 */
export class Paralux {
  /** Resolved runtime options after merging defaults and user configuration. */
  public options: ParaluxOptions;

  /** Latest computed scroll state consumed by plugins and UI integrations. */
  public state: ScrollState;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private spring: SpringPhysics;
  private plugins: Plugin[] = [];
  private eventListeners: Map<string, Array<(...args: any[]) => void>> =
    new Map();
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private cachedMaxScroll: number = 0;
  private previousBodyOverflow: string = "";
  private previousHtmlOverflowX: string = "";
  private previousHtmlOverflowY: string = "";
  private isSyncingNativeScroll: boolean = false;
  private lastSyncedScrollPosition: number = 0;
  private lastUserNativeScrollAt: number = 0;

  /**
   * Creates a new engine instance.
   *
   * @param options Runtime behavior configuration.
   * @remarks
   * `autoStart` defaults to `true`, so listeners and animation loops are attached
   * immediately unless explicitly disabled.
   */
  constructor(options: ParaluxOptions = {}) {
    this.options = {
      smooth: true,
      virtualScroll: false,
      physics: "lerp",
      inertia: 0.08,
      damping: 16,
      stiffness: 120,
      mass: 1.1,
      maxVelocity: 100,
      direction: "vertical",
      wrapper: typeof window !== "undefined" ? window : undefined,
      autoStart: true,
      ...options,
    };

    // Ensure virtual scrolling has a transform target even when content is omitted.
    if (
      !this.options.content &&
      this.options.virtualScroll &&
      typeof document !== "undefined"
    ) {
      this.options.content = document.body;
    }

    if (this.options.content && typeof window !== "undefined") {
      this.options.content.style.willChange = "transform";
    }

    this.state = {
      scrollY: 0,
      targetScrollY: 0,
      velocity: 0,
      direction: 1,
      progress: 0,
    };

    this.spring = new SpringPhysics(0, {
      stiffness: this.options.stiffness,
      damping: this.options.damping,
      mass: this.options.mass,
    });

    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * Registers a plugin into the engine pipeline.
   *
   * @param plugin Plugin definition implementing optional lifecycle hooks.
   * @returns The current instance for fluent chaining.
   * @remarks
   * If the engine is already running, `plugin.init` executes immediately.
   */
  public use(plugin: Plugin): this {
    this.plugins.push(plugin);

    if (this.isRunning && plugin.init) {
      plugin.init(this.getPluginContext());
    }

    return this;
  }

  /**
   * Subscribes to a Paralux event.
   *
   * @param event Event name. Built-in events include `scroll` and `resize`.
   * @param callback Listener invoked with event payload arguments.
   * @returns The current instance for fluent chaining.
   */
  public on(event: string, callback: (...args: any[]) => void): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
    return this;
  }

  /**
   * Emits an event and synchronously invokes all registered listeners.
   *
   * @param event Event name.
   * @param args Event payload.
   */
  public emit(event: string, ...args: any[]): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach((cb) => cb(...args));
    }
  }

  /**
   * Starts the engine loop and attaches DOM observers/listeners.
   *
   * @remarks
   * Calling this method while already running is a no-op.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initialize plugins
    const ctx = this.getPluginContext();
    this.plugins.forEach((p) => p.init && p.init(ctx));

    // Bind native scroll or virtual wheel events
    const wrapper = this.options.wrapper as any;
    if (wrapper) {
      if (this.options.virtualScroll) {
        wrapper.addEventListener("wheel", this.onWheel, { passive: false });
        wrapper.addEventListener("scroll", this.onNativeScroll, {
          passive: true,
        });
        if (wrapper instanceof Window) {
          // Keep vertical scrollbar visible while preventing horizontal jitter.
          this.previousBodyOverflow = document.body.style.overflow;
          this.previousHtmlOverflowX = document.documentElement.style.overflowX;
          this.previousHtmlOverflowY = document.documentElement.style.overflowY;
          document.body.style.overflow = "";
          document.documentElement.style.overflowX = "hidden";
          document.documentElement.style.overflowY = "scroll";
          window.addEventListener("resize", this.recalculate);
        } else {
          if (this.options.direction === "horizontal") {
            wrapper.style.overflowX = "auto";
            wrapper.style.overflowY = "hidden";
          } else {
            wrapper.style.overflowX = "hidden";
            wrapper.style.overflowY = "auto";
          }

          // Element wrappers should use native scroll offset as the visual position.
          if (this.options.content) {
            this.options.content.style.transform = "";
          }
        }
      } else {
        wrapper.addEventListener("scroll", this.onNativeScroll, {
          passive: true,
        });
      }
    }

    // Auto-recalculate maxScroll on DOM updates
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.recalculate());
      if (this.options.content)
        this.resizeObserver.observe(this.options.content);
      if (wrapper && !(wrapper instanceof Window)) {
        this.resizeObserver.observe(wrapper);
      }
    }

    if (typeof MutationObserver !== "undefined" && this.options.content) {
      this.mutationObserver = new MutationObserver(() => this.recalculate());
      this.mutationObserver.observe(this.options.content, {
        childList: true,
        subtree: true,
      });
    }

    this.recalculate();
    this.update();
  }

  /**
   * Stops animation and detaches runtime observers/listeners.
   *
   * @remarks
   * Plugin instances remain registered and can be resumed via `start()`.
   */
  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    const wrapper = this.options.wrapper as any;
    if (wrapper) {
      if (this.options.virtualScroll) {
        wrapper.removeEventListener("wheel", this.onWheel);
        wrapper.removeEventListener("scroll", this.onNativeScroll);
        if (wrapper instanceof Window) {
          document.body.style.overflow = this.previousBodyOverflow;
          document.documentElement.style.overflowX = this.previousHtmlOverflowX;
          document.documentElement.style.overflowY = this.previousHtmlOverflowY;
          window.removeEventListener("resize", this.recalculate);
        } else {
          wrapper.style.overflowX = "";
          wrapper.style.overflowY = "";
        }
      } else {
        wrapper.removeEventListener("scroll", this.onNativeScroll);
      }
    }
  }

  /**
   * Fully disposes the engine and registered plugins.
   *
   * @remarks
   * After destroy, the instance should be considered unusable.
   */
  public destroy(): void {
    this.stop();

    const ctx = this.getPluginContext();
    this.plugins.forEach((p) => p.destroy && p.destroy(ctx));

    this.eventListeners.clear();
    this.plugins = [];
  }

  /**
   * Updates the target scroll position.
   *
   * @param value Absolute destination in pixels.
   * @param options Reserved options for future timed/eased interpolation support.
   * @remarks
   * Currently sets a clamped target immediately. Duration/easing are accepted for
   * forward compatibility but are not yet applied.
   */
  public scrollTo(
    value: number,
    options?: { duration?: number; easing?: string | ((t: number) => number) },
  ): void {
    // Basic implementation for now
    this.state.targetScrollY = Math.max(
      0,
      Math.min(value, this.cachedMaxScroll),
    );
  }

  /**
   * Recomputes scroll bounds and re-clamps state to current content dimensions.
   *
   * @remarks
   * Triggered automatically by observers, but can be called manually after layout
   * changes that are not observed.
   */
  public recalculate = (): void => {
    if (!this.isRunning) return;

    const wrapper = this.options.wrapper as any;
    const content = this.options.content;
    let max = 0;

    if (this.options.virtualScroll && content) {
      if (wrapper && !(wrapper instanceof Window)) {
        if (this.options.direction === "horizontal") {
          max = wrapper.scrollWidth - wrapper.clientWidth;
        } else {
          max = wrapper.scrollHeight - wrapper.clientHeight;
        }
      } else if (content === document.body) {
        // Avoid transform feedback loops when body itself is translated.
        max = document.documentElement.scrollHeight - window.innerHeight;
      } else if (this.options.direction === "horizontal") {
        max = content.scrollWidth - window.innerWidth;
      } else {
        max =
          Math.max(content.scrollHeight, content.offsetHeight) -
          window.innerHeight;
      }
    } else if (wrapper instanceof Window) {
      max = document.documentElement.scrollHeight - window.innerHeight;
    } else if (wrapper) {
      max = wrapper.scrollHeight - wrapper.clientHeight;
    }

    this.cachedMaxScroll = Math.max(0, max);

    // Re-clamp current values if bounds changed.
    this.state.targetScrollY = Math.max(
      0,
      Math.min(this.state.targetScrollY, this.cachedMaxScroll),
    );
    this.state.scrollY = Math.max(
      0,
      Math.min(this.state.scrollY, this.cachedMaxScroll),
    );

    // Keep spring internals in sync to avoid edge bounce after resize/content changes.
    this.spring.target = this.state.targetScrollY;
    this.spring.value = this.state.scrollY;
    this.emit("resize", { maxScroll: this.cachedMaxScroll });
  };

  private onWheel = (e: WheelEvent) => {
    if (!this.options.virtualScroll) return;

    // Prevent default scroll behavior
    // Might fail if not passive: false, but we ensure it in event listener options
    if (e.cancelable) e.preventDefault();

    const normalized = normalizeWheel(e);
    const delta =
      this.options.direction === "horizontal"
        ? normalized.pixelX
        : normalized.pixelY;

    let adjustedDelta = delta;
    if (this.options.physics === "spring") {
      const edgeZone = 160;

      if (adjustedDelta > 0) {
        const distanceToBottom =
          this.cachedMaxScroll - this.state.targetScrollY;
        if (distanceToBottom < edgeZone) {
          const resistance = Math.max(0.12, distanceToBottom / edgeZone);
          adjustedDelta *= resistance;
        }
      } else if (adjustedDelta < 0) {
        const distanceToTop = this.state.targetScrollY;
        if (distanceToTop < edgeZone) {
          const resistance = Math.max(0.12, distanceToTop / edgeZone);
          adjustedDelta *= resistance;
        }
      }
    }

    let target = this.state.targetScrollY + adjustedDelta;

    // clamping
    target = Math.max(0, Math.min(target, this.cachedMaxScroll));

    this.state.targetScrollY = target;
    this.lastUserNativeScrollAt = 0;
  };

  private onNativeScroll = () => {
    const wrapper = this.options.wrapper as Window | HTMLElement;
    const scrollProp =
      this.options.direction === "horizontal" ? "scrollX" : "scrollY";
    const altScrollProp =
      this.options.direction === "horizontal" ? "scrollLeft" : "scrollTop";

    let currentScroll = 0;
    if (wrapper instanceof Window) {
      currentScroll =
        wrapper[scrollProp] || wrapper.document.documentElement[altScrollProp];
    } else {
      currentScroll = wrapper[altScrollProp];

      // If we are in internal sync mode, only ignore the event when it matches
      // our own write. A larger delta indicates real user thumb dragging.
      if (this.isSyncingNativeScroll) {
        if (Math.abs(currentScroll - this.lastSyncedScrollPosition) < 0.5) {
          return;
        }
        this.isSyncingNativeScroll = false;
      }

      // Ignore synthetic scroll events caused by internal sync writes.
      if (
        this.options.virtualScroll &&
        Math.abs(currentScroll - this.lastSyncedScrollPosition) < 0.5
      ) {
        return;
      }
    }

    this.lastUserNativeScrollAt = performance.now();
    this.state.targetScrollY = currentScroll;

    // User-driven scrollbar movement should map directly to state.
    if (this.options.virtualScroll) {
      this.state.scrollY = currentScroll;
      this.spring.target = currentScroll;
      this.spring.value = currentScroll;
      this.spring.velocity = 0;
    }
  };

  private update = (time: number = 0) => {
    if (!this.isRunning) return;

    if (!this.lastTime) this.lastTime = time;
    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    const {
      inertia = 0.08,
      smooth,
      content,
      direction,
      physics,
      maxVelocity,
    } = this.options;
    const wrapper = this.options.wrapper as Window | HTMLElement | undefined;
    const isElementVirtualWrapper =
      !!this.options.virtualScroll && !!wrapper && !(wrapper instanceof Window);

    if (isElementVirtualWrapper && content) {
      const wrapperEl = wrapper as HTMLElement;
      const liveMax =
        direction === "horizontal"
          ? wrapperEl.scrollWidth - wrapperEl.clientWidth
          : wrapperEl.scrollHeight - wrapperEl.clientHeight;

      const normalizedLiveMax = Math.max(0, liveMax);
      if (Math.abs(normalizedLiveMax - this.cachedMaxScroll) > 1) {
        this.cachedMaxScroll = normalizedLiveMax;
      }
    }

    const prevScrollY = this.state.scrollY;

    if (smooth) {
      if (physics === "spring") {
        this.spring.target = this.state.targetScrollY;
        this.state.scrollY = this.spring.update(deltaTime);

        // Clamp spring output at bounds while preserving easing near edges.
        const clamped = Math.max(
          0,
          Math.min(this.state.scrollY, this.cachedMaxScroll),
        );
        if (clamped !== this.state.scrollY) {
          this.state.scrollY = clamped;
          this.spring.value = clamped;

          const hitTop = clamped === 0;
          const hitBottom = clamped === this.cachedMaxScroll;
          const pushingOutOfBounds =
            (hitTop && this.spring.velocity < 0) ||
            (hitBottom && this.spring.velocity > 0);

          if (pushingOutOfBounds) {
            // Dissipate momentum at bounds without an abrupt hard-stop feel.
            this.spring.velocity *= 0.7;
          }
        }
      } else {
        // Fallback to LERP
        this.state.scrollY = lerp(
          this.state.scrollY,
          this.state.targetScrollY,
          inertia,
        );

        // Avoid asymptotic near-end settling that prevents reaching exact bounds.
        if (Math.abs(this.state.targetScrollY - this.state.scrollY) < 0.1) {
          this.state.scrollY = this.state.targetScrollY;
        }
      }
    } else {
      this.state.scrollY = this.state.targetScrollY;
    }

    // Process Velocity with clamping support
    let rawVelocity = this.state.scrollY - prevScrollY;
    if (maxVelocity && Math.abs(rawVelocity) > maxVelocity) {
      rawVelocity = Math.sign(rawVelocity) * maxVelocity;
    }
    this.state.velocity = rawVelocity;

    // Direction
    if (Math.abs(this.state.velocity) > 0.01) {
      this.state.direction = this.state.velocity > 0 ? 1 : -1;
    }

    // Progress
    this.state.progress =
      this.cachedMaxScroll > 0
        ? Math.max(0, Math.min(1, this.state.scrollY / this.cachedMaxScroll))
        : 0;

    // Keep native scrollbar thumb synchronized in virtual element wrapper mode.
    if (isElementVirtualWrapper) {
      const isRecentUserDrag =
        performance.now() - this.lastUserNativeScrollAt < 100;
      if (!isRecentUserDrag) {
        this.isSyncingNativeScroll = true;
        if (direction === "horizontal") {
          this.lastSyncedScrollPosition = this.state.scrollY;
          (wrapper as HTMLElement).scrollLeft = this.state.scrollY;
        } else {
          this.lastSyncedScrollPosition = this.state.scrollY;
          (wrapper as HTMLElement).scrollTop = this.state.scrollY;
        }

        requestAnimationFrame(() => {
          this.isSyncingNativeScroll = false;
        });
      }
    }

    // Apply transform to content if smooth is enabled
    if (smooth && content && !isElementVirtualWrapper) {
      const transform =
        direction === "horizontal"
          ? `translate3d(-${this.state.scrollY}px, 0, 0)`
          : `translate3d(0, -${this.state.scrollY}px, 0)`;
      content.style.transform = transform;
    }

    // Update plugins
    const ctx = this.getPluginContext();
    this.plugins.forEach((p) => p.update && p.update(ctx));

    this.emit("scroll", this.state);

    this.animationFrameId = requestAnimationFrame(this.update);
  };

  private getPluginContext(): PluginContext {
    return {
      instance: this,
      state: this.state,
      options: this.options,
      emit: this.emit.bind(this),
      on: this.on.bind(this),
    };
  }
}
