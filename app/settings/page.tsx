"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Search, Trash2, Edit, MoreVertical, User, Settings, Users } from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoute"
import {
    addClient,
    updateClient,
    deleteClient as deleteClientFromDB,
    updateSession,
    getUserSessions,
    deleteSession,
    deleteField,
} from "@/lib/firestore"
import type { Client } from "@/lib/firestore"
import { useAuth } from "@/contexts/AuthContext"
import AppHeader from "@/components/AppHeader"
import { useUserClients } from "@/hooks/useUserClients"

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
    const { user, userProfile, updateUserProfile } = useAuth()
    const clients = useUserClients()
    const [profile, setProfile] = useState<UserProfile>({
        name: "",
        email: "",
        phone: "",
        institution: "",
        studentId: "",
        individualGoal: 90,
        groupGoal: 45,
    })

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768); // Tailwind's 'md' breakpoint is 768px
        };

        handleResize(); // Set initial value
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // クライエント管理用の状態
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newClient, setNewClient] = useState({
        name: "",
        group: "",
    })

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [editClient, setEditClient] = useState({
        name: "",
        group: "",
    })

    useEffect(() => {
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

    // クライエント管理機能
    const filteredClients = clients.filter(
        (client) =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.group && client.group.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    const handleAddClient = async () => {
        if (!newClient.name.trim() || !user) {
            alert("クライエント名を入力してください")
            return
        }

        const clientData: Omit<Client, "id"> = {
            name: newClient.name.trim(),
            group: newClient.group.trim(),
        }

        try {
            await addClient(user.uid, clientData)
            setNewClient({ name: "", group: "" })
            setIsAddDialogOpen(false)
            alert("クライエントを追加しました")
        } catch (error) {
            console.error("クライエントの追加に失敗しました:", error)
            alert("クライエントの追加に失敗しました。")
        }
    }

    const handleEditClient = async () => {
        if (!editClient.name.trim() || !editingClient || !user) {
            alert("クライエント名を入力してください")
            return
        }

        const updates: { [key: string]: any } = {
            name: editClient.name.trim(),
        }

        if (editClient.group.trim()) {
            updates.group = editClient.group.trim()
        } else {
            updates.group = deleteField()
        }

        try {
            await updateClient(user.uid, editingClient.id!, updates)

            // 関連セッションのクライエント名も更新
            const sessions = await getUserSessions(user.uid)
            const relatedSessions = sessions.filter((session) => session.clientId === editingClient.id)
            for (const session of relatedSessions) {
                await updateSession(user.uid, session.id!, { clientName: editClient.name.trim() })
            }

            setEditingClient(null)
            setEditClient({ name: "", group: "" })
            setIsEditDialogOpen(false)
            alert("クライエント情報を更新しました")
        } catch (error) {
            console.error("クライエント情報の更新に失敗しました:", error)
            alert("クライエント情報の更新に失敗しました。")
        }
    }

    const openEditDialog = (client: Client) => {
        setEditingClient(client)
        setEditClient({
            name: client.name,
            group: client.group || "",
        })
        setIsEditDialogOpen(true)
    }



    const deleteClient = async (clientId: string) => {
        if (!user) return
        const clientToDelete = clients.find((c) => c.id === clientId)
        if (!clientToDelete) return

        const sessions = await getUserSessions(user.uid)
        const relatedSessions = sessions.filter((session) => session.clientId === clientId)

        let confirmMessage = `「${clientToDelete.name}」を削除しますか？`
        if (relatedSessions.length > 0) {
            confirmMessage += `\n\n注意: このクライエントには${relatedSessions.length}件のセッション記録があります。クライエントを削除すると、これらのセッション記録もすべて削除されます。`
        }

        if (confirm(confirmMessage)) {
            try {
                // 関連セッションを削除
                for (const session of relatedSessions) {
                    await deleteSession(user.uid, session.id!)
                }
                // クライエントを削除
                await deleteClientFromDB(user.uid, clientId)
                alert(`「${clientToDelete.name}」とその関連セッションを削除しました。`)
            } catch (error) {
                console.error("クライエントまたはセッションの削除に失敗しました:", error)
                alert("削除に失敗しました。")
            }
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <AppHeader />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">設定</h2>
                        <p className="text-gray-600">アカウント情報とアプリケーションの設定を管理します</p>
                    </div>

                    <Tabs defaultValue="profile">
                        <TabsList className="grid w-full md:grid-cols-3 grid-cols-[1fr_1fr_1.4fr]">
                            <TabsTrigger value="profile" className="flex items-center justify-center text-center">
                                <User className="h-4 w-4 md:size-5 hidden md:block" />
                                <span className="md:text-sm text-xs">個人情報</span>
                            </TabsTrigger>
                            <TabsTrigger value="goals" className="flex items-center justify-center text-center">
                                <Settings className="h-4 w-4 md:size-5 hidden md:block" />
                                <span className="md:text-sm text-xs">目標設定</span>
                            </TabsTrigger>
                            <TabsTrigger value="clients" className="flex items-center justify-center text-center">
                                <Users className="h-4 w-4 md:size-5 hidden md:block" />
                                <span className="md:text-sm text-xs">クライエント管理</span>
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

                        {/* クライエント管理タブ */}
                        <TabsContent value="clients">
                            <Card>
                                <CardHeader>
                                    <div className="flex md:flex-row flex-col justify-between items-center gap-3">
                                        <div className="flex flex-col gap-2">
                                            <CardTitle>クライエント管理</CardTitle>
                                            <CardDescription>セッションを行うクライエントを管理します</CardDescription>
                                        </div>
                                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    クライエント追加
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>新しいクライエントを追加</DialogTitle>
                                                    <DialogDescription>クライエントの基本情報を入力してください</DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="name">名前 *</Label>
                                                        <Input
                                                            id="name"
                                                            value={newClient.name}
                                                            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                                            placeholder="クライエント名"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="group">グループ</Label>
                                                        <Select value={newClient.group} onValueChange={(value) => setNewClient({ ...newClient, group: value === "__none__" ? "" : value })}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="グループを選択または新規作成" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="__none__">グループなし</SelectItem>
                                                                {Array.from(new Set(clients.map(client => client.group).filter(Boolean))).map((group) => (
                                                                    <SelectItem key={group} value={group!}>
                                                                        {group}
                                                                    </SelectItem>
                                                                ))}
                                                                <SelectItem value="__new__">+ 新しいグループを作成</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        {newClient.group === "__new__" && (
                                                            <Input
                                                                placeholder="新しいグループ名を入力"
                                                                value={newClient.group === "__new__" ? "" : newClient.group}
                                                                onChange={(e) => setNewClient({ ...newClient, group: e.target.value })}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                                        キャンセル
                                                    </Button>
                                                    <Button onClick={handleAddClient}>
                                                        追加
                                                    </Button>
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
                                            placeholder="クライエントを検索..."
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
                                                {!isMobile && <TableHead>グループ</TableHead>}
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredClients.map((client) => (
                                                <TableRow key={client.id}>
                                                    <TableCell className="font-medium">{client.name}</TableCell>
                                                    {!isMobile && <TableCell>{client.group || "-"}</TableCell>}
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2 justify-end"> {/* 右寄せ */}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    {isMobile && (
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                                    <MoreVertical className="mr-2 h-4 w-4" />
                                                                                    詳細
                                                                                </DropdownMenuItem>
                                                                            </DialogTrigger>
                                                                            <DialogContent>
                                                                                <DialogHeader>
                                                                                    <DialogTitle>{client.name} の詳細</DialogTitle>
                                                                                    <DialogDescription>クライエントの追加情報</DialogDescription>
                                                                                </DialogHeader>
                                                                                <div className="space-y-4">
                                                                                    <div className="space-y-2">
                                                                                        <Label>グループ</Label>
                                                                                        <p className="text-sm text-gray-700">{client.group || "-"}</p>
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <Label>アクション</Label>
                                                                                        <div className="flex flex-col space-y-2">
                                                                                            <Button
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                onClick={() => openEditDialog(client)}
                                                                                            >
                                                                                                編集
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="destructive"
                                                                                                size="sm"
                                                                                                onClick={() => deleteClient(client.id!)}
                                                                                            >
                                                                                                削除
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <DialogFooter>
                                                                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                                                                        閉じる
                                                                                    </Button>
                                                                                </DialogFooter>
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    )}
                                                                    <DropdownMenuItem onClick={() => openEditDialog(client)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        編集
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => deleteClient(client.id!)}
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
                                            {searchTerm ? "検索結果が見つかりません" : "クライエントが登録されていません"}
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
                            <DialogTitle>クライエント情報を編集</DialogTitle>
                            <DialogDescription>クライエントの情報を変更してください</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">名前 *</Label>
                                <Input
                                    id="edit-name"
                                    value={editClient.name}
                                    onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                                    placeholder="クライエント名"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-group">グループ</Label>
                                <Select value={editClient.group || "__none__"} onValueChange={(value) => setEditClient({ ...editClient, group: value === "__none__" ? "" : value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="グループを選択または新規作成" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">グループなし</SelectItem>
                                        {Array.from(new Set(clients.map(client => client.group).filter(Boolean))).map((group) => (
                                            <SelectItem key={group} value={group!}>
                                                {group}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="__new__">+ 新しいグループを作成</SelectItem>
                                    </SelectContent>
                                </Select>
                                {editClient.group === "__new__" && (
                                    <Input
                                        placeholder="新しいグループ名を入力"
                                        value={editClient.group === "__new__" ? "" : editClient.group}
                                        onChange={(e) => setEditClient({ ...editClient, group: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                キャンセル
                            </Button>
                            <Button onClick={handleEditClient}>
                                更新
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    )
}