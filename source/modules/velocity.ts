import { PluginContext } from "../core/types";

export function velocity() {
  return {
    name: "velocity",
    init(ctx: PluginContext) {
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--paralux-velocity", "0");
        document.documentElement.style.setProperty("--paralux-direction", "1");
      }
    },
    update(ctx: PluginContext) {
      const v = Math.round(ctx.state.velocity * 100) / 100;
      const dir = ctx.state.direction;
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty(
          "--paralux-velocity",
          v.toString(),
        );
        document.documentElement.style.setProperty(
          "--paralux-direction",
          dir.toString(),
        );
      }
    },
    destroy(ctx: PluginContext) {
      if (typeof document !== "undefined") {
        document.documentElement.style.removeProperty("--paralux-velocity");
        document.documentElement.style.removeProperty("--paralux-direction");
      }
    },
  };
}
