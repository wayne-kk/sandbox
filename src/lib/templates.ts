// 项目模板管理

import path from 'path';
import fs from 'fs/promises';

export interface Template {
  name: string;
  description: string;
  type: 'nextjs' | 'react';
}

export const templates: Template[] = [
  {
    name: 'nextjs-starter',
    description: 'Next.js 14 with TypeScript and Tailwind CSS',
    type: 'nextjs'
  },
  {
    name: 'react-vite',
    description: 'React with Vite, TypeScript and Tailwind CSS',
    type: 'react'
  }
];

export async function createProjectFromTemplate(templateName: string, projectPath: string) {
  const template = templates.find(t => t.name === templateName);
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  if (template.type === 'nextjs') {
    // 使用现有的 sandbox 作为模板
    await copyTemplate(path.join(process.cwd(), 'sandbox'), projectPath);
  } else if (template.type === 'react') {
    // 创建 React Vite 项目
    await createReactViteProject(projectPath);
  }
}

async function copyTemplate(sourcePath: string, targetPath: string) {
  try {
    // 确保目标目录存在
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    // 复制整个目录
    await fs.cp(sourcePath, targetPath, {
      recursive: true,
      filter: (src) => {
        // 排除 node_modules, .next, .git 等目录
        const relativePath = path.relative(sourcePath, src);
        return !relativePath.includes('node_modules') &&
          !relativePath.includes('.next') &&
          !relativePath.includes('.git') &&
          !relativePath.includes('package-lock.json');
      }
    });

    console.log(`Template copied from ${sourcePath} to ${targetPath}`);
  } catch (error) {
    console.error('Error copying template:', error);
    throw error;
  }
}

async function createReactViteProject(projectPath: string) {
  // 创建基本的 React Vite 项目结构
  const files = {
    'package.json': {
      "name": "react-vite-project",
      "private": true,
      "version": "0.0.0",
      "type": "module",
      "scripts": {
        "dev": "vite --port 3001",
        "build": "tsc && vite build",
        "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        "preview": "vite preview"
      },
      "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      },
      "devDependencies": {
        "@types/react": "^18.2.15",
        "@types/react-dom": "^18.2.7",
        "@typescript-eslint/eslint-plugin": "^6.0.0",
        "@typescript-eslint/parser": "^6.0.0",
        "@vitejs/plugin-react": "^4.0.3",
        "autoprefixer": "^10.4.14",
        "eslint": "^8.45.0",
        "eslint-plugin-react-hooks": "^4.6.0",
        "eslint-plugin-react-refresh": "^0.4.3",
        "postcss": "^8.4.27",
        "tailwindcss": "^3.3.0",
        "typescript": "^5.0.2",
        "vite": "^4.4.5"
      }
    },
    'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001
  }
})`,
    'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + Vite</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
    'src/App.tsx': `import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-6xl font-bold text-gray-800 mb-6">
          ⚛️ React + Vite
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          快速、现代的 React 开发环境
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">⚡ Vite 特性</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 text-left">
              <li>极速热重载</li>
              <li>ES 模块支持</li>
              <li>TypeScript 内置</li>
              <li>优化的构建</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-pink-600">🚀 开发体验</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 text-left">
              <li>React 18</li>
              <li>Tailwind CSS</li>
              <li>ESLint 配置</li>
              <li>开箱即用</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8">
          <button 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
            onClick={() => alert('Hello from React + Vite!')}
          >
            点击测试
          </button>
        </div>
      </div>
    </div>
  )
}

export default App`,
    'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  padding: 0;
}`,
    'src/App.css': `/* App specific styles */`,
    'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
    'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    'tsconfig.json': {
      "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true
      },
      "include": ["src"],
      "references": [{ "path": "./tsconfig.node.json" }]
    },
    'tsconfig.node.json': {
      "compilerOptions": {
        "composite": true,
        "skipLibCheck": true,
        "module": "ESNext",
        "moduleResolution": "bundler",
        "allowSyntheticDefaultImports": true
      },
      "include": ["vite.config.ts"]
    }
  };

  await fs.mkdir(projectPath, { recursive: true });

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(projectPath, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    if (typeof content === 'string') {
      await fs.writeFile(fullPath, content);
    } else {
      await fs.writeFile(fullPath, JSON.stringify(content, null, 2));
    }
  }
} 