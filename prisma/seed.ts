import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 开始填充数据库...');

    // 创建React模板
    const reactTemplate = await prisma.template.upsert({
        where: { name: 'react-typescript-starter' },
        update: {},
        create: {
            name: 'react-typescript-starter',
            displayName: 'React + TypeScript 启动器',
          description: '使用React 18 + TypeScript + Vite的现代化前端项目模板',
          framework: 'react',
        },
    });

    // 创建模板文件
    const templateFiles = [
        {
            filePath: 'src/App.tsx',
            content: `import React from 'react';
import './App.css';

function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React + TypeScript 🚀</h1>
        <p>你好，V0 Sandbox！</p>
        <button onClick={() => setCount(count + 1)}>
          点击次数: {count}
        </button>
      </header>
    </div>
  );
}

export default App;`,
            fileType: 'typescript',
            isEntryPoint: true,
        },
        {
            filePath: 'src/main.tsx',
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
            fileType: 'typescript',
        },
        {
            filePath: 'src/App.css',
            content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}

button {
  background-color: #61dafb;
  border: none;
  color: #282c34;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
}

button:hover {
  background-color: #21a0c4;
}`,
            fileType: 'css',
        },
        {
            filePath: 'src/index.css',
            content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

#root {
  width: 100%;
  height: 100vh;
}`,
            fileType: 'css',
        },
        {
            filePath: 'index.html',
            content: `<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + TypeScript App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
            fileType: 'html',
        },
        {
            filePath: 'package.json',
            content: `{
  "name": "react-typescript-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}`,
            fileType: 'json',
        },
        {
            filePath: 'vite.config.ts',
            content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});`,
            fileType: 'typescript',
        }
    ];

    for (const file of templateFiles) {
        await prisma.templateFile.upsert({
            where: {
                templateId_filePath: {
                    templateId: reactTemplate.id,
                    filePath: file.filePath,
                }
            },
            update: {},
            create: {
                templateId: reactTemplate.id,
                ...file,
            },
        });
    }

    console.log(`📄 创建模板文件: ${templateFiles.length} 个`);

    // 创建Vue模板
    const vueTemplate = await prisma.template.upsert({
        where: { name: 'vue-typescript-starter' },
        update: {},
        create: {
            name: 'vue-typescript-starter',
            displayName: 'Vue + TypeScript 启动器',
          description: '使用Vue 3 + TypeScript + Vite的现代化前端项目模板',
          framework: 'vue',
        },
    });

    const vueFiles = [
        {
            filePath: 'src/App.vue',
            content: `<template>
  <div id="app">
    <header>
      <h1>Vue + TypeScript 🚀</h1>
      <p>你好，V0 Sandbox！</p>
      <button @click="increment">
        点击次数: {{ count }}
      </button>
    </header>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);

const increment = () => {
  count.value++;
};
</script>

<style scoped>
#app {
  text-align: center;
}

header {
  background-color: #42b883;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}

button {
  background-color: #35495e;
  border: none;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
}

button:hover {
  background-color: #2c3e50;
}
</style>`,
            fileType: 'vue',
            isEntryPoint: true,
        },
        {
            filePath: 'src/main.ts',
            content: `import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');`,
            fileType: 'typescript',
        },
        {
            filePath: 'index.html',
            content: `<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue + TypeScript App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
            fileType: 'html',
        }
    ];

    for (const file of vueFiles) {
        await prisma.templateFile.upsert({
            where: {
                templateId_filePath: {
                    templateId: vueTemplate.id,
                    filePath: file.filePath,
                }
            },
            update: {},
            create: {
                templateId: vueTemplate.id,
                ...file,
            },
        });
    }

    console.log(`🔧 创建Vue模板文件: ${vueFiles.length} 个`);

    console.log('✅ 数据库填充完成！');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ 填充失败:', e);
        await prisma.$disconnect();
        process.exit(1);
    }); 