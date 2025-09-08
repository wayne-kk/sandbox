// 测试环境变量调试脚本
console.log('🔍 环境变量调试:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SERVER_HOST:', process.env.SERVER_HOST);
console.log('NEXT_PUBLIC_SERVER_HOST:', process.env.NEXT_PUBLIC_SERVER_HOST);
console.log('EXTERNAL_DOMAIN:', process.env.EXTERNAL_DOMAIN);
console.log('EXTERNAL_PROTOCOL:', process.env.EXTERNAL_PROTOCOL);
console.log('EXTERNAL_PORT:', process.env.EXTERNAL_PORT);
console.log('SANDBOX_PREVIEW_URL:', process.env.SANDBOX_PREVIEW_URL);

// 测试 getSandboxUrl 函数
function getSandboxUrl(port) {
    const url = process.env.SANDBOX_PREVIEW_URL || 'http://115.190.100.24/sandbox/';
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

console.log('测试 getSandboxUrl(3100):', getSandboxUrl(3100));
console.log('测试 getSandboxUrl(3101):', getSandboxUrl(3101));
