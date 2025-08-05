import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { subscribeToUserClients, Client } from "@/lib/firestore"

export function useUserClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    if (!user) {
      setClients([])
      return
    }

    const unsubscribe = subscribeToUserClients(user.uid, (fetchedClients) => {
      setClients(fetchedClients)
    })

    return () => unsubscribe()
  }, [user])

  return clients
}
