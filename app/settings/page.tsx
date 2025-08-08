"use client"

import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import { User, Settings, Users } from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoute"
import AppHeader from "@/components/AppHeader"
import { useUserClients } from "@/hooks/useUserClients"
import { useClientManagement } from "@/hooks/useClientManagement"
import { useProfileManagement } from "@/hooks/useProfileManagement"
import { useResponsive } from "@/hooks/useResponsive"
import { ClientTable } from "@/components/client/ClientTable"
import { AddClientDialog } from "@/components/client/AddClientDialog"
import { EditClientDialog } from "@/components/client/EditClientDialog"
import { ProfileTab } from "@/components/profile/ProfileTab"
import { GoalsTab } from "@/components/profile/GoalsTab"
import type { Client } from "@/lib/firestore"

export default function SettingsPage() {
    const clients = useUserClients()
    const { isMobile } = useResponsive()
    const {
        searchTerm,
        setSearchTerm,
        isAddDialogOpen,
        setIsAddDialogOpen,
        newClient,
        setNewClient,
        isEditDialogOpen,
        setIsEditDialogOpen,
        editClient,
        setEditClient,
        handleAddClient,
        handleEditClient,
        openEditDialog,
        deleteClient,
    } = useClientManagement()

    const { profile, setProfile, handleSaveProfile } = useProfileManagement()

    // クライエント管理機能
    const filteredClients = clients.filter(
        (client) =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.group && client.group.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    const handleDeleteClient = (clientId: string) => {
        deleteClient(clientId, clients)
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
                        <ProfileTab
                            profile={profile}
                            setProfile={setProfile}
                            onSave={handleSaveProfile}
                        />

                        {/* 目標設定タブ */}
                        <GoalsTab
                            profile={profile}
                            setProfile={setProfile}
                            onSave={handleSaveProfile}
                        />

                        {/* クライエント管理タブ */}
                        <TabsContent value="clients">
                            <Card>
                                <CardHeader>
                                    <div className="flex md:flex-row flex-col justify-between items-center gap-3">
                                        <div className="flex flex-col gap-2">
                                            <CardTitle>クライエント管理</CardTitle>
                                            <CardDescription>セッションを行うクライエントを管理します</CardDescription>
                                        </div>
                                        <AddClientDialog
                                            isOpen={isAddDialogOpen}
                                            onOpenChange={setIsAddDialogOpen}
                                            newClient={newClient}
                                            setNewClient={setNewClient}
                                            onAdd={handleAddClient}
                                            clients={clients}
                                        />
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
                                    <ClientTable
                                        clients={filteredClients}
                                        isMobile={isMobile}
                                        onEdit={openEditDialog}
                                        onDelete={handleDeleteClient}
                                    />

                                    {filteredClients.length === 0 && searchTerm && (
                                        <div className="text-center py-8 text-gray-500">
                                            検索結果が見つかりません
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Edit Client Dialog */}
                <EditClientDialog
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    editClient={editClient}
                    setEditClient={setEditClient}
                    onEdit={handleEditClient}
                    clients={clients}
                />
            </div>
        </ProtectedRoute>
    )
}