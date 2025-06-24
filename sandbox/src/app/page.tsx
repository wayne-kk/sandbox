export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-6xl font-bold text-gray-800 mb-6">
          🚀 Next.js 沙箱
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          欢迎使用在线代码编辑器！你可以编辑任何文件，代码会自动保存。
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">🛠️ 功能特点</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 text-left">
              <li>实时代码编辑</li>
              <li>自动保存文件</li>
              <li>完整项目运行</li>
              <li>Docker 沙箱隔离</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-green-600">🎯 快速开始</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 text-left">
              <li>编辑左侧文件</li>
              <li>点击运行项目</li>
              <li>访问 localhost:3001</li>
              <li>查看实时效果</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800">
            💡 提示：首次运行需要安装依赖，请耐心等待
          </p>
        </div>
        
        <div className="mt-8">
          <p className="text-sm text-gray-500">
            当前时间: {new Date().toLocaleString('zh-CN')}
          </p>
        </div>
      </div>
    </div>
  );
}
