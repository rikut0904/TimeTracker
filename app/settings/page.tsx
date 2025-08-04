"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Clock, Plus, Search, Trash2, Edit, MoreVertical, User, Settings, Users, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"

interface Client {
    id: string
    name: string
    email?: string
    phone?: string
    status: "active" | "inactive"
}

interface UserProfile {
    name: string
    email: string
    phone: string
    institution: string
    studentId: string
    individualGoal: number
    groupGoal: number
}

export default function SettingsPage() {
    const { user, userProfile, logout, updateUserProfile } = useAuth()
    const [clients, setClients] = useState<Client[]>([])
    const [profile, setProfile] = useState<UserProfile>({
        name: "",
        email: "",
        phone: "",
        institution: "",
        studentId: "",
        individualGoal: 90,
        groupGoal: 45,
    })

    // クライアント管理用の状態
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newClient, setNewClient] = useState({
        name: "",
        email: "",
        phone: "",
    })

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [editClient, setEditClient] = useState({
        name: "",
        email: "",
        phone: "",
    })

    useEffect(() => {
        // クライアントデータの読み込み
        const savedClients = localStorage.getItem("clients")
        if (savedClients) {
            setClients(JSON.parse(savedClients))
        }

        if (userProfile) {
            setProfile(userProfile)
        }
    }, [userProfile])

    // ユーザープロフィール保存
    const handleSaveProfile = async () => {
        try {
            await updateUserProfile(profile)
            alert("プロフィールを保存しました！")
        } catch (error) {
            console.error("プロフィール保存エラー:", error)
            alert("プロフィールの保存に失敗しました。")
        }
    }

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error("ログアウトエラー:", error)
        }
    }

    // クライアント管理機能（既存のコードを移植）
    const filteredClients = clients.filter(
        (client) =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    const handleAddClient = () => {
        if (!newClient.name.trim()) {
            alert("クライアント名を入力してください")
            return
        }

        const client: Client = {
            id: Date.now().toString(),
            name: newClient.name.trim(),
            email: newClient.email.trim() || undefined,
            phone: newClient.phone.trim() || undefined,
            status: "active",
        }

        const updatedClients = [...clients, client]
        setClients(updatedClients)
        localStorage.setItem("clients", JSON.stringify(updatedClients))

        setNewClient({ name: "", email: "", phone: "" })
        setIsAddDialogOpen(false)
    }

    const handleEditClient = () => {
        if (!editClient.name.trim()) {
            alert("クライアント名を入力してください")
            return
        }

        if (!editingClient) return

        const updatedClients = clients.map((client) =>
            client.id === editingClient.id
                ? {
                    ...client,
                    name: editClient.name.trim(),
                    email: editClient.email.trim() || undefined,
                    phone: editClient.phone.trim() || undefined,
                }
                : client,
        )
        setClients(updatedClients)
        localStorage.setItem("clients", JSON.stringify(updatedClients))

        // 関連するセッションのクライアント名も更新
        const savedSessions = localStorage.getItem("sessions")
        if (savedSessions) {
            const sessions = JSON.parse(savedSessions)
            const updatedSessions = sessions.map((session: any) =>
                session.clientId === editingClient.id ? { ...session, clientName: editClient.name.trim() } : session,
            )
            localStorage.setItem("sessions", JSON.stringify(updatedSessions))
        }

        setEditingClient(null)
        setEditClient({ name: "", email: "", phone: "" })
        setIsEditDialogOpen(false)
        alert("クライアント情報を更新しました")
    }

    const openEditDialog = (client: Client) => {
        setEditingClient(client)
        setEditClient({
            name: client.name,
            email: client.email || "",
            phone: client.phone || "",
        })
        setIsEditDialogOpen(true)
    }

    const toggleClientStatus = (clientId: string) => {
        const updatedClients = clients.map((client) =>
            client.id === clientId
                ? { ...client, status: client.status === "active" ? ("inactive" as const) : ("active" as const) }
                : client,
        )
        setClients(updatedClients)
        localStorage.setItem("clients", JSON.stringify(updatedClients))
    }

    const deleteClient = (clientId: string) => {
        const clientToDelete = clients.find((c) => c.id === clientId)
        if (!clientToDelete) return

        // そのクライアントに関連するセッションがあるかチェック
        const savedSessions = localStorage.getItem("sessions")
        const sessions = savedSessions ? JSON.parse(savedSessions) : []
        const relatedSessions = sessions.filter((session: any) => session.clientId === clientId)

        let confirmMessage = `「${clientToDelete.name}」を削除しますか？`
        if (relatedSessions.length > 0) {
            confirmMessage += `\n\n注意: このクライアントには${relatedSessions.length}件のセッション記録があります。削除すると関連するセッション記録も削除されます。`
        }

        if (confirm(confirmMessage)) {
            // クライアントを削除
            const updatedClients = clients.filter((client) => client.id !== clientId)
            setClients(updatedClients)
            localStorage.setItem("clients", JSON.stringify(updatedClients))

            // 関連するセッションも削除
            if (relatedSessions.length > 0) {
                const updatedSessions = sessions.filter((session: any) => session.clientId !== clientId)
                localStorage.setItem("sessions", JSON.stringify(updatedSessions))
            }

            alert(`「${clientToDelete.name}」を削除しました。`)
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
                                    <Link href="/sessions" className="text-gray-500 hover:text-gray-700">
                                        セッション
                                    </Link>
                                    <Link href="/reports" className="text-gray-500 hover:text-gray-700">
                                        レポート
                                    </Link>
                                    <Link href="/settings" className="text-blue-600 font-medium">
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
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">設定</h2>
                        <p className="text-gray-600">アカウント情報とアプリケーションの設定を管理します</p>
                    </div>

                    <Tabs defaultValue="profile" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="profile" className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>個人情報</span>
                            </TabsTrigger>
                            <TabsTrigger value="goals" className="flex items-center space-x-2">
                                <Settings className="h-4 w-4" />
                                <span>目標設定</span>
                            </TabsTrigger>
                            <TabsTrigger value="clients" className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>クライアント管理</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* 個人情報タブ */}
                        <TabsContent value="profile">
                            <Card>
                                <CardHeader>
                                    <CardTitle>個人情報</CardTitle>
                                    <CardDescription>あなたの基本情報を設定してください</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">氏名 *</Label>
                                            <Input
                                                id="name"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                placeholder="山田 太郎"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">メールアドレス</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                placeholder="example@email.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">電話番号</Label>
                                            <Input
                                                id="phone"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                placeholder="090-1234-5678"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="institution">所属機関</Label>
                                            <Input
                                                id="institution"
                                                value={profile.institution}
                                                onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                                                placeholder="○○大学 心理学部"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button onClick={handleSaveProfile}>プロフィールを保存</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* 目標設定タブ */}
                        <TabsContent value="goals">
                            <Card>
                                <CardHeader>
                                    <CardTitle>目標時間設定</CardTitle>
                                    <CardDescription>実習に必要な時間数を設定してください</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="individualGoal">個人セッション目標時間</Label>
                                            <div className="flex items-center space-x-2">
                                                <Input
                                                    id="individualGoal"
                                                    type="number"
                                                    value={profile.individualGoal}
                                                    onChange={(e) =>
                                                        setProfile({ ...profile, individualGoal: Number.parseInt(e.target.value) || 90 })
                                                    }
                                                    min="1"
                                                />
                                                <span className="text-sm text-muted-foreground">時間</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="groupGoal">グループセッション目標時間</Label>
                                            <div className="flex items-center space-x-2">
                                                <Input
                                                    id="groupGoal"
                                                    type="number"
                                                    value={profile.groupGoal}
                                                    onChange={(e) =>
                                                        setProfile({ ...profile, groupGoal: Number.parseInt(e.target.value) || 45 })
                                                    }
                                                    min="1"
                                                />
                                                <span className="text-sm text-muted-foreground">時間</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-medium text-blue-900 mb-2">現在の設定</h4>
                                        <div className="text-sm text-blue-800">
                                            <p>個人セッション: {profile.individualGoal}時間</p>
                                            <p>グループセッション: {profile.groupGoal}時間</p>
                                            <p>合計目標: {profile.individualGoal + profile.groupGoal}時間</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button onClick={handleSaveProfile}>設定を保存</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* クライアント管理タブ */}
                        <TabsContent value="clients">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>クライアント管理</CardTitle>
                                            <CardDescription>セッションを行うクライアントを管理します</CardDescription>
                                        </div>
                                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    クライアント追加
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>新しいクライアントを追加</DialogTitle>
                                                    <DialogDescription>クライアントの基本情報を入力してください</DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="name">名前 *</Label>
                                                        <Input
                                                            id="name"
                                                            value={newClient.name}
                                                            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                                            placeholder="クライアント名"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="email">メールアドレス</Label>
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            value={newClient.email}
                                                            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                                            placeholder="example@email.com"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="phone">電話番号</Label>
                                                        <Input
                                                            id="phone"
                                                            value={newClient.phone}
                                                            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                                            placeholder="090-1234-5678"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                                        キャンセル
                                                    </Button>
                                                    <Button onClick={handleAddClient}>追加</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Search */}
                                    <div className="flex items-center space-x-2 mb-6">
                                        <Search className="h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="クライアントを検索..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="max-w-sm"
                                        />
                                    </div>

                                    {/* Clients Table */}
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>名前</TableHead>
                                                <TableHead>メールアドレス</TableHead>
                                                <TableHead>電話番号</TableHead>
                                                <TableHead>ステータス</TableHead>
                                                <TableHead>アクション</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredClients.map((client) => (
                                                <TableRow key={client.id}>
                                                    <TableCell className="font-medium">{client.name}</TableCell>
                                                    <TableCell>{client.email || "-"}</TableCell>
                                                    <TableCell>{client.phone || "-"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={client.status === "active" ? "default" : "secondary"}>
                                                            {client.status === "active" ? "アクティブ" : "非アクティブ"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            <Button variant="outline" size="sm" onClick={() => toggleClientStatus(client.id)}>
                                                                {client.status === "active" ? "非アクティブ化" : "アクティブ化"}
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => openEditDialog(client)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        編集
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => deleteClient(client.id)}
                                                                        className="text-red-600 focus:text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        削除
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {filteredClients.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            {searchTerm ? "検索結果が見つかりません" : "クライアントが登録されていません"}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Edit Client Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>クライアント情報を編集</DialogTitle>
                            <DialogDescription>クライアントの情報を変更してください</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">名前 *</Label>
                                <Input
                                    id="edit-name"
                                    value={editClient.name}
                                    onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                                    placeholder="クライアント名"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">メールアドレス</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editClient.email}
                                    onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                                    placeholder="example@email.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone">電話番号</Label>
                                <Input
                                    id="edit-phone"
                                    value={editClient.phone}
                                    onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                                    placeholder="090-1234-5678"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                キャンセル
                            </Button>
                            <Button onClick={handleEditClient}>更新</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    )
}
