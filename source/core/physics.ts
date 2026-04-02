/**
 * Frame-rate-independent physical spring handler utilizing a semi-implicit Euler Integrator solving Hooke's Law.
 * Maintains hyper-smooth sub-pixel velocities realistically mapping tensions, dampings, and mass correctly.
 */
export class SpringPhysics {
  public value: number;
  public target: number;
  public velocity: number;
  public stiffness: number;
  public damping: number;
  public mass: number;
  public restSpeedThreshold: number = 0.01;
  public restDisplacementThreshold: number = 0.01;

  /**
   * Generates a new simulated internal physics spring.
   *
   * @param {number} value The starting layout coordinate binding inherently
   * @param {Object} config Mechanical coefficients mirroring native behaviors
   */
  constructor(
    value: number,
    config: { stiffness?: number; damping?: number; mass?: number } = {},
  ) {
    this.value = value;
    this.target = value;
    this.velocity = 0;

    // More accurate defaults for time-stepped hooke's law
    this.stiffness = config.stiffness ?? 150;
    this.damping = config.damping ?? 20;
    this.mass = config.mass ?? 1;
  }

  /**
   * Applies realistic Hooke's Law formulations natively frame-rate independently calculating physics logic realistically preventing tab breaks.
   *
   * @param {number} deltaTime Time past calculating accurate time bounds smoothly preventing frame explosions.
   */
  update(deltaTime: number): number {
    // Prevent explosion on massive frame drops (e.g. tab changed)
    const dt = Math.min(deltaTime / 1000, 0.064);

    if (dt === 0) return this.value;

    // Integrate in small fixed substeps for better numerical stability.
    let remaining = dt;
    const substep = 1 / 120;

    while (remaining > 0) {
      const h = Math.min(substep, remaining);

      // Hooke's law: Force = -k * displacement - c * velocity
      const displacement = this.value - this.target;
      const springForce = -this.stiffness * displacement;
      const dampingForce = -this.damping * this.velocity;
      const force = springForce + dampingForce;
      const acceleration = force / this.mass;

      // Semi-implicit Euler integration
      this.velocity += acceleration * h;
      this.value += this.velocity * h;

      remaining -= h;
    }

    const displacement = this.value - this.target;

    // Rest condition to stop micro-calculations
    if (
      Math.abs(this.velocity) < this.restSpeedThreshold &&
      Math.abs(displacement) < this.restDisplacementThreshold
    ) {
      this.value = this.target;
      this.velocity = 0;
    }

    return this.value;
  }
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}
