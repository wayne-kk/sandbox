"use client"

import { useState } from "react"
import { Calendar, Check, Settings, User, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

export default function Home() {
  const [progress, setProgress] = useState(33)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-10 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            shadcn/ui 组件展示
          </h1>
          <p className="text-lg text-muted-foreground">
            Next.js + shadcn/ui + Tailwind CSS + Lucide Icons 模板项目
          </p>
        </div>

        <Tabs defaultValue="forms" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forms">表单组件</TabsTrigger>
            <TabsTrigger value="display">数据展示</TabsTrigger>
            <TabsTrigger value="feedback">反馈组件</TabsTrigger>
            <TabsTrigger value="navigation">导航组件</TabsTrigger>
          </TabsList>

          <TabsContent value="forms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>基础表单</CardTitle>
                  <CardDescription>输入框、按钮、开关等</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input id="email" type="email" placeholder="请输入邮箱" />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <Label htmlFor="terms">同意条款</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="notifications" />
                    <Label htmlFor="notifications">启用通知</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button>提交</Button>
                    <Button variant="outline">取消</Button>
                    <Button variant="ghost">
                      <Star className="h-4 w-4 mr-2" />
                      收藏
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>进度和状态</CardTitle>
                  <CardDescription>进度条、标签等状态组件</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>进度: {progress}%</Label>
                    <Progress value={progress} />
                    <Button 
                      onClick={() => setProgress(Math.min(100, progress + 10))}
                      size="sm"
                    >
                      增加进度
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>状态标签</Label>
                    <div className="flex gap-2">
                      <Badge>默认</Badge>
                      <Badge variant="secondary">次要</Badge>
                      <Badge variant="outline">轮廓</Badge>
                      <Badge variant="destructive">危险</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>头像</Label>
                    <div className="flex gap-2">
                      <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <Avatar>
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>数据展示组件</CardTitle>
                <CardDescription>展示各种数据的组件</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  包含表格、卡片、轮播等数据展示组件
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <div className="space-y-4">
              <Alert>
                <Check className="h-4 w-4" />
                <AlertTitle>成功!</AlertTitle>
                <AlertDescription>
                  操作已成功完成。
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>
                  发生了一个错误，请重试。
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>导航组件</CardTitle>
                <CardDescription>菜单、面包屑、分页等导航组件</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  包含导航菜单、面包屑、分页等导航组件
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">🎉 项目配置完成!</h3>
              <p className="text-muted-foreground">
                这个 Next.js 项目已经包含了所有 shadcn/ui 组件、Tailwind CSS 和 Lucide 图标
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Badge variant="outline">Next.js 15</Badge>
                <Badge variant="outline">shadcn/ui</Badge>
                <Badge variant="outline">Tailwind CSS v4</Badge>
                <Badge variant="outline">Lucide Icons</Badge>
                <Badge variant="outline">TypeScript</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}