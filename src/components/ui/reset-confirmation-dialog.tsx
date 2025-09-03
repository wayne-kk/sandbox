import * as React from "react"
import { AlertTriangle, RotateCcw, X } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface ResetConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isResetting?: boolean
}

export function ResetConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isResetting = false
}: ResetConfirmationDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isResetting && onOpenChange(false)}
      />
      
      {/* 对话框 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle size={20} />
            <h2 className="text-lg font-semibold">重置Sandbox确认</h2>
          </div>
          <button
            onClick={() => !isResetting && onOpenChange(false)}
            disabled={isResetting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">此操作将会：</p>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-800">删除自定义组件</p>
                <p className="text-sm text-gray-600">components/ 下除了 ui 文件夹外的所有组件</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-800">清理 app 目录</p>
                <p className="text-sm text-gray-600">删除除了 favicon.ico, globals.css, layout.tsx, page.tsx 外的所有文件</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-800">重置核心页面文件</p>
                <p className="text-sm text-gray-600">恢复 layout.tsx 和 page.tsx 到原始状态</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-800">保留重要内容</p>
                <p className="text-sm text-gray-600">components/ui、依赖包、配置文件等将被保留</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>⚠️ 警告：</strong> 此操作无法撤销，自定义组件和页面修改将丢失！
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 p-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isResetting}
          >
            取消
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isResetting}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isResetting ? (
              <>
                <RotateCcw size={16} className="mr-2 animate-spin" />
                重置中...
              </>
            ) : (
              <>
                <RotateCcw size={16} className="mr-2" />
                确认重置
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
