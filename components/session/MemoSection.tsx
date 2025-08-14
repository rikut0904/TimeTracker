"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { updateSession } from "@/lib/firestore"

export interface MemoSectionProps {
  sessionId: string
  userId?: string | null
  memo?: string
  className?: string
  forceEdit?: boolean
  hideMenu?: boolean
  hidePreview?: boolean
  onClose?: () => void
  onRequestEdit?: () => void
  // Allow forward-compat optional props without TS errors in consumers
  [key: string]: any
}

/**
 * Inline memo viewer + editor with a three-dot menu to toggle editing.
 * - Shows existing memo (if any) at all times.
 * - Edit flow: open menu -> edit -> save/cancel.
 */
export default function MemoSection({ sessionId, userId, memo, className, forceEdit = false, hideMenu = false, hidePreview = false, onClose, onRequestEdit }: MemoSectionProps) {
  const [isEditing, setIsEditing] = useState<boolean>(forceEdit)
  const [draft, setDraft] = useState<string>(memo ?? "")
  const hasMemo = (memo ?? "").trim() !== ""

  const handleSave = async () => {
    if (!userId) return
    try {
      await updateSession(userId, sessionId, { memo: draft.trim() })
      setIsEditing(false)
      onClose?.()
      alert("備考を保存しました")
    } catch (e) {
      console.error("Failed to update memo", e)
      alert("備考の保存に失敗しました")
    }
  }

  return (
    <div className={className}>
      {!hidePreview && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 cursor-pointer" onClick={() => (onRequestEdit ? onRequestEdit() : setIsEditing(true))}>
            {hasMemo ? (
              <span>備考: {memo}</span>
            ) : (
              <span className="opacity-60">備考なし</span>
            )}
          </div>
          {!hideMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="備考メニュー">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setDraft(memo ?? "")
                    setIsEditing((v) => !v)
                  }}
                >
                  {isEditing ? "備考編集を閉じる" : "備考を編集"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
      {(forceEdit || isEditing) && (
        <div className="mt-2">
          <Textarea
            placeholder="備考を入力"
            className="min-h-[64px] text-xs"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex justify-end mt-1 gap-2">
            <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); onClose?.() }}>
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!userId}>
              保存
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
