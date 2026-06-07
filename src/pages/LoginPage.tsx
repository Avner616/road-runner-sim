import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function LoginPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (session) return <Navigate to="/create" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/create')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-gray-900 p-8"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="mt-1 text-sm text-gray-400">Road Runner Sim</p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-400">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-lg bg-gray-800 px-4 py-2 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-400">Password</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="rounded-lg bg-gray-800 px-4 py-2 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-900/40 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 py-2 font-semibold hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
          className="text-sm text-gray-400 hover:text-white"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </main>
  )
}
