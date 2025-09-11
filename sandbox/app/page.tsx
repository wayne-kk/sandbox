
export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-white text-2xl">👁️</span>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          实时预览窗口
        </h1>
        
        {/* Description */}
        <p className="text-lg text-gray-600 mb-8">
          这是一个实时预览窗口，用于展示和测试你的 React 组件
        </p>
        
        {/* Status */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium text-sm">预览系统运行中</span>
          </div>
        </div>
      </div>
    </main>
  );
}
