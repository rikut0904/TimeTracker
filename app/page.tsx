"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Plus, Clock, Users, User, Badge, LogOut } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import type { Session } from "@/lib/firestore"

export default function Dashboard() {
    const { user, userProfile, logout } = useAuth()
    const [sessions, setSessions] = useState<Session[]>([])

    useEffect(() => {
        if (!user) return

        let unsubscribe: (() => void) | undefined

        const setupSubscription = async () => {
            try {
                const { subscribeToUserSessions } = await import("@/lib/firestore")
                unsubscribe = await subscribeToUserSessions(user.uid, (sessions) => {
                    setSessions(sessions)
                })
            } catch (error) {
                console.error("Error setting up sessions subscription:", error)
            }
        }

        setupSubscription()

        return () => {
            if (unsubscribe) {
                unsubscribe()
            }
        }
    }, [user])

    // 完了したセッションのみで時間を計算
    const individualHours =
        sessions
            .filter((s) => s.type === "individual" && s.status === "completed")
            .reduce((total, s) => total + s.duration, 0) / 60

    const groupHours =
        sessions.filter((s) => s.type === "group" && s.status === "completed").reduce((total, s) => total + s.duration, 0) /
        60

    // 予定セッションの計算
    const plannedIndividualHours =
        sessions
            .filter((s) => s.type === "individual" && s.status === "planned")
            .reduce((total, s) => total + s.duration, 0) / 60

    const plannedGroupHours =
        sessions.filter((s) => s.type === "group" && s.status === "planned").reduce((total, s) => total + s.duration, 0) /
        60

    const individualGoal = userProfile?.individualGoal || 90
    const groupGoal = userProfile?.groupGoal || 45

    const individualProgress = (individualHours / individualGoal) * 100
    const groupProgress = (groupHours / groupGoal) * 100
    const totalProgress = ((individualHours + groupHours) / (individualGoal + groupGoal)) * 100

    const recentSessions = sessions.slice(0, 5)

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error("ログアウトエラー:", error)
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <Clock className="h-8 w-8 text-blue-600" />
                                <h1 className="ml-2 text-xl font-semibold text-gray-900">TimeTracker</h1>
                            </div>
                            <div className="flex items-center">
                                <nav className="flex space-x-4">
                                    <Link href="/" className="text-blue-600 font-medium">
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

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Progress Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">個人セッション</CardTitle>
                                <User className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {individualHours.toFixed(1)}[h] / {individualGoal}[h]
                                </div>
                                <Progress value={individualProgress} className="mt-2" />
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>残り {Math.max(0, individualGoal - individualHours).toFixed(1)}[h]</span>
                                    <span>予定: {plannedIndividualHours.toFixed(1)}[h]</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">グループセッション</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {groupHours.toFixed(1)}[h] / {groupGoal}[h]
                                </div>
                                <Progress value={groupProgress} className="mt-2" />
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>残り {Math.max(0, groupGoal - groupHours).toFixed(1)}[h]</span>
                                    <span>予定: {plannedGroupHours.toFixed(1)}[h]</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">総合進捗</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {(individualHours + groupHours).toFixed(1)}[h] / {individualGoal + groupGoal}[h]
                                </div>
                                <Progress value={totalProgress} className="mt-2" />
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>{totalProgress >= 100 ? "目標達成！" : `${(totalProgress).toFixed(1)}% 完了`}</span>
                                    <span>予定: {(plannedIndividualHours + plannedGroupHours).toFixed(1)}[h]</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle>クイックアクション</CardTitle>
                                <CardDescription>よく使う操作をすぐに実行できます</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-grow gap-4">
                                <Link href="/log-session" className="flex-grow">
                                    <Button className="w-full h-full md:text-lg" size="lg">
                                        <Plus className="mr-2 h-5 w-5" />
                                        新しいセッションを記録
                                    </Button>
                                </Link>
                                <Link href="/log-session?mode=planned" className="flex-grow">
                                    <Button variant="outline" className="w-full h-full md:text-lg" size="lg">
                                        <Plus className="mr-2 h-5 w-5" />
                                        予定セッションを登録
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>最近のセッション</CardTitle>
                                <CardDescription>直近5件のセッション記録</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {recentSessions.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">まだセッションが記録されていません</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recentSessions.map((session) => (
                                            <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center space-x-2">
                                                    {session.type === "individual" ? (
                                                        <User className="h-4 w-4 text-blue-600" />
                                                    ) : (
                                                        <Users className="h-4 w-4 text-green-600" />
                                                    )}
                                                    <span className="text-sm font-medium">{session.clientName}</span>
                                                    {session.status === "planned" && (
                                                        <Badge className="text-xs bg-blue-500 text-white">
                                                            予定
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{session.duration}分</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {session.date.toLocaleDateString("ja-JP")}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
