"use client"

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
} from "@/components/ui/dialog"
import type { Client } from "@/lib/firestore"
import { GROUP_VALUES } from "@/lib/constants"

interface EditClientDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    editClient: {
        name: string
        group: string
    }
    setEditClient: (client: { name: string; group: string }) => void
    onEdit: () => void
    clients: Client[]
}

export const EditClientDialog = ({
    isOpen,
    onOpenChange,
    editClient,
    setEditClient,
    onEdit,
    clients,
}: EditClientDialogProps) => {
    const existingGroups = Array.from(new Set(clients.map(client => client.group).filter(Boolean)))

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                        <Select
                            value={editClient.group || GROUP_VALUES.NONE}
                            onValueChange={(value) => setEditClient({
                                ...editClient,
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
                        {editClient.group === GROUP_VALUES.NEW && (
                            <Input
                                placeholder="新しいグループ名を入力"
                                value={editClient.group === GROUP_VALUES.NEW ? "" : editClient.group}
                                onChange={(e) => setEditClient({ ...editClient, group: e.target.value })}
                            />
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        キャンセル
                    </Button>
                    <Button onClick={onEdit}>
                        更新
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 