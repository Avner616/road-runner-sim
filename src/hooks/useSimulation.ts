import { useEffect, useRef, useState } from 'react'
import { SimulationEngine, SimState } from '../engine'

export function useSimulation() {
  const engine = useRef(new SimulationEngine())
  const [state, setState] = useState<SimState>({ tick: 0, running: false })

  useEffect(() => {
    return () => engine.current.stop()
  }, [])

  const start = () => engine.current.start(setState)
  const stop = () => {
    engine.current.stop()
    setState((s) => ({ ...s, running: false }))
  }

  return { state, start, stop }
}
