"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import type { Client } from "@/lib/firestore"
import { GROUP_VALUES } from "@/lib/constants"

interface AddClientDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    newClient: {
        name: string
        group: string
    }
    setNewClient: (client: { name: string; group: string }) => void
    onAdd: (overrideClient?: { name: string; group: string }) => void
    clients: Client[]
}

export const AddClientDialog = ({
    isOpen,
    onOpenChange,
    newClient,
    setNewClient,
    onAdd,
    clients,
}: AddClientDialogProps) => {
    const [newGroupName, setNewGroupName] = useState("")
    const existingGroups = Array.from(new Set(clients.map(client => client.group).filter(Boolean)))
    
    const handleAdd = () => {
        if (newClient.group === GROUP_VALUES.NEW && newGroupName.trim()) {
            // 新しいグループ名で直接onAddを呼び出す
            const clientWithNewGroup = { ...newClient, group: newGroupName.trim() }
            onAdd(clientWithNewGroup)
        } else {
            onAdd()
        }
        setNewGroupName("")
    }
    
    const handleCancel = () => {
        setNewGroupName("")
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                        <Select
                            value={newClient.group}
                            onValueChange={(value) => setNewClient({
                                ...newClient,
                                group: value === GROUP_VALUES.NONE ? "" : value
                            })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="グループを選択または新規作成" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={GROUP_VALUES.NONE}>グループなし</SelectItem>
                                {existingGroups.map((group) => (
                                    <SelectItem key={group} value={group!}>
                                        {group}
                                    </SelectItem>
                                ))}
                                <SelectItem value={GROUP_VALUES.NEW}>+ 新しいグループを作成</SelectItem>
                            </SelectContent>
                        </Select>
                        {newClient.group === GROUP_VALUES.NEW && (
                            <Input
                                placeholder="新しいグループ名を入力"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        キャンセル
                    </Button>
                    <Button onClick={handleAdd}>
                        追加
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 