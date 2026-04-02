import { PluginContext } from "../core/types";

export function parallax() {
  let elements: Array<{
    el: HTMLElement;
    speed: number;
    axis: string;
    offset: number;
    initialY: number;
  }> = [];

  return {
    name: "parallax",
    init(ctx: PluginContext) {
      if (typeof document !== "undefined") {
        const nodes = document.querySelectorAll<HTMLElement>("[data-paralux]");
        elements = Array.from(nodes)
          .filter((el) => {
            if (el.hasAttribute("data-paralux-ignore")) return false;
            const position = window.getComputedStyle(el).position;
            return position !== "fixed";
          })
          .map((el) => {
            const rect = el.getBoundingClientRect();
            const speed = parseFloat(el.getAttribute("data-speed") || "0.1");
            const axis = el.getAttribute("data-axis") || "y";
            const offset = parseFloat(el.getAttribute("data-offset") || "0");

            return {
              el,
              speed,
              axis,
              offset,
              initialY: rect.top + window.scrollY,
            };
          });
      }
    },
    update(ctx: PluginContext) {
      const scrollY = ctx.state.scrollY;
      const wh = typeof window !== "undefined" ? window.innerHeight : 0;

      for (let i = 0; i < elements.length; i++) {
        const item = elements[i];

        // Using viewport limits
        const inView =
          item.initialY < scrollY + wh &&
          item.initialY + item.el.clientHeight > scrollY;

        if (inView) {
          const move =
            (scrollY - item.initialY + wh / 2) * item.speed + item.offset;

          if (item.axis === "y") {
            item.el.style.transform = `translate3d(0, ${move}px, 0)`;
          } else {
            item.el.style.transform = `translate3d(${move}px, 0, 0)`;
          }
        }
      }
    },
    destroy(ctx: PluginContext) {
      elements.forEach((item) => {
        item.el.style.transform = "";
      });
      elements = [];
    },
  };
}
