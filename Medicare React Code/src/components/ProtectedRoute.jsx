import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase/supabaseClient'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  const [checking,        setChecking]        = useState(true)
  const [validSession,    setValidSession]    = useState(null)
  const [profileCompleted, setProfileCompleted] = useState(null)

  useEffect(() => {
    const checkEverything = async () => {
      const { data: { user: liveUser }, error } = await supabase.auth.getUser()

      if (error || !liveUser) {
        await supabase.auth.signOut()
        setValidSession(false)
        setChecking(false)
        return
      }

      setValidSession(true)

      const { data } = await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('id', liveUser.id)
        .single()

      setProfileCompleted(data?.profile_completed ?? false)
      setChecking(false)
    }

    if (!loading) checkEverything()
  }, [user, loading])

  if (loading || checking)   return null
  if (!validSession)         return <Navigate to="/login" replace />
  if (!profileCompleted)     return <Navigate to="/profile-setup" replace />

  return children
}

export default ProtectedRoute