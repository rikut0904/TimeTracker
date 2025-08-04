"use client"

import Link from "next/link"
import { Clock, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export default function AppHeader() {
  const { user, userProfile, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("ログアウトエラー:", error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-xl font-semibold text-gray-900">TimeTracker</h1>
          </div>
          <div className="flex items-center">
            <nav className="flex space-x-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
              <Link href="/sessions" className="text-gray-500 hover:text-gray-700">
                セッション
              </Link>
              <Link href="/reports" className="text-gray-500 hover:text-gray-700">
                レポート
              </Link>
              <Link href="/settings" className="text-gray-500 hover:text-gray-700">
                設定
              </Link>
            </nav>
            <div className="flex items-center space-x-2 ml-6">
              <span className="text-sm text-gray-600">{userProfile?.name || user?.displayName || user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
