"use client"

import { useMemo, useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import AppHeader from "@/components/AppHeader"
import { useUserSessions } from "@/hooks/useUserSessions"
import type { Session } from "@/lib/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Users, User } from "lucide-react"

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

export default function CalendarPage() {
    const sessions = useUserSessions()
    const [currentMonth, setCurrentMonth] = useState<Date>(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })
    const [showPlanned, setShowPlanned] = useState(true)
    const [showCompleted, setShowCompleted] = useState(true)
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

    const monthInfo = useMemo(() => {
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)

        // カレンダーは日曜始まり。最初の週の開始(日)へ、最後の週の終了(土)まで広げる
        const startOffset = start.getDay() // 0=Sun
        const calendarStart = new Date(start)
        calendarStart.setDate(start.getDate() - startOffset)

        const endOffset = 6 - end.getDay()
        const calendarEnd = new Date(end)
        calendarEnd.setDate(end.getDate() + endOffset)

        // 期間内のセッションを抽出
        const filtered = sessions.filter((s) => {
            const d = new Date(s.date)
            return d >= calendarStart && d <= calendarEnd && ((showPlanned && s.status === "planned") || (showCompleted && s.status === "completed"))
        })

        // 日付キーごとにグループ化
        const byDate = new Map<string, Session[]>()
        for (const s of filtered) {
            const key = formatYmd(new Date(s.date))
            const list = byDate.get(key) || []
            list.push(s)
            byDate.set(key, list)
        }

        // 日セルを生成（6行 x 7列 = 42セル）
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
    }, [sessions, currentMonth, showPlanned, showCompleted])

    const monthTitle = `${currentMonth.getFullYear()}年 ${currentMonth.getMonth() + 1}月`

    const selectedSessions = selectedDateKey ? monthInfo.cells.find((c) => c.key === selectedDateKey)?.sessions ?? [] : []

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <AppHeader />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardHeader className="flex sm:flex-row flex-col sm:items-center sm:justify-between gap-4">
                            <div className="flex flex-row flex-wrap items-center gap-2">
                                <CardTitle>カレンダー</CardTitle>

                                <div className="flex items-center gap-2 ml-2">
                                    <Button
                                        variant={showCompleted ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setShowCompleted((v) => !v)}
                                    >
                                        完了
                                    </Button>
                                    <Button
                                        variant={showPlanned ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setShowPlanned((v) => !v)}
                                    >
                                        予定
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="min-w-[90px] text-center text-sm font-medium">{monthTitle}</div>
                                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>今月</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md overflow-hidden border border-gray-200">
                                <div className="grid grid-cols-7 text-xs text-gray-600">
                                    {weekdayLabels.map((w, i) => (
                                        <div
                                            key={w}
                                            className={`p-2 text-center font-medium bg-gray-50 border-b border-gray-200 ${i === 6 ? "" : "border-r"} ${i === 0 || i === 5 ? "border-r-2" : ""
                                                }`}
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
                                        const thickRight = col === 0 || col === 5 // Sun|Fri column gets thick right border
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
                                                            onClick={() => setSelectedDateKey(cell.key)}
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
                                                        <Button variant="ghost" size="sm" className="h-6 text-[11px] px-1" onClick={() => setSelectedDateKey(cell.key)}>
                                                            他 {cell.sessions.length - 3} 件
                                                        </Button>
                                                    )}
                                                </div>
                                                <button
                                                    className="absolute inset-0 sm:hidden"
                                                    onClick={() => setSelectedDateKey(cell.key)}
                                                    aria-label="open-day"
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

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
                                                <Badge variant={s.status === "completed" ? "default" : "outline"} className={s.status === "planned" ? "text-blue-600 border-blue-600" : ""}>
                                                    {s.status === "completed" ? "完了" : "予定"}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-gray-600 flex flex-wrap items-center gap-3">
                                                <span>
                                                    {new Date(s.date).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
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
            </div>
        </ProtectedRoute>
    )
}


