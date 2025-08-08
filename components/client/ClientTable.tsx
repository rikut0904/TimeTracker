"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Trash2, Edit, MoreVertical } from "lucide-react"
import type { Client } from "@/lib/firestore"

interface ClientTableProps {
    clients: Client[]
    isMobile: boolean
    onEdit: (client: Client) => void
    onDelete: (clientId: string) => void
}

export const ClientTable = ({ clients, isMobile, onEdit, onDelete }: ClientTableProps) => {
    if (clients.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                クライエントが登録されていません
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>名前</TableHead>
                    {!isMobile && <TableHead>グループ</TableHead>}
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {clients.map((client) => (
                    <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        {!isMobile && <TableCell>{client.group || "-"}</TableCell>}
                        <TableCell>
                            <div className="flex items-center space-x-2 justify-end">
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
                                                                    onClick={() => onEdit(client)}
                                                                >
                                                                    編集
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => onDelete(client.id!)}
                                                                >
                                                                    削除
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline">
                                                            閉じる
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                        <DropdownMenuItem onClick={() => onEdit(client)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            編集
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onDelete(client.id!)}
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
    )
} 