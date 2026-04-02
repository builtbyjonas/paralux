import { describe, it, expect } from "vitest";
import { SpringPhysics, lerp } from "../../source/core/physics";

describe("Physics", () => {
  describe("lerp", () => {
    it("should interpolate exactly halfway", () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it("should interpolate start and end values", () => {
      expect(lerp(0, 100, 0)).toBe(0);
      expect(lerp(0, 100, 1)).toBe(100);
    });
  });

  describe("SpringPhysics", () => {
    it("should initialize with default values", () => {
      const spring = new SpringPhysics(50);
      expect(spring.value).toBe(50);
      expect(spring.target).toBe(50);
      expect(spring.velocity).toBe(0);
      expect(spring.stiffness).toBeDefined();
      expect(spring.damping).toBeDefined();
      expect(spring.mass).toBeDefined();
    });

    it("should initialize with custom config", () => {
      const spring = new SpringPhysics(0, {
        stiffness: 200,
        damping: 30,
        mass: 2,
      });
      expect(spring.stiffness).toBe(200);
      expect(spring.damping).toBe(30);
      expect(spring.mass).toBe(2);
    });

    it("should return initial value when deltaTime is 0", () => {
      const spring = new SpringPhysics(0);
      spring.target = 100;
      expect(spring.update(0)).toBe(0);
    });

    it("should update spring value over time closing in on target", () => {
      const spring = new SpringPhysics(0, {
        stiffness: 100,
        damping: 10,
        mass: 1,
      });
      spring.target = 100;

      // Single step
      spring.update(16); // 16ms, typical frame
      expect(spring.value).toBeGreaterThan(0);
      expect(spring.velocity).toBeGreaterThan(0);

      // Multiple steps
      let previousValue = spring.value;
      for (let i = 0; i < 50; i++) {
        spring.update(16);
      }
      expect(spring.value).toBeGreaterThan(previousValue);
      // Wait for rest condition
      for (let i = 0; i < 200; i++) {
        spring.update(16);
      }
      expect(spring.value).toBeCloseTo(100, 1);
      expect(spring.velocity).toBeCloseTo(0, 1);
    });
  });
});
