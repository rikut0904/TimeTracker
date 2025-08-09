"use client"

import Link from "next/link"
import { Clock, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

export default function AppHeader() {
  const { user, userProfile, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("ログアウトエラー:", error)
    }
  }

  const navLinks = [
    { href: "/", label: "ダッシュボード" },
    { href: "/sessions", label: "セッション" },
    { href: "/calendar", label: "カレンダー" },
    { href: "/reports", label: "レポート" },
    { href: "/settings", label: "設定" },
  ]

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-xl font-semibold text-gray-900">TimeTracker</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-gray-500 hover:text-gray-700">
                {link.label}
              </Link>
            ))}
            <div className="flex items-center space-x-2 ml-6">
              <span className="text-sm text-gray-600">{userProfile?.name || user?.displayName || user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </nav>

          {/* Mobile Hamburger Icon */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (Overlay) */}
      <div
        className={`fixed inset-0 bg-white z-50 transform ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8 border-b">
          <h2 className="text-xl font-semibold">メニュー</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <nav className="flex flex-col p-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-lg font-medium text-gray-700 hover:text-blue-600"
              onClick={() => setIsMobileMenuOpen(false)} // Close menu on link click
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-600">{userProfile?.name || user?.displayName || user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
