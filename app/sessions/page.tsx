"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Clock, User, Users, Search, Plus, Trash2, CheckCircle, Edit, MoreVertical, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { updateSession, deleteSession as deleteSessionFromDB, subscribeToUserSessions, subscribeToUserClients } from "@/lib/firestore"
import type { Session, Client } from "@/lib/firestore"
import { getAuth, signOut } from "firebase/auth"

export default function Sessions() {
    const { user, userProfile, logout } = useAuth()
    const [sessions, setSessions] = useState<Session[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState<"all" | "individual" | "group">("all")
    const [filterStatus, setFilterStatus] = useState<"all" | "planned" | "completed">("all")

    const auth = getAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("ログアウト失敗:", error);
        }
    };

    // 編集用の状態
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingSession, setEditingSession] = useState<Session | null>(null)
    const [editSession, setEditSession] = useState({
        type: "individual" as "individual" | "group",
        clientId: "",
        duration: 0,
        customDuration: "",
        date: "",
        status: "completed" as "planned" | "completed",
    })

    useEffect(() => {
        if (!user) return

        const unsubscribeSessions = subscribeToUserSessions(user.uid, (sessions) => {
            setSessions(sessions)
        })

        const unsubscribeClients = subscribeToUserClients(user.uid, (clients) => {
            setClients(clients)
        })

        return () => {
            unsubscribeSessions.then(u => u()).catch(err => console.error(err))
            unsubscribeClients.then(u => u()).catch(err => console.error(err))
        }
    }, [user])

    const filteredSessions = sessions
        .filter((session) => {
            const matchesSearch = session.clientName.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesType = filterType === "all" || session.type === filterType
            const matchesStatus = filterStatus === "all" || session.status === filterStatus
            return matchesSearch && matchesType && matchesStatus
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const deleteSession = async (sessionId: string) => {
        if (confirm("このセッションを削除しますか？")) {
            try {
                await deleteSessionFromDB(sessionId)
            } catch (error) {
                console.error("セッションの削除に失敗しました:", error)
                alert("セッションの削除に失敗しました。")
            }
        }
    }

    const markAsCompleted = async (sessionId: string) => {
        try {
            await updateSession(sessionId, { status: "completed", date: new Date() })
            alert("セッションを完了にしました！")
        } catch (error) {
            console.error("セッションの完了に失敗しました:", error)
            alert("セッションの完了に失敗しました。")
        }
    }

    const openEditDialog = (session: Session) => {
        setEditingSession(session)
        setEditSession({
            type: session.type,
            clientId: session.clientId,
            duration: session.duration,
            customDuration: "",
            date: new Date(session.date).toISOString().split("T")[0],
            status: session.status,
        })
        setIsEditDialogOpen(true)
    }

    const handleEditSession = async () => {
        if (!editSession.clientId || (!editSession.duration && !editSession.customDuration)) {
            alert("クライアントと時間を選択してください")
            return
        }

        if (!editingSession) return

        const finalDuration = editSession.duration || Number.parseInt(editSession.customDuration)
        if (!finalDuration || finalDuration <= 0) {
            alert("有効な時間を入力してください")
            return
        }

        const client = clients.find((c) => c.id === editSession.clientId)
        if (!client) {
            alert("クライアントが見つかりません")
            return
        }

        // 日付の処理
        let sessionDate: Date
        if (editSession.status === "planned") {
            sessionDate = new Date(editSession.date)
        } else {
            // 完了の場合、時間部分を保持するか現在時刻を使用
            const originalDate = new Date(editingSession.date)
            const newDate = new Date(editSession.date)
            newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds())
            sessionDate = newDate
        }

        try {
            await updateSession(editingSession.id!, {
                type: editSession.type,
                clientId: editSession.clientId,
                clientName: client.name,
                duration: finalDuration,
                date: sessionDate,
                status: editSession.status,
            })

            setEditingSession(null)
            setEditSession({
                type: "individual",
                clientId: "",
                duration: 0,
                customDuration: "",
                date: "",
                status: "completed",
            })
            setIsEditDialogOpen(false)
            alert("セッション情報を更新しました")
        } catch (error) {
            console.error("セッションの更新に失敗しました:", error)
            alert("セッションの更新に失敗しました。")
        }
    }

    const durationOptions = [30, 60, 90, 120]

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

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>セッション履歴</CardTitle>
                                    <CardDescription>記録されたセッションと予定の一覧です</CardDescription>
                                </div>
                                <div className="flex space-x-2">
                                    <Link href="/log-session?mode=planned">
                                        <Button variant="outline">
                                            <Plus className="mr-2 h-4 w-4" />
                                            予定登録
                                        </Button>
                                    </Link>
                                    <Link href="/log-session">
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            セッション記録
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <div className="flex items-center space-x-2 flex-1">
                                    <Search className="h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="クライアント名で検索..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select
                                    value={filterType}
                                    onValueChange={(value: "all" | "individual" | "group") => setFilterType(value)}
                                >
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="セッションタイプ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">すべて</SelectItem>
                                        <SelectItem value="individual">個人セッション</SelectItem>
                                        <SelectItem value="group">グループセッション</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={filterStatus}
                                    onValueChange={(value: "all" | "planned" | "completed") => setFilterStatus(value)}
                                >
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="ステータス" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">すべて</SelectItem>
                                        <SelectItem value="completed">完了</SelectItem>
                                        <SelectItem value="planned">予定</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Sessions List */}
                            <div className="space-y-4">
                                {filteredSessions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {searchTerm || filterType !== "all" || filterStatus !== "all"
                                            ? "条件に一致するセッションが見つかりません"
                                            : "まだセッションが記録されていません"}
                                    </div>
                                ) : (
                                    filteredSessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className={`flex items-center justify-between p-4 border rounded-lg shadow-sm ${session.status === "planned" ? "bg-blue-50 border-blue-200" : "bg-white"
                                                }`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0">
                                                    {session.type === "individual" ? (
                                                        <div className="p-2 bg-blue-100 rounded-full">
                                                            <User className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                    ) : (
                                                        <div className="p-2 bg-green-100 rounded-full">
                                                            <Users className="h-5 w-5 text-green-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h3 className="font-medium text-gray-900">{session.clientName}</h3>
                                                        <Badge variant={session.type === "individual" ? "default" : "secondary"}>
                                                            {session.type === "individual" ? "個人" : "グループ"}
                                                        </Badge>
                                                        <Badge
                                                            variant={session.status === "completed" ? "default" : "outline"}
                                                            className={session.status === "planned" ? "text-blue-600 border-blue-600" : ""}
                                                        >
                                                            {session.status === "completed" ? "完了" : "予定"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                        <span>{session.duration}分</span>
                                                        <span>
                                                            {new Date(session.date).toLocaleDateString("ja-JP", {
                                                                year: "numeric",
                                                                month: "short",
                                                                day: "numeric",
                                                                hour: session.status === "completed" ? "2-digit" : undefined,
                                                                minute: session.status === "completed" ? "2-digit" : undefined,
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {session.status === "planned" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => session.id && markAsCompleted(session.id)}
                                                        className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        完了
                                                    </Button>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditDialog(session)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            編集
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => session.id && deleteSession(session.id)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            削除
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>セッション情報を編集</DialogTitle>
                            <DialogDescription>セッションの詳細を変更してください</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                            {/* Session Status */}
                            <div className="space-y-2">
                                <Label>ステータス</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant={editSession.status === "completed" ? "default" : "outline"}
                                        onClick={() => setEditSession({ ...editSession, status: "completed" })}
                                        className="w-full"
                                    >
                                        完了
                                    </Button>
                                    <Button
                                        variant={editSession.status === "planned" ? "default" : "outline"}
                                        onClick={() => setEditSession({ ...editSession, status: "planned" })}
                                        className="w-full"
                                    >
                                        予定
                                    </Button>
                                </div>
                            </div>

                            {/* Session Type */}
                            <div className="space-y-2">
                                <Label>セッションタイプ</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant={editSession.type === "individual" ? "default" : "outline"}
                                        onClick={() => setEditSession({ ...editSession, type: "individual" })}
                                        className="w-full"
                                    >
                                        個人セッション
                                    </Button>
                                    <Button
                                        variant={editSession.type === "group" ? "default" : "outline"}
                                        onClick={() => setEditSession({ ...editSession, type: "group" })}
                                        className="w-full"
                                    >
                                        グループセッション
                                    </Button>
                                </div>
                            </div>

                            {/* Client Selection */}
                            <div className="space-y-2">
                                <Label>クライアント</Label>
                                <Select
                                    value={editSession.clientId}
                                    onValueChange={(value) => setEditSession({ ...editSession, clientId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="クライアントを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients
                                            .filter((client) => client.status === "active")
                                            .map((client) => (
                                                <SelectItem key={client.id || ""} value={client.id || ""}>
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
                                            variant={editSession.duration === minutes ? "default" : "outline"}
                                            onClick={() => {
                                                setEditSession({ ...editSession, duration: minutes, customDuration: "" })
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
                                        value={editSession.customDuration}
                                        onChange={(e) => {
                                            setEditSession({ ...editSession, customDuration: e.target.value, duration: 0 })
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <Label>日付</Label>
                                <Input
                                    type="date"
                                    value={editSession.date}
                                    onChange={(e) => setEditSession({ ...editSession, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                キャンセル
                            </Button>
                            <Button onClick={handleEditSession}>更新</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    )
}
