import { useNavigate } from 'react-router-dom'
import RunnerCreation from '../components/RunnerCreation'
import type { RunnerProfile } from '../engine/types/runner'

export default function CreatePage() {
  const navigate = useNavigate()

  function handleComplete(runner: RunnerProfile | null) {
    if (!runner) return
    console.log('runner', runner)
    navigate('/dashboard')
  }

  return <RunnerCreation onComplete={handleComplete} />
}
