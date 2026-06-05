export interface SimState {
  tick: number
  running: boolean
}

export class SimulationEngine {
  private state: SimState = { tick: 0, running: false }
  private rafId: number | null = null
  private onTick: ((state: SimState) => void) | null = null

  start(onTick: (state: SimState) => void) {
    this.onTick = onTick
    this.state.running = true
    this.loop()
  }

  stop() {
    this.state.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  getState(): Readonly<SimState> {
    return this.state
  }

  private loop() {
    if (!this.state.running) return
    this.state.tick++
    this.onTick?.(this.state)
    this.rafId = requestAnimationFrame(() => this.loop())
  }
}
