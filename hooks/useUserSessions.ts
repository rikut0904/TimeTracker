import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { subscribeToUserSessions, Session } from "@/lib/firestore"

export function useUserSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    if (!user) {
      setSessions([])
      return
    }

    const unsubscribe = subscribeToUserSessions(user.uid, (fetchedSessions) => {
      setSessions(fetchedSessions)
    })

    return () => unsubscribe()
  }, [user])

  return sessions
}
