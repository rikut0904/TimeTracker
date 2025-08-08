import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

interface UserProfile {
    name: string
    email: string
    phone: string
    institution: string
    studentId: string
    individualGoal: number
    groupGoal: number
}

const DEFAULT_PROFILE: UserProfile = {
    name: "",
    email: "",
    phone: "",
    institution: "",
    studentId: "",
    individualGoal: 90,
    groupGoal: 45,
}

export const useProfileManagement = () => {
    const { userProfile, updateUserProfile } = useAuth()
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)

    useEffect(() => {
        if (userProfile) {
            setProfile(userProfile)
        }
    }, [userProfile])

    const handleSaveProfile = async () => {
        try {
            await updateUserProfile(profile)
            alert("プロフィールを保存しました！")
        } catch (error) {
            console.error("プロフィール保存エラー:", error)
            alert("プロフィールの保存に失敗しました。")
        }
    }

    return {
        profile,
        setProfile,
        handleSaveProfile,
    }
} 