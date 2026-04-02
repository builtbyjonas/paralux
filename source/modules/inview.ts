import { PluginContext } from "../core/types";

export function inview() {
  let observer: IntersectionObserver | null = null;
  let elements: HTMLElement[] = [];

  return {
    name: "inview",
    init(ctx: PluginContext) {
      if (
        typeof window === "undefined" ||
        typeof IntersectionObserver === "undefined"
      )
        return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              ctx.emit("enter", entry.target);
              entry.target.setAttribute("data-inview-state", "entered");
            } else {
              ctx.emit("leave", entry.target);
              entry.target.setAttribute("data-inview-state", "left");
            }
          });
        },
        {
          root: null,
          rootMargin: "0px",
          threshold: 0,
        },
      );

      const nodes = document.querySelectorAll<HTMLElement>("[data-inview]");
      elements = Array.from(nodes);

      elements.forEach((el) => observer?.observe(el));
    },
    update(ctx: PluginContext) {
      // Handled natively by IntersectionObserver
    },
    destroy(ctx: PluginContext) {
      if (observer) {
        elements.forEach((el) => observer?.unobserve(el));
        observer.disconnect();
        observer = null;
      }
      elements = [];
    },
  };
}
