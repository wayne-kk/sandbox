import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 快速扫描端口范围
export async function scanPortRange(startPort: number, endPort: number): Promise<number[]> {
    const runningPorts: number[] = [];

    // 使用逐个检查的方式，更可靠
    for (let port = startPort; port <= endPort; port++) {
        try {
            const { stdout } = await execAsync(`lsof -ti:${port}`);
            if (stdout.trim()) {
                runningPorts.push(port);
            }
        } catch (error) {
            // 端口未被占用
        }
    }

    return runningPorts;
}

// 检查特定端口是否被占用
export async function isPortInUse(port: number): Promise<boolean> {
    try {
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        return stdout.trim().length > 0;
    } catch (error) {
        return false;
    }
}

// 查找运行中的 Next.js 开发服务器
export async function findNextDevServers(): Promise<number[]> {
    try {
        // 查找所有运行中的 Next.js 进程
        const { stdout } = await execAsync(`ps aux | grep "next dev" | grep -v grep`);
        const lines = stdout.trim().split('\n');

        const ports: number[] = [];
        for (const line of lines) {
            // 从进程信息中提取端口号
            const portMatch = line.match(/--port\s+(\d+)/);
            if (portMatch) {
                ports.push(parseInt(portMatch[1]));
            }
        }

        return ports;
    } catch (error) {
        return [];
    }
}

// 智能查找 Sandbox 端口
export async function findSandboxPorts(): Promise<{
    running: number[];
    available: number[];
    recommended: number;
}> {
    // 扫描 3100-3199 范围
    const runningPorts = await scanPortRange(3100, 3199);

    // 查找可用的端口
    const availablePorts: number[] = [];
    for (let port = 3100; port <= 3199; port++) {
        if (!runningPorts.includes(port)) {
            availablePorts.push(port);
        }
    }

    // 推荐端口（优先使用 3100，如果被占用则使用第一个可用端口）
    const recommended = availablePorts.includes(3100) ? 3100 : availablePorts[0] || 3100;

    return {
        running: runningPorts,
        available: availablePorts,
        recommended
    };
}
