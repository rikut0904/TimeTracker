"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TabsContent } from "@/components/ui/tabs"

interface UserProfile {
    name: string
    email: string
    studentId: string
    individualGoal: number
    groupGoal: number
}

interface ProfileTabProps {
    profile: UserProfile
    setProfile: (profile: UserProfile) => void
    onSave: () => void
}

export const ProfileTab = ({ profile, setProfile, onSave }: ProfileTabProps) => {
    return (
        <TabsContent value="profile">
            <Card>
                <CardHeader>
                    <CardTitle>個人情報</CardTitle>
                    <CardDescription>あなたの基本情報を設定してください</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">氏名 *</Label>
                            <Input
                                id="name"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="山田 太郎"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                placeholder="example@email.com"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={onSave}>プロフィールを保存</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
} 