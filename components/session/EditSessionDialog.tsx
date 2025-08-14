"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Session, Client } from "@/lib/firestore"
import { updateSession } from "@/lib/firestore"

interface EditSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  userId?: string | null
  clients: Client[]
}

export default function EditSessionDialog({ open, onOpenChange, session, userId, clients }: EditSessionDialogProps) {
  const [clientId, setClientId] = useState<string>("")
  const [duration, setDuration] = useState<string>("")
  const [memo, setMemo] = useState<string>("")

  useEffect(() => {
    if (!session) return
    setClientId(session.clientId)
    setDuration(String(session.duration ?? 0))
    setMemo(session.memo ?? "")
  }, [session])

  const clientOptions = useMemo(() => {
    return clients
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  }, [clients])

  const selectedClientName = useMemo(() => {
    const c = clients.find((c) => c.id === clientId)
    return c?.name ?? session?.clientName ?? ""
  }, [clients, clientId, session])

  const handleSave = async () => {
    if (!userId || !session?.id) return
    const parsed = Number.parseInt(duration)
    if (Number.isNaN(parsed) || parsed < 0) {
      alert("有効な時間を入力してください")
      return
    }
    try {
      await updateSession(userId, session.id, {
        clientId,
        clientName: selectedClientName,
        duration: parsed,
        memo: memo.trim() || "",
      })
      onOpenChange(false)
    } catch (e) {
      console.error("failed to update session", e)
      alert("更新に失敗しました")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>セッションを編集</DialogTitle>
          <DialogDescription>クライエント・時間・備考を更新できます。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm text-gray-700">クライエント</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="クライエントを選択" />
              </SelectTrigger>
              <SelectContent>
                {clientOptions.map((c) => (
                  <SelectItem key={c.id!} value={c.id!}>{c.name}{c.group ? ` (${c.group})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-700">実施時間（分）</label>
            <Input type="number" inputMode="numeric" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-700">備考</label>
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} className="min-h-[96px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={handleSave} disabled={!userId}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
