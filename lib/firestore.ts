import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  deleteField,
} from "firebase/firestore"
import { db } from "./firebase"

// Firebase の deleteField をエクスポート
export { deleteField }

export interface Session {
  id?: string
  type: "individual" | "group"
  clientId: string
  clientName: string
  duration: number
  date: Date
  status: "planned" | "completed"
}

export interface Client {
  id?: string
  name: string
  email?: string
  phone?: string
  status: "active" | "inactive"
}

// セッション関連の操作
export const addSession = async (userId: string, sessionData: Omit<Session, "id">) => {
  const docRef = await addDoc(collection(db, "users", userId, "sessions"), {
    ...sessionData,
    date: Timestamp.fromDate(sessionData.date),
  })
  return docRef.id
}

export const updateSession = async (userId: string, sessionId: string, updates: Partial<Session>) => {
  const sessionRef = doc(db, "users", userId, "sessions", sessionId)
  const updateData = { ...updates }
  if (updates.date) {
    updateData.date = Timestamp.fromDate(updates.date) as any
  }
  await updateDoc(sessionRef, updateData)
}

export const deleteSession = async (userId: string, sessionId: string) => {
  await deleteDoc(doc(db, "users", userId, "sessions", sessionId))
}

export const getUserSessions = async (userId: string): Promise<Session[]> => {
  const q = query(collection(db, "users", userId, "sessions"), orderBy("date", "desc"))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
  })) as Session[]
}

export const subscribeToUserSessions = (userId: string, callback: (sessions: Session[]) => void) => {
  const q = query(collection(db, "users", userId, "sessions"), orderBy("date", "desc"))

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
export const addClient = async (userId: string, clientData: Omit<Client, "id">) => {
  const docRef = await addDoc(collection(db, "users", userId, "clients"), {
    ...clientData,
  })
  return docRef.id
}

export const updateClient = async (userId: string, clientId: string, updates: { [key: string]: any }) => {
  const clientRef = doc(db, "users", userId, "clients", clientId)
  await updateDoc(clientRef, updates)
}

export const deleteClient = async (userId: string, clientId: string) => {
  await deleteDoc(doc(db, "users", userId, "clients", clientId))
}

export const getUserClients = async (userId: string): Promise<Client[]> => {
  const q = query(collection(db, "users", userId, "clients"))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Client[]
}

export const subscribeToUserClients = (userId: string, callback: (clients: Client[]) => void) => {
  const q = query(collection(db, "users", userId, "clients"))

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const clients = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Client[]
    callback(clients)
  })

  return unsubscribe
}