import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import StudioPage from './pages/StudioPage'
import CharacterCreator from './pages/CharacterCreator'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [page, setPage] = useState('home')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setPage('home')
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <AuthPage />

  if (page === 'studio')    return <StudioPage onBack={() => setPage('home')} user={session.user} />
  if (page === 'character') return <CharacterCreator onBack={() => setPage('home')} />

  return (
    <HomePage
      user={session.user}
      onEnterStudio={() => setPage('studio')}
      onEnterCharacter={() => setPage('character')}
    />
  )
}
