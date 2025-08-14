"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { User, Users, TrendingUp, MoreHorizontal } from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import AppHeader from "@/components/AppHeader"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import MemoSection from "@/components/session/MemoSection"
import { updateSession } from "@/lib/firestore"
import EditSessionDialog from "@/components/session/EditSessionDialog"
import { useUserSessions } from "@/hooks/useUserSessions"
import { useUserClients } from "@/hooks/useUserClients"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  status: "active" | "inactive"
}

export default function Reports() {
  const { userProfile, user } = useAuth() as any
  const sessions = useUserSessions()
  const clients = useUserClients()
  const [selectedInfo, setSelectedInfo] = useState<{ clientId: string; clientName: string; type: 'individual' | 'group' } | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [targetSessionForEdit, setTargetSessionForEdit] = useState<any>(null)

  const handleViewDetails = (clientId: string, clientName: string, type: 'individual' | 'group') => {
    setSelectedInfo({ clientId, clientName, type })
    setIsDetailModalOpen(true)
  }

  const handleToggleIndexed = async (sessionId: string, current: boolean | undefined) => {
    if (!user?.uid) return
    try {
      await updateSession(user.uid, sessionId, { indexed: !current })
    } catch (e) {
      console.error("failed to update indexed", e)
      alert("インデックス状態の更新に失敗しました")
    }
  }

  const handleSaveMemo = async (_sessionId: string, _currentText: string) => {}

  const clientSessions = selectedInfo
    ? sessions.filter(
      (s) =>
        s.clientId === selectedInfo.clientId &&
        s.type === selectedInfo.type &&
        s.status === "completed" &&
        s.duration > 0,
    )
    : []

  // 完了したセッションのみで時間を計算
  const individualHours =
    sessions
      .filter((s) => s.type === "individual" && s.status === "completed")
      .reduce((total, s) => total + s.duration, 0) / 60

  const groupHours =
    sessions.filter((s) => s.type === "group" && s.status === "completed").reduce((total, s) => total + s.duration, 0) /
    60

  const totalHours = individualHours + groupHours

  // 予定セッションの時間も計算
  const plannedIndividualHours =
    sessions
      .filter((s) => s.type === "individual" && s.status === "planned")
      .reduce((total, s) => total + s.duration, 0) / 60

  const plannedGroupHours =
    sessions.filter((s) => s.type === "group" && s.status === "planned").reduce((total, s) => total + s.duration, 0) /
    60

  // クライエント別の個人セッション時間
  const individualSessionsByClient = sessions
    .filter((s) => s.type === "individual" && s.status === "completed")
    .reduce(
      (acc, session) => {
        if (!acc[session.clientId]) {
          acc[session.clientId] = {
            clientName: session.clientName,
            totalHours: 0,
            sessionCount: 0,
            doneCount: 0,
            notDoneCount: 0,
          }
        }
        acc[session.clientId].totalHours += session.duration / 60
        acc[session.clientId].sessionCount += 1
        if (session.duration > 0) acc[session.clientId].doneCount += 1
        else acc[session.clientId].notDoneCount += 1
        return acc
      },
      {} as Record<string, { clientName: string; totalHours: number; sessionCount: number; doneCount: number; notDoneCount: number }>,
    )

  // グループセッション統計
  const groupSessionsByClient = sessions
    .filter((s) => s.type === "group" && s.status === "completed")
    .reduce(
      (acc, session) => {
        if (!acc[session.clientId]) {
          acc[session.clientId] = {
            clientName: session.clientName,
            totalHours: 0,
            sessionCount: 0,
            doneCount: 0,
            notDoneCount: 0,
          }
        }
        acc[session.clientId].totalHours += session.duration / 60
        acc[session.clientId].sessionCount += 1
        if (session.duration > 0) acc[session.clientId].doneCount += 1
        else acc[session.clientId].notDoneCount += 1
        return acc
      },
      {} as Record<string, { clientName: string; totalHours: number; sessionCount: number; doneCount: number; notDoneCount: number }>,
    )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AppHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">時間数サマリー</h2>
            <p className="text-gray-600">実習時間の詳細レポートです</p>
          </div>

          {/* Overall Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">個人セッション合計</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{individualHours.toFixed(1)}[h] / 90[h]</div>
                <Progress value={(individualHours / 90) * 100} className="mt-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>完了率: {((individualHours / 90) * 100).toFixed(1)}%</span>
                  <span>予定: +{plannedIndividualHours.toFixed(1)}[h]</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">グループセッション合計</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groupHours.toFixed(1)}[h] / 45[h]</div>
                <Progress value={(groupHours / 45) * 100} className="mt-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>完了率: {((groupHours / 45) * 100).toFixed(1)}%</span>
                  <span>予定: +{plannedGroupHours.toFixed(1)}[h]</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">完了/必要時間</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHours.toFixed(1)}[h] / 135[h]</div>
                <Progress value={(totalHours / 135) * 100} className="mt-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>全体進捗: {((totalHours / 135) * 100).toFixed(1)}%</span>
                  <span>予定: +{(plannedIndividualHours + plannedGroupHours).toFixed(1)}[h]</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Individual Sessions by Client */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>個人セッション</CardTitle>
              <CardDescription>クライエント別の個人セッション詳細</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(individualSessionsByClient).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">個人セッションの記録がありません</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(individualSessionsByClient)
                    .sort(([, a], [, b]) => b.totalHours - a.totalHours)
                    .slice(0, 5)
                    .map(([clientId, data]) => (
                      <div key={clientId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{data.clientName}</div>
                            <div className="text-sm text-muted-foreground">実施/休み: {data.doneCount}/{data.notDoneCount}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{data.totalHours.toFixed(1)}[h]</div>
                          <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => handleViewDetails(clientId, data.clientName, 'individual')}>
                            詳細
                          </Button>
                        </div>
                      </div>
                    ))}
                  {Object.keys(individualSessionsByClient).length > 5 && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">上位5クライエントを表示中</p>
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        すべて表示
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Group Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>グループセッション</CardTitle>
              <CardDescription>グループ別のセッション詳細</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(groupSessionsByClient).length === 0 ? (
                <p className="text-center text-muted-foreground sm:text-sm text-xs py-8">グループセッションの記録がありません</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupSessionsByClient)
                    .sort(([, a], [, b]) => b.totalHours - a.totalHours)
                    .map(([clientId, data]) => (
                      <div key={clientId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">{data.clientName}</div>
                            <div className="text-sm text-muted-foreground">実施/休み: {data.doneCount}/{data.notDoneCount}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{data.totalHours.toFixed(1)}[h]</div>
                          <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => handleViewDetails(clientId, data.clientName, 'group')}>
                            詳細
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedInfo?.clientName}さんのセッション詳細</DialogTitle>
            <DialogDescription>
              記録済みの{selectedInfo?.type === 'individual' ? '個人' : 'グループ'}セッションの一覧です。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto py-4">
            {clientSessions.length > 0 ? (
              <ul className="space-y-2">
                {clientSessions.map((session) => (
                  <li key={session.id} className="p-2 bg-gray-100 rounded">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{session.date.toLocaleDateString("ja-JP")}</span>
                        <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-xs text-gray-600">{session.duration}分</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="inline-flex items-center gap-2 text-xs sm:text-sm cursor-pointer mr-2">
                          <input
                            type="checkbox"
                            className="accent-blue-600 w-6 h-6"
                            checked={!!session.indexed}
                            onChange={() => handleToggleIndexed(session.id!, session.indexed)}
                          />
                          <span>インデックス済み</span>
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="その他の操作">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setTargetSessionForEdit(session as any); setEditDialogOpen(true) }}>セッションを編集</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {(session.memo ?? "").trim() !== "" && (
                      <div className="text-xs text-gray-500 mt-1 break-words">備考: {session.memo}</div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center">このクライエントのセッション記録はありません。</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditSessionDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} session={targetSessionForEdit} userId={user?.uid} clients={clients || []} />
    </ProtectedRoute>
  )
}
