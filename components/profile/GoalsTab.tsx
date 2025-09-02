"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TabsContent } from "@/components/ui/tabs"
import { DEFAULT_GOALS } from "@/lib/constants"

interface UserProfile {
    name: string
    email: string
    studentId: string
    individualGoal: number
    groupGoal: number
}

interface GoalsTabProps {
    profile: UserProfile
    setProfile: (profile: UserProfile) => void
    onSave: () => void
}

export const GoalsTab = ({ profile, setProfile, onSave }: GoalsTabProps) => {
    return (
        <TabsContent value="goals">
            <Card>
                <CardHeader>
                    <CardTitle>目標時間設定</CardTitle>
                    <CardDescription>実習に必要な時間数を設定してください</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="individualGoal">個人セッション目標時間</Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="individualGoal"
                                    type="number"
                                    value={profile.individualGoal}
                                    onChange={(e) =>
                                        setProfile({ ...profile, individualGoal: Number.parseInt(e.target.value) || DEFAULT_GOALS.INDIVIDUAL })
                                    }
                                    min="1"
                                />
                                <span className="text-sm text-muted-foreground">時間</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="groupGoal">グループセッション目標時間</Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="groupGoal"
                                    type="number"
                                    value={profile.groupGoal}
                                    onChange={(e) =>
                                        setProfile({ ...profile, groupGoal: Number.parseInt(e.target.value) || DEFAULT_GOALS.GROUP })
                                    }
                                    min="1"
                                />
                                <span className="text-sm text-muted-foreground">時間</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">現在の設定</h4>
                        <div className="text-sm text-blue-800">
                            <p>個人セッション: {profile.individualGoal}時間</p>
                            <p>グループセッション: {profile.groupGoal}時間</p>
                            <p>合計目標: {profile.individualGoal + profile.groupGoal}時間</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={onSave}>設定を保存</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
} 