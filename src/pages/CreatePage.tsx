import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RunnerCreation from '../components/RunnerCreation'
import type { RunnerProfile } from '../engine/types/runner'
import { saveRunner } from '../lib/supabase'

export default function CreatePage() {
  const navigate = useNavigate()
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleComplete(runner: RunnerProfile | null) {
    if (!runner) return
    console.log('runner', runner)
    setSaveError(null)
    const { error } = await saveRunner(runner)
    if (error) {
      setSaveError(error)
      return
    }
    navigate('/dashboard')
  }

  return (
    <>
      <RunnerCreation onComplete={handleComplete} />
      {saveError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-red-600 px-5 py-3 text-sm text-white shadow-lg">
          {saveError}
        </div>
      )}
    </>
  )
}
