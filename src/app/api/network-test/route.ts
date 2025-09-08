import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url') || 'http://152.136.41.186:32422/v1/workflows/run';

    console.log(`🔍 测试网络连接: ${targetUrl}`);

    try {
        // 测试基本连接
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

        const response = await fetch(targetUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'v0-sandbox-network-test'
            }
        });

        clearTimeout(timeoutId);

        return NextResponse.json({
            success: true,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            message: '连接成功'
        });

    } catch (error) {
        console.error('网络测试失败:', error);

        let errorMessage = '未知错误';
        let errorType = 'unknown';

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                errorMessage = '连接超时 (10秒)';
                errorType = 'timeout';
            } else if (error.message.includes('fetch failed')) {
                errorMessage = '连接失败，可能是网络不通或服务不可用';
                errorType = 'connection_failed';
            } else if (error.message.includes('ConnectTimeoutError')) {
                errorMessage = '连接超时，可能是防火墙阻止或服务不可用';
                errorType = 'connect_timeout';
            } else {
                errorMessage = error.message;
                errorType = 'other';
            }
        }

        return NextResponse.json({
            success: false,
            error: errorMessage,
            errorType: errorType,
            targetUrl: targetUrl,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url') || 'http://152.136.41.186:32422/v1/workflows/run';

    console.log(`🔍 测试 POST 请求: ${targetUrl}`);

    try {
        const testPayload = {
            inputs: {
                query: "test",
                project_type: "nextjs",
                component_type: "component"
            },
            response_mode: "blocking",
            conversation_id: "",
            user: "network-test"
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'v0-sandbox-network-test'
            },
            body: JSON.stringify(testPayload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();

        return NextResponse.json({
            success: true,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 500),
            message: 'POST 请求成功'
        });

    } catch (error) {
        console.error('POST 网络测试失败:', error);

        let errorMessage = '未知错误';
        let errorType = 'unknown';

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                errorMessage = 'POST 请求超时 (15秒)';
                errorType = 'timeout';
            } else if (error.message.includes('fetch failed')) {
                errorMessage = 'POST 请求失败，可能是网络不通或服务不可用';
                errorType = 'connection_failed';
            } else if (error.message.includes('ConnectTimeoutError')) {
                errorMessage = 'POST 请求连接超时，可能是防火墙阻止或服务不可用';
                errorType = 'connect_timeout';
            } else {
                errorMessage = error.message;
                errorType = 'other';
            }
        }

        return NextResponse.json({
            success: false,
            error: errorMessage,
            errorType: errorType,
            targetUrl: targetUrl,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
