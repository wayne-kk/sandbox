// 端口配置常量
export const PORTS = {
    // 主应用端口
    MAIN_APP: 3000,

    // Sandbox 项目端口范围
    SANDBOX_START: 3100,
    SANDBOX_END: 3199,
    SANDBOX_DEFAULT: 3100,

    // 其他可能的端口（用于检测）
    SANDBOX_ALTERNATIVES: [3100, 3103, 3001, 3000],

    // 预览端口
    PREVIEW: 3100,
} as const;

// 获取服务器地址
export function getServerHost(): string {
    // 优先使用环境变量
    if (process.env.SERVER_HOST) {
        return process.env.SERVER_HOST;
    }

    // 在服务器端，尝试获取公网IP
    if (typeof window === 'undefined') {
        // 服务器端逻辑
        return process.env.NEXT_PUBLIC_SERVER_HOST || 'localhost';
    }

    // 客户端逻辑
    return window.location.hostname;
}

// 获取外部访问地址（考虑外部Nginx）
export function getExternalUrl(path: string = ''): string {
    // 检查是否在客户端环境
    if (typeof window !== 'undefined') {
        // 客户端：使用当前域名和协议
        return `${window.location.protocol}//${window.location.host}${path}`;
    }

    // 服务器端：使用配置的域名
    const domain = process.env.EXTERNAL_DOMAIN || process.env.SERVER_HOST || 'localhost';
    const protocol = process.env.EXTERNAL_PROTOCOL || 'http';
    const port = process.env.EXTERNAL_PORT || '';

    return `${protocol}://${domain}${port ? ':' + port : ''}${path}`;
}

// 获取 Sandbox URL
export function getSandboxUrl(port?: number): string {
    // 直接使用环境变量中配置的固定地址
    const url = process.env.SANDBOX_PREVIEW_URL || 'http://115.190.100.24/sandbox/';

    // 添加调试日志
    console.log('🔍 getSandboxUrl调试:', {
        port,
        isClient: typeof window !== 'undefined',
        windowHost: typeof window !== 'undefined' ? window.location.host : 'N/A',
        generatedUrl: url,
        env: {
            SANDBOX_PREVIEW_URL: process.env.SANDBOX_PREVIEW_URL,
            SERVER_HOST: process.env.SERVER_HOST,
            NEXT_PUBLIC_SERVER_HOST: process.env.NEXT_PUBLIC_SERVER_HOST
        }
    });

    return url;
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

        const { stdout } = await execAsync(`lsof -ti:${port}`);
        return !stdout.trim();
    } catch (error) {
        // 如果命令失败，假设端口可用
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
