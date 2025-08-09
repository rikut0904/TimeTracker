"use client"

import { useMemo, useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import AppHeader from "@/components/AppHeader"
import { useUserSessions } from "@/hooks/useUserSessions"
import { useUserClients } from "@/hooks/useUserClients"
import type { Session } from "@/lib/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Search, Users, User } from "lucide-react"

function formatYmd(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addMonths(date: Date, delta: number) {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"]

export default function SchedulePage() {
    const sessions = useUserSessions()
    const clients = useUserClients()
    const [currentMonth, setCurrentMonth] = useState<Date>(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })
    // カレンダーの表示ステータスはドロップダウンで制御
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<"calendar" | "sessions">("calendar")

    // Sessions tab state (先に宣言して月間集計のフィルタでも使用)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState<"all" | "individual" | "group">("all")
    const [filterStatus, setFilterStatus] = useState<"all" | "planned" | "completed">("all")
    const [filterGroup, setFilterGroup] = useState<string>("all")

    const uniqueGroups = useMemo(() => {
        return Array.from(new Set((clients || []).map((c) => c.group).filter(Boolean))) as string[]
    }, [clients])

    const monthInfo = useMemo(() => {
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)

        const startOffset = start.getDay()
        const calendarStart = new Date(start)
        calendarStart.setDate(start.getDate() - startOffset)

        const endOffset = 6 - end.getDay()
        const calendarEnd = new Date(end)
        calendarEnd.setDate(end.getDate() + endOffset)

        const filtered = sessions.filter((s) => {
            const d = new Date(s.date)
            const inRange = d >= calendarStart && d <= calendarEnd
            const statusOk = filterStatus === "all" || s.status === filterStatus
            return inRange && statusOk
        })

        const byDate = new Map<string, Session[]>()
        for (const s of filtered) {
            const key = formatYmd(new Date(s.date))
            const list = byDate.get(key) || []
            list.push(s)
            byDate.set(key, list)
        }

        const cells: { date: Date; key: string; inMonth: boolean; sessions: Session[] }[] = []
        const cursor = new Date(calendarStart)
        while (cursor <= calendarEnd) {
            const key = formatYmd(cursor)
            const inMonth = cursor.getMonth() === currentMonth.getMonth()
            const daySessions = (byDate.get(key) || []).sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            )
            cells.push({ date: new Date(cursor), key, inMonth, sessions: daySessions })
            cursor.setDate(cursor.getDate() + 1)
        }

        return { start, end, calendarStart, calendarEnd, cells }
    }, [sessions, currentMonth, filterStatus])

    const monthTitle = `${currentMonth.getFullYear()}年 ${currentMonth.getMonth() + 1}月`
    const selectedSessions = selectedDateKey
        ? monthInfo.cells.find((c) => c.key === selectedDateKey)?.sessions ?? []
        : []

    const sessionsFiltered = useMemo(() => {
        const byKeyword = sessions.filter((s) =>
            s.clientName.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        const byType = byKeyword.filter((s) => filterType === "all" || s.type === filterType)
        const byStatus = byType.filter((s) => filterStatus === "all" || s.status === filterStatus)
        const byDate = selectedDateKey
            ? byStatus.filter((s) => formatYmd(new Date(s.date)) === selectedDateKey)
            : byStatus

        const byGroup = filterGroup === "all"
            ? byDate
            : filterGroup === "__none__"
                ? byDate.filter((s) => {
                    const client = clients.find((c) => c.id === s.clientId)
                    return !client?.group
                })
                : byDate.filter((s) => {
                    const client = clients.find((c) => c.id === s.clientId)
                    return client?.group === filterGroup
                })

        return byGroup.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
    }, [sessions, clients, searchTerm, filterType, filterStatus, filterGroup, selectedDateKey])

    const handleSelectDay = (key: string) => {
        setSelectedDateKey(key)
        setActiveTab("sessions")
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <AppHeader />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                        <div className="flex items-center justify-between mb-4">
                            <TabsList>
                                <TabsTrigger value="calendar">カレンダー</TabsTrigger>
                                <TabsTrigger value="sessions">セッション</TabsTrigger>
                            </TabsList>
                            {selectedDateKey && (
                                <div className="text-xs text-gray-600">選択日: {selectedDateKey}</div>
                            )}
                        </div>

                        <TabsContent value="calendar">
                            <Card>
                                <CardHeader className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle>カレンダー</CardTitle>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:items-center">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                                                <SelectTrigger className="w-36 md:w-40">
                                                    <SelectValue placeholder="セッションタイプ" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">すべて</SelectItem>
                                                    <SelectItem value="individual">個人セッション</SelectItem>
                                                    <SelectItem value="group">グループセッション</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                                                <SelectTrigger className="w-28 md:w-36">
                                                    <SelectValue placeholder="ステータス" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">すべて</SelectItem>
                                                    <SelectItem value="completed">完了</SelectItem>
                                                    <SelectItem value="planned">予定</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={filterGroup} onValueChange={(v: any) => setFilterGroup(v)}>
                                                <SelectTrigger className="w-32 md:w-40">
                                                    <SelectValue placeholder="グループ" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">すべてのグループ</SelectItem>
                                                    <SelectItem value="__none__">グループなし</SelectItem>
                                                    {uniqueGroups.map((g) => (
                                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center gap-1 whitespace-nowrap md:justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <div className="min-w-[90px] text-center text-sm font-medium">
                                                {monthTitle}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
                                                今月
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md overflow-hidden border border-gray-200">
                                        <div className="grid grid-cols-7 text-xs text-gray-600">
                                            {weekdayLabels.map((w, i) => (
                                                <div
                                                    key={w}
                                                    className={`p-2 text-center font-medium bg-gray-50 border-b border-gray-200 ${i === 6 ? "" : "border-r"
                                                        } ${i === 0 || i === 5 ? "border-r-2" : ""}`}
                                                >
                                                    {w}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7">
                                            {monthInfo.cells.map((cell, idx) => {
                                                const col = idx % 7
                                                const isLastCol = col === 6
                                                const isLastRow = idx >= monthInfo.cells.length - 7
                                                const thickRight = col === 0 || col === 5
                                                return (
                                                    <div
                                                        key={cell.key}
                                                        className={
                                                            `relative bg-white min-h-[84px] sm:min-h-[110px] p-1 sm:p-2 flex flex-col ` +
                                                            `${cell.inMonth ? "" : "bg-gray-50 text-gray-400"} ` +
                                                            `border-gray-200 border-b ${isLastRow ? "border-b-0" : ""} ` +
                                                            `${isLastCol ? "" : "border-r"} ` +
                                                            `${thickRight && !isLastCol ? "border-r-2" : ""}`
                                                        }
                                                    >
                                                        <div className="sm:flex sm:items-center sm:justify-between">
                                                            <div className={`text-xs sm:text-sm ${cell.inMonth ? "text-gray-900" : "text-gray-400"}`}>{new Date(cell.date).getDate()}</div>
                                                            <div className="flex flex-wrap items-center gap-1 mt-1 sm:mt-0 self-start sm:self-auto">
                                                                {cell.sessions.some((s) => s.status === "completed") && (
                                                                    <Badge className="bg-blue-600 px-1.5 py-0 h-5 text-[10px] leading-none">完</Badge>
                                                                )}
                                                                {cell.sessions.some((s) => s.status === "planned") && (
                                                                    <Badge variant="outline" className="text-blue-700 border-blue-300 px-1.5 py-0 h-5 text-[10px] leading-none">予</Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 space-y-1 hidden sm:block">
                                                            {cell.sessions.slice(0, 3).map((s) => (
                                                                <button
                                                                    key={s.id}
                                                                    className={`w-full text-left truncate rounded px-2 py-1 text-[11px] ${s.status === "completed"
                                                                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                                                                        : "bg-amber-50 text-amber-800 border border-amber-200"
                                                                        }`}
                                                                    onClick={() => handleSelectDay(cell.key)}
                                                                    title={s.clientName}
                                                                >
                                                                    {s.type === "individual" ? (
                                                                        <User className="inline h-3 w-3 mr-1" />
                                                                    ) : (
                                                                        <Users className="inline h-3 w-3 mr-1" />
                                                                    )}
                                                                    {s.clientName}
                                                                </button>
                                                            ))}
                                                            {cell.sessions.length > 3 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 text-[11px] px-1"
                                                                    onClick={() => handleSelectDay(cell.key)}
                                                                >
                                                                    他 {cell.sessions.length - 3} 件
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <button
                                                            className="absolute inset-0 sm:hidden"
                                                            onClick={() => handleSelectDay(cell.key)}
                                                            aria-label="open-day"
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Day Detail Dialog */}
                            <Dialog open={!!selectedDateKey} onOpenChange={(open) => !open && setSelectedDateKey(null)}>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>{selectedDateKey}</DialogTitle>
                                        <DialogDescription>この日のセッション詳細</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3">
                                        {selectedSessions.length === 0 ? (
                                            <div className="text-sm text-gray-500">セッションはありません</div>
                                        ) : (
                                            selectedSessions
                                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                .map((s) => (
                                                    <div key={s.id} className="p-3 border rounded-md">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {s.type === "individual" ? (
                                                                <User className="h-4 w-4 text-blue-600" />
                                                            ) : (
                                                                <Users className="h-4 w-4 text-green-600" />
                                                            )}
                                                            <div className="font-medium">{s.clientName}</div>
                                                            <Badge
                                                                variant={s.status === "completed" ? "default" : "outline"}
                                                                className={s.status === "planned" ? "text-blue-600 border-blue-600" : ""}
                                                            >
                                                                {s.status === "completed" ? "完了" : "予定"}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm text-gray-600 flex flex-wrap items-center gap-3">
                                                            <span>
                                                                {new Date(s.date).toLocaleTimeString("ja-JP", {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                                {s.status === "planned" ? " (予定)" : ""}
                                                            </span>
                                                            <span>{s.duration}分</span>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </TabsContent>

                        <TabsContent value="sessions">
                            <Card>
                                <CardHeader>
                                    <CardTitle>セッション</CardTitle>
                                    <div className="flex items-center space-x-2 flex-1">
                                        <Search className="h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="クライエント名で検索..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row md:justify-end justify-between gap-4 mb-6">
                                        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                                            <SelectTrigger className="w-full sm:w-48">
                                                <SelectValue placeholder="セッションタイプ" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">すべて</SelectItem>
                                                <SelectItem value="individual">個人セッション</SelectItem>
                                                <SelectItem value="group">グループセッション</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                                            <SelectTrigger className="w-full sm:w-48">
                                                <SelectValue placeholder="ステータス" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">すべて</SelectItem>
                                                <SelectItem value="completed">完了</SelectItem>
                                                <SelectItem value="planned">予定</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={filterGroup} onValueChange={(v: any) => setFilterGroup(v)}>
                                            <SelectTrigger className="w-full sm:w-48">
                                                <SelectValue placeholder="グループ" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">すべてのグループ</SelectItem>
                                                <SelectItem value="__none__">グループなし</SelectItem>
                                                {uniqueGroups.map((g) => (
                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="w-full sm:w-40">
                                            <Input
                                                type="date"
                                                value={selectedDateKey || ""}
                                                onChange={(e) => setSelectedDateKey(e.target.value || null)}
                                                placeholder="日付で絞り込む"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {sessionsFiltered.length === 0 ? (
                                            <div className="text-center py-6 text-gray-500">条件に一致するセッションが見つかりません</div>
                                        ) : (
                                            sessionsFiltered.map((s) => (
                                                <div
                                                    key={s.id}
                                                    className={`flex items-center justify-between p-3 border rounded-lg ${s.status === "planned" ? "bg-blue-50 border-blue-200" : "bg-white"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0">
                                                            {s.type === "individual" ? (
                                                                <div className="p-2 bg-blue-100 rounded-full">
                                                                    <User className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                            ) : (
                                                                <div className="p-2 bg-green-100 rounded-full">
                                                                    <Users className="h-5 w-5 text-green-600" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{s.clientName}</span>
                                                                <Badge
                                                                    variant={s.status === "completed" ? "default" : "outline"}
                                                                    className={s.status === "planned" ? "text-blue-600 border-blue-600" : ""}
                                                                >
                                                                    {s.status === "completed" ? "完了" : "予定"}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-xs text-gray-600 mt-1">
                                                                {new Date(s.date).toLocaleString("ja-JP", {
                                                                    year: "numeric",
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    hour: s.status === "completed" ? "2-digit" : undefined,
                                                                    minute: s.status === "completed" ? "2-digit" : undefined,
                                                                })}
                                                                ・{s.duration}分
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </ProtectedRoute>
    )
}


