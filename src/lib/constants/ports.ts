// 端口配置常量
export const PORTS = {
    // 主应用端口
    MAIN_APP: 3000,

    // Sandbox 项目端口范围
    SANDBOX_START: 3100,
    SANDBOX_END: 3199,
    SANDBOX_DEFAULT: 3100,

    // 其他可能的端口（用于检测）
    SANDBOX_ALTERNATIVES: [3100, 3101, 3102, 3103],

    // 预览端口
    PREVIEW: 3100,
} as const;

// 获取本机IP地址
function getLocalIP(): string {
    try {
        const os = require('os');
        const interfaces = os.networkInterfaces();

        // 优先获取局域网IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        const localNetworks = ['192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.'];

        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    // 优先返回局域网IP
                    if (localNetworks.some(network => iface.address.startsWith(network))) {
                        return iface.address;
                    }
                }
            }
        }

        // 如果没有找到局域网IP，返回第一个非内部IP
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    } catch (error) {
        console.warn('无法获取本机IP地址:', error);
    }

    return 'localhost';
}

// 获取服务器地址
export function getServerHost(): string {
    // 优先使用环境变量
    if (process.env.SERVER_HOST) {
        return process.env.SERVER_HOST;
    }

    // 在服务器端，尝试获取本机IP
    if (typeof window === 'undefined') {
        // 服务器端逻辑
        return process.env.NEXT_PUBLIC_SERVER_HOST || getLocalIP();
    }

    // 客户端逻辑
    return window.location.hostname;
}


// 获取 Sandbox URL
export function getSandboxUrl(port?: number): string {
    // 检查是否为开发环境
    const isDevelopment = process.env.NODE_ENV === 'development' ||
        process.env.NEXT_PUBLIC_NODE_ENV === 'development' ||
        !process.env.NODE_ENV;

    // 开发环境使用本机IP地址
    if (isDevelopment) {
        const devPort = port || PORTS.SANDBOX_DEFAULT;
        const host = getServerHost();
        const devUrl = `http://${host}:${devPort}`;

        console.log('🔍 开发环境 Sandbox URL:', {
            port: devPort,
            host: host,
            url: devUrl,
            isDevelopment: true
        });

        return devUrl;
    }

    // 生产环境：使用子域名方案，sandbox.wayne.beer
    const productionUrl = process.env.NEXT_PUBLIC_SANDBOX_PREVIEW_URL ||
        process.env.SANDBOX_PREVIEW_URL ||
        'http://sandbox.wayne.beer/';

    // 添加调试日志
    console.log('🔍 生产环境 Sandbox URL:', {
        port,
        isClient: typeof window !== 'undefined',
        windowHost: typeof window !== 'undefined' ? window.location.host : 'N/A',
        generatedUrl: productionUrl,
        isDevelopment: false,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
            NEXT_PUBLIC_SANDBOX_PREVIEW_URL: process.env.NEXT_PUBLIC_SANDBOX_PREVIEW_URL,
            SANDBOX_PREVIEW_URL: process.env.SANDBOX_PREVIEW_URL,
            SERVER_HOST: process.env.SERVER_HOST,
            NEXT_PUBLIC_SERVER_HOST: process.env.NEXT_PUBLIC_SERVER_HOST
        }
    });

    return productionUrl;
}

// 获取主应用 URL
export function getMainAppUrl(port?: number): string {
    const actualPort = port || PORTS.MAIN_APP;
    const host = getServerHost();
    return `http://${host}:${actualPort}`;
}

// 检查端口是否可用
export async function checkPortAvailable(port: number): Promise<boolean> {
    try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        const { stdout } = await execAsync(`lsof -ti:${port}`, { timeout: 5000 });
        const isInUse = stdout.trim().length > 0;

        console.log(`🔍 端口 ${port} 状态: ${isInUse ? '被占用' : '可用'}`);
        return !isInUse;
    } catch (error) {
        // 如果命令失败，假设端口可用
        console.log(`🔍 端口 ${port} 检查失败，假设可用:`, error);
        return true;
    }
}

// 生成端口范围数组
export function generatePortRange(start: number, end: number): number[] {
    const ports: number[] = [];
    for (let port = start; port <= end; port++) {
        ports.push(port);
    }
    return ports;
}

// 查找运行中的 Sandbox 端口
export async function findRunningSandboxPort(): Promise<number | null> {
    try {
        const { findSandboxPorts } = await import('../utils/port-scanner');
        const { running } = await findSandboxPorts();

        // 返回第一个运行中的端口
        return running.length > 0 ? running[0] : null;
    } catch (error) {
        console.warn('智能端口扫描失败，使用传统方式');

        // 回退到传统方式
        for (const port of PORTS.SANDBOX_ALTERNATIVES) {
            const isRunning = !(await checkPortAvailable(port));
            if (isRunning) {
                return port;
            }
        }

        return null;
    }
}

// 查找可用的 Sandbox 端口
export async function findAvailableSandboxPort(): Promise<number> {
    try {
        const { findSandboxPorts } = await import('../utils/port-scanner');
        const { recommended } = await findSandboxPorts();
        return recommended;
    } catch (error) {
        console.warn('智能端口扫描失败，使用传统方式');

        // 回退到传统方式
        for (const port of PORTS.SANDBOX_ALTERNATIVES) {
            const isAvailable = await checkPortAvailable(port);
            if (isAvailable) {
                return port;
            }
        }

        // 如果没有找到可用端口，返回默认端口
        return PORTS.SANDBOX_DEFAULT;
    }
}
