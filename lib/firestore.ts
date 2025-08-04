import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    deleteField,
  } from "firebase/firestore"
  import { db } from "./firebase"
  
  export interface Session {
    id?: string
    type: "individual" | "group"
    clientId: string
    clientName: string
    duration: number
    date: Date
    status: "planned" | "completed"
    userId: string
  }
  
  export interface Client {
    id?: string
    name: string
    email?: string
    phone?: string
    status: "active" | "inactive"
    userId: string
  }
  
  // セッション関連の操作
  export const addSession = async (userId: string, sessionData: Omit<Session, "id" | "userId">) => {
    const docRef = await addDoc(collection(db, "sessions"), {
      ...sessionData,
      userId,
      date: Timestamp.fromDate(sessionData.date),
    })
    return docRef.id
  }
  
  export const updateSession = async (sessionId: string, updates: Partial<Session>) => {
    const sessionRef = doc(db, "sessions", sessionId)
    const updateData = { ...updates }
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date) as any
    }
    await updateDoc(sessionRef, updateData)
  }
  
  export const deleteSession = async (sessionId: string) => {
    await deleteDoc(doc(db, "sessions", sessionId))
  }
  
  export const getUserSessions = async (userId: string): Promise<Session[]> => {
    const q = query(collection(db, "sessions"), where("userId", "==", userId), orderBy("date", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
    })) as Session[]
  }

  export const subscribeToUserSessions = (userId: string, callback: (sessions: Session[]) => void) => {
    const q = query(collection(db, "sessions"), where("userId", "==", userId), orderBy("date", "desc"))
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sessions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as Session[]
      callback(sessions)
    })
    
    return unsubscribe
  }
  
  // クライアント関連の操作
  export const addClient = async (userId: string, clientData: Omit<Client, "id" | "userId">) => {
    const docRef = await addDoc(collection(db, "clients"), {
      ...clientData,
      userId,
    })
    return docRef.id
  }
  
  export const updateClient = async (clientId: string, updates: { [key: string]: any }) => {
    const clientRef = doc(db, "clients", clientId)
    await updateDoc(clientRef, updates)
  }
  
  export const deleteClient = async (clientId: string) => {
    await deleteDoc(doc(db, "clients", clientId))
  }
  
  export const getUserClients = async (userId: string): Promise<Client[]> => {
    const q = query(collection(db, "clients"), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Client[]
  }
  
  export const subscribeToUserClients = (userId: string, callback: (clients: Client[]) => void) => {
    const q = query(collection(db, "clients"), where("userId", "==", userId))
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clients = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[]
      callback(clients)
    })
    
    return unsubscribe
  }
  