"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

interface UserProfile {
  name: string
  email: string
  phone: string
  institution: string
  studentId: string
  individualGoal: number
  groupGoal: number
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [firebaseInitialized, setFirebaseInitialized] = useState(false)

  // Firebase初期化を確認
  useEffect(() => {
    const initializeFirebase = async () => {
      if (typeof window !== "undefined") {
        try {
          const { auth, db } = await import("@/lib/firebase")
          if (auth && db) {
            setFirebaseInitialized(true)
          }
        } catch (error) {
          console.error("Firebase initialization error:", error)
          setLoading(false)
        }
      }
    }

    initializeFirebase()
  }, [])

  useEffect(() => {
    if (!firebaseInitialized) return

    const setupAuthListener = async () => {
      try {
        const { auth, db } = await import("@/lib/firebase")

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setUser(user)

          if (user && db) {
            try {
              // ユーザープロフィールを取得
              const profileDoc = await getDoc(doc(db, "users", user.uid))
              if (profileDoc.exists()) {
                setUserProfile(profileDoc.data() as UserProfile)
              }
            } catch (error) {
              console.error("Error fetching user profile:", error)
            }
          } else {
            setUserProfile(null)
          }

          setLoading(false)
        })

        return unsubscribe
      } catch (error) {
        console.error("Error setting up auth listener:", error)
        setLoading(false)
      }
    }

    setupAuthListener()
  }, [firebaseInitialized])

  const login = async (email: string, password: string) => {
    const { auth } = await import("@/lib/firebase")
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email: string, password: string, name: string) => {
    const { auth, db } = await import("@/lib/firebase")
    const { user } = await createUserWithEmailAndPassword(auth, email, password)

    // プロフィールを更新
    await updateProfile(user, { displayName: name })

    // Firestoreにユーザープロフィールを保存
    const defaultProfile: UserProfile = {
      name,
      email,
      phone: "",
      institution: "",
      studentId: "",
      individualGoal: 90,
      groupGoal: 45,
    }

    await setDoc(doc(db, "users", user.uid), defaultProfile)
    setUserProfile(defaultProfile)
  }

  const logout = async () => {
    const { auth } = await import("@/lib/firebase")
    await signOut(auth)
  }

  const updateUserProfile = async (profileUpdates: Partial<UserProfile>) => {
    if (!user) return

    const { db } = await import("@/lib/firebase")
    const updatedProfile = { ...userProfile, ...profileUpdates } as UserProfile
    await setDoc(doc(db, "users", user.uid), updatedProfile)
    setUserProfile(updatedProfile)
  }

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
