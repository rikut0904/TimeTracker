import { useState } from "react"
import { addClient, updateClient, deleteClient as deleteClientFromDB, updateSession, getUserSessions, deleteSession, deleteField } from "@/lib/firestore"
import type { Client } from "@/lib/firestore"
import { useAuth } from "@/contexts/AuthContext"

interface ClientFormData {
    name: string
    group: string
}

export const useClientManagement = () => {
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newClient, setNewClient] = useState<ClientFormData>({
        name: "",
        group: "",
    })

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [editClient, setEditClient] = useState<ClientFormData>({
        name: "",
        group: "",
    })

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

    const deleteClient = async (clientId: string, clients: Client[]) => {
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

    return {
        searchTerm,
        setSearchTerm,
        isAddDialogOpen,
        setIsAddDialogOpen,
        newClient,
        setNewClient,
        isEditDialogOpen,
        setIsEditDialogOpen,
        editingClient,
        editClient,
        setEditClient,
        handleAddClient,
        handleEditClient,
        openEditDialog,
        deleteClient,
    }
} 