"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Clock, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { addSession, subscribeToUserClients } from "@/lib/firestore"
import type { Client } from "@/lib/firestore"

export default function LogSession() {
    const { user, userProfile, logout } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    // URLパラメータから mode を取得
    const mode = (searchParams.get("mode") as "completed" | "planned") || "completed"

    // 状態に mode を追加
    const [sessionMode, setSessionMode] = useState<"completed" | "planned">(mode)

    const [clients, setClients] = useState<Client[]>([])
    const [sessionType, setSessionType] = useState<"individual" | "group">(
        (searchParams.get("type") as "individual" | "group") || "individual",
    )
    const [selectedClient, setSelectedClient] = useState("")
    const [duration, setDuration] = useState<number | null>(null)
    const [customDuration, setCustomDuration] = useState("")

    // 日付選択用の状態を更新（完了セッションでもデフォルト値を設定）
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

    useEffect(() => {
        if (!user) return

        const unsubscribe = subscribeToUserClients(user.uid, (clients) => {
            setClients(clients)
        })

        return () => {
            if (unsubscribe) {
                unsubscribe.then(u => u()).catch(err => console.error(err))
            }
        }
    }, [user])

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error("ログアウトエラー:", error)
        }
    }

    const durationOptions = [30, 60, 90, 120]

    // handleSubmit を更新
    const handleSubmit = async () => {
        if (!user) {
            alert("ログインしていません")
            return
        }

        if (!selectedClient || (!duration && !customDuration)) {
            alert("セッションタイプ、クライアント、時間を選択してください")
            return
        }

        const finalDuration = duration || Number.parseInt(customDuration)
        if (!finalDuration || finalDuration <= 0) {
            alert("有効な時間を入力してください")
            return
        }

        const client = clients.find((c) => c.id === selectedClient)
        if (!client) {
            alert("クライアントが見つかりません")
            return
        }

        // handleSubmit関数で、常に選択した日付を使用するように変更
        // 予定の場合は選択した日付、完了の場合は選択した日付 + 現在時刻を使用
        const sessionDate =
            sessionMode === "planned"
                ? new Date(selectedDate)
                : (() => {
                    const selectedDateTime = new Date(selectedDate)
                    const now = new Date()
                    selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
                    return selectedDateTime
                })()

        try {
            await addSession(user.uid, {
                type: sessionType,
                clientId: selectedClient,
                clientName: client.name,
                duration: finalDuration,
                date: sessionDate,
                status: sessionMode,
            })

            const message = sessionMode === "planned" ? "予定セッションが登録されました！" : "セッションが記録されました！"
            alert(message)
            router.push("/")
        } catch (error) {
            console.error("セッションの追加に失敗しました:", error)
            alert("セッションの追加に失敗しました。")
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
                                <Link href="/" className="text-gray-500 hover:text-gray-700">
                                    ダッシュボード
                                </Link>
                                <Link href="/sessions" className="text-blue-600 font-medium">
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

                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            ダッシュボードに戻る
                        </Link>
                    </div>

                    <Card>
                        {/* CardHeader を更新 */}
                        <CardHeader>
                            <CardTitle>{sessionMode === "planned" ? "予定セッションを登録" : "新しいセッションを記録"}</CardTitle>
                            <CardDescription>
                                {sessionMode === "planned"
                                    ? "今後予定しているセッションの詳細を入力してください"
                                    : "実習セッションの詳細を入力してください"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Session Mode選択を追加（Session Typeの前に） */}
                            <div className="space-y-2">
                                <Label>記録タイプ</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant={sessionMode === "completed" ? "default" : "outline"}
                                        onClick={() => setSessionMode("completed")}
                                        className="w-full"
                                    >
                                        完了したセッション
                                    </Button>
                                    <Button
                                        variant={sessionMode === "planned" ? "default" : "outline"}
                                        onClick={() => setSessionMode("planned")}
                                        className="w-full"
                                    >
                                        予定セッション
                                    </Button>
                                </div>
                            </div>

                            {/* Session Type */}
                            <div className="space-y-2">
                                <Label>セッションタイプ</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant={sessionType === "individual" ? "default" : "outline"}
                                        onClick={() => setSessionType("individual")}
                                        className="w-full"
                                    >
                                        個人セッション
                                    </Button>
                                    <Button
                                        variant={sessionType === "group" ? "default" : "outline"}
                                        onClick={() => setSessionType("group")}
                                        className="w-full"
                                    >
                                        グループセッション
                                    </Button>
                                </div>
                            </div>

                            {/* Client Selection */}
                            <div className="space-y-2">
                                <Label>クライアント</Label>
                                <Select value={selectedClient} onValueChange={setSelectedClient}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="クライアントを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients
                                            .filter((client) => client.status === "active")
                                            .map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Duration */}
                            <div className="space-y-2">
                                <Label>時間</Label>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {durationOptions.map((minutes) => (
                                        <Button
                                            key={minutes}
                                            variant={duration === minutes ? "default" : "outline"}
                                            onClick={() => {
                                                setDuration(minutes)
                                                setCustomDuration("")
                                            }}
                                            className="w-full"
                                        >
                                            {minutes}分
                                        </Button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <Label>カスタム時間（分）</Label>
                                    <Input
                                        type="number"
                                        placeholder="カスタム時間を入力"
                                        value={customDuration}
                                        onChange={(e) => {
                                            setCustomDuration(e.target.value)
                                            setDuration(null)
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Date Selection - 常に表示 */}
                            <div className="space-y-2">
                                <Label>日付</Label>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    max={sessionMode === "completed" ? new Date().toISOString().split("T")[0] : undefined}
                                    min={sessionMode === "planned" ? new Date().toISOString().split("T")[0] : undefined}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {sessionMode === "completed"
                                        ? "完了したセッションの実施日を選択してください"
                                        : "予定セッションの実施予定日を選択してください"}
                                </p>
                            </div>

                            {/* Submit Button のテキストを更新 */}
                            <Button onClick={handleSubmit} className="w-full" size="lg">
                                {sessionMode === "planned" ? "予定を登録" : "セッションを記録"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    )
}
