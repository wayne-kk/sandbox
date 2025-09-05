import { NextResponse } from 'next/server';
import { findSandboxPorts } from '@/lib/utils/port-scanner';

// 获取 Sandbox 端口状态
export async function GET() {
    try {
        console.log('🔍 扫描 Sandbox 端口状态...');
        
        const portInfo = await findSandboxPorts();
        
        return NextResponse.json({
            success: true,
            data: {
                running: portInfo.running,
                available: portInfo.available,
                recommended: portInfo.recommended,
                total: portInfo.running.length + portInfo.available.length,
                range: '3100-3199'
            },
            message: `找到 ${portInfo.running.length} 个运行中的端口，${portInfo.available.length} 个可用端口`
        });
    } catch (error) {
        console.error('端口扫描失败:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: '端口扫描失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}
