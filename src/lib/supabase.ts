import { createClient } from '@supabase/supabase-js'
import type { RunnerProfile } from '../engine/types/runner'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function saveRunner(runner: RunnerProfile): Promise<{ error: string | null }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be signed in to save a runner.' }
  }

  const { error } = await supabase.from('runners').insert({
    id:               runner.id,
    user_id:          user.id,
    name:             runner.name,
    gender:           runner.gender,
    age:              runner.age,
    nationality:      runner.nationality,
    home_location:    runner.homeLocation,
    avatar_url:       runner.avatarUrl ?? null,
    runner_type:      runner.runnerType,
    preferred_event:  runner.preferredEvent,
    attributes:       runner.attributes,
    hidden_potential: runner.hiddenPotential,
    fitness_age:      runner.fitnessAge,
    created_at:       runner.createdAt,
  })

  return { error: error ? error.message : null }
}
