"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { User, Users, TrendingUp } from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import AppHeader from "@/components/AppHeader"
import { Button } from "@/components/ui/button"
import { useUserSessions } from "@/hooks/useUserSessions"

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  status: "active" | "inactive"
}

export default function Reports() {
  const { userProfile } = useAuth()
  const sessions = useUserSessions()
  const [clients, setClients] = useState<Client[]>([]) // clients state is still needed for client-specific reports

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

  // クライアント別の個人セッション時間
  const individualSessionsByClient = sessions
    .filter((s) => s.type === "individual" && s.status === "completed")
    .reduce(
      (acc, session) => {
        if (!acc[session.clientId]) {
          acc[session.clientId] = {
            clientName: session.clientName,
            totalHours: 0,
            sessionCount: 0,
          }
        }
        acc[session.clientId].totalHours += session.duration / 60
        acc[session.clientId].sessionCount += 1
        return acc
      },
      {} as Record<string, { clientName: string; totalHours: number; sessionCount: number }>,
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
          }
        }
        acc[session.clientId].totalHours += session.duration / 60
        acc[session.clientId].sessionCount += 1
        return acc
      },
      {} as Record<string, { clientName: string; totalHours: number; sessionCount: number }>,
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
              <CardTitle>個人セッション時間</CardTitle>
              <CardDescription>クライアント別の個人セッション詳細</CardDescription>
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
                            <div className="text-sm text-muted-foreground">{data.sessionCount}回のセッション</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{data.totalHours.toFixed(1)}[h]</div>
                          <Button variant="ghost" size="sm" className="text-blue-600">
                            詳細
                          </Button>
                        </div>
                      </div>
                    ))}
                  {Object.keys(individualSessionsByClient).length > 5 && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">上位5クライアントを表示中</p>
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
              <CardTitle>グループセッション時間</CardTitle>
              <CardDescription>グループ別のセッション詳細</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(groupSessionsByClient).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">グループセッションの記録がありません</p>
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
                            <div className="text-sm text-muted-foreground">{data.sessionCount}回のセッション</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{data.totalHours.toFixed(1)}[h]</div>
                          <Button variant="ghost" size="sm" className="text-blue-600">
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
    </ProtectedRoute>
  )
}
