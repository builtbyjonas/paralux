import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { Paralux } from "../core/Paralux";
import { ParaluxOptions, ScrollState } from "../core/types";

/**
 * React context payload shared by Paralux React bindings.
 */
export interface ParaluxContextValue {
  /** Active Paralux instance, or `null` before initialization. */
  paralux: Paralux | null;

  /** Latest emitted scroll state, or `null` before first scroll tick. */
  state: ScrollState | null;
}

/**
 * Props accepted by {@link ParaluxProvider}.
 */
export interface ParaluxProviderProps {
  /** React subtree that should receive Paralux context/state updates. */
  children: ReactNode;

  /** Optional Paralux runtime configuration. */
  options?: ParaluxOptions;
}

/**
 * Props accepted by {@link Parallax}.
 */
export interface ParallaxProps {
  /** Wrapped content transformed in response to scroll updates. */
  children: ReactNode;

  /** Multiplier applied to scroll movement. */
  speed: number;

  /** Axis along which transform is applied. Defaults to `"y"`. */
  axis?: "x" | "y";

  /** Constant pixel offset added after speed scaling. */
  offset?: number;
}

const ParaluxContext = createContext<ParaluxContextValue>({
  paralux: null,
  state: null,
});

/**
 * Provides a shared Paralux instance and live scroll state to React descendants.
 *
 * @param props Provider props.
 * @returns Context provider with optional internal wrapper/content elements used
 * for virtual scrolling.
 *
 * @remarks
 * If `options.wrapper` or `options.content` are omitted while `virtualScroll`
 * is enabled, the provider creates internal wrapper/content elements.
 */
export function ParaluxProvider({ children, options }: ParaluxProviderProps) {
  const [paralux, setParalux] = useState<Paralux | null>(null);
  const [state, setState] = useState<ScrollState | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const instance = new Paralux({
      ...options,
      wrapper:
        options?.wrapper ??
        (options?.virtualScroll ? wrapperRef.current! : window),
      content: options?.content ?? contentRef.current ?? undefined,
    });
    instance.on("scroll", (newState: ScrollState) => {
      setState({ ...newState });
    });
    setParalux(instance);

    return () => {
      instance.destroy();
    };
  }, []);

  const wrapperStyle =
    options?.virtualScroll && !options?.wrapper
      ? {
          position: "relative" as const,
          height: "100vh",
          overflowX: "hidden" as const,
          overflowY: "auto" as const,
          width: "100%",
        }
      : undefined;

  const contentStyle =
    options?.virtualScroll && !options?.content
      ? {
          position: "relative" as const,
          overflow: "hidden" as const,
          width: "100%",
        }
      : undefined;

  return (
    <ParaluxContext.Provider value={{ paralux, state }}>
      <div ref={wrapperRef} style={wrapperStyle}>
        <div ref={contentRef} style={contentStyle}>
          {children}
        </div>
      </div>
    </ParaluxContext.Provider>
  );
}

/**
 * Returns the latest Paralux scroll snapshot from context.
 *
 * @returns The current `ScrollState`. Before initialization emits values, a
 * stable zeroed fallback is returned.
 */
export function useParalux() {
  const context = useContext(ParaluxContext);
  if (context === undefined) {
    throw new Error("useParalux must be used within a ParaluxProvider");
  }
  return (
    context.state || {
      scrollY: 0,
      targetScrollY: 0,
      velocity: 0,
      direction: 1,
      progress: 0,
    }
  );
}

/**
 * Applies a scroll-reactive transform to its children.
 *
 * @param props Parallax rendering options.
 * @returns A transformed wrapper element.
 *
 * @example
 * <Parallax speed={0.3} offset={20}>
 *   <img src="/hero.png" alt="Hero" />
 * </Parallax>
 */
export function Parallax({
  children,
  speed,
  axis = "y",
  offset = 0,
}: ParallaxProps) {
  const { scrollY } = useParalux();

  const transform =
    axis === "y"
      ? `translate3d(0, ${-scrollY * speed + offset}px, 0)`
      : `translate3d(${-scrollY * speed + offset}px, 0, 0)`;

  return <div style={{ transform, willChange: "transform" }}>{children}</div>;
}
